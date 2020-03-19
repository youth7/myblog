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
	const eTag = req.headers["if-none-match"];
	if (eTag === content.eTag) {
		//console.log("eTag相等", eTag);
		return true;
	} else {
		return false;
	}
};

const getContentType =function(pathname){
	let extendName = require("path").extname(pathname);
	if(extendName.endsWith(".md")){
		extendName = extendName.replace(".md", ".html");	
	}
	return require("mime-types").contentType(extendName);
} 

async function showContent(req, res, pathname, type) {
	let content = await loadFiles.getByPathname(path.join(__dirname, pathname));
	if (!content) {
		console.warn("404 in ", type);
		show404(req, res);
	} else if (notModified(req, content)) {
		show304(req, res);
	} else {
		res.setHeader("Content-Type", getContentType(pathname));
		res.setHeader("Etag", content.eTag);

		res.end(content.content);
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
	server.listen(9999);
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