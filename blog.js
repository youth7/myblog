"use strict";
const http = require("http");
const url = require("url");
const path = require("path");
const loadFiles = require("./lib/load_files");

function getArticle(req, res) {
	if (req.url === "/") req.url = "/mds/index.md";
	const pathname = url.parse(req.url).pathname;
	showContent(req, res, pathname);
}
const notModified = function(req, content) {
	//const mtime = req.headers["if-modified-since"] || 0;
	const eTag = req.headers["if-none-match"];
	/*if (new Date(mtime).getTime() === content.lastModified.getTime()) {
		console.log("mtime相等", mtime, content.lastModified.getTime());
		return true;
	} else */
	if (eTag === content.eTag) {
		//console.log("eTag相等", eTag);
		return true;
	} else {
		return false;
	}
};
async function showContent(req, res, pathname, type) {
	let content = await loadFiles.getByPathname(path.join(__dirname, pathname));
	if (!content) {
		console.warn("404 in ", type);
		show404(req, res);
	} else if (notModified(req, content)) {
		show304(req, res);
	} else {
		res.setHeader("Content-Type", getContentType(pathname));
		//因为md文件存在动态更新问题，目前先暂时停止一切lastModified和expires的缓存
		//res.setHeader("Last-Modified", content.lastModified.toISOString());
		res.setHeader("Etag", content.eTag);
		//res.setHeader("Expires", content.expires.toISOString());
		res.end(content.content);
	}

}

function getContentTypeByExtname(pathname) {
	const extname = path.extname(pathname);
	switch (extname) {
		case ".md":
			return "text/html;charset=UTF-8";
		case ".css":
			return "text/css";
		case ".js":
			return "application/x-javascript";
		case ".jpg":
			return "image/jpeg";
		case ".pdf":
			return "application/pdf";
		default:
			return null;
	}
}

function getContentType(pathname) {
	let type = getContentTypeByExtname(pathname);
	if (type) {
		return type;
	} else {
		return getContentTypeByPathname(pathname.split("/")[1]);
	}
}

function getContentTypeByPathname(type) {
	switch (type) {
		case "css": //优先判断这种，其实下面几种已经没有必要判断
			return "text/css";
		case "script":
			return "application/x-javascript";
			/*		case "mds":
						return "text/html;charset=UTF-8";
					case "imgs":
						return "image/jpeg";*/
		default:
			return "";
	}
}

function show404(req, res) {
	console.error(`非法路径请求${req.url}`);
	res.statusCode = 404;
	res.end();
}

function show304(req, res) {
	console.warn(`资源没有改变${req.url}`);
	res.statusCode = 304;
	res.end();
}
async function watchDir() {
	await require("./lib/monitor")(path.join(__dirname, "./mds"));
	await require("./lib/monitor")(path.join(__dirname, "./css"));
	await require("./lib/monitor")(path.join(__dirname, "./imgs"));
}

function startServer() {
	const server = http.createServer(getArticle);
	server.listen(8888);
}

async function start() {
	try {
		await watchDir();
		startServer();
	} catch (e) {
		console.error(e);
	}
}

start();