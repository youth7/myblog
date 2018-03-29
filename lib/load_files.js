"use strict";
const config = {
	html: true,
	linkify: true,
	typographer: true
};
const md = require("markdown-it")(config)
	.use(require("markdown-it-mathjax")())
	.use(require("markdown-it-highlightjs"));

const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const stat = promisify(fs.stat.bind(fs));
const readFile = promisify(fs.readFile.bind(fs));
const readdir = promisify(fs.readdir.bind(fs));
const cache = {};
const defaultEncoding = "utf-8";
const crypto = require("crypto");
const {
	mdStr,
	scriptStr,
	getNavigator
} = require("./add_common.js");

const getETagValue = function(content) {
	const hash = crypto.createHash("sha256");
	hash.update(content, defaultEncoding);
	return hash.digest("hex");
};
const getExpire = function() {
	const oneMonth = 30 * 24 * 60 * 60 * 1000;
	return new Date(Date.now() + oneMonth);
};


const parseFile = async function(file) {
	let content, encoding;
	if (file.endsWith(".md")) {
		let rawMd = await readFile(file, encoding = defaultEncoding);
		rawMd = scriptStr + getNavigator(file) + mdStr + rawMd;
		content = md.render(rawMd);
	} else {
		content = await readFile(file);
	}
	const eTag = getETagValue(content, encoding);
	const lastModified = (await stat(file)).mtime;
	const expires = getExpire();
	console.log(eTag, lastModified, expires);
	return {
		content,
		eTag,
		lastModified,
		expires
	};
};
const loadFileFromDisk = async function(path) {
	let result;
	try {
		result = await stat(path);
		if (result.isFile()) {
			cache[path] = await parseFile(path);
			console.log("文件加入缓存", path);
			return cache[path];
		} else {
			console.warn("不支持的文件", path);
			return null;
		}
	} catch (e) {
		console.error("文件真的不存在", e);
	}

};

const loadDirFromDisk = async function(dir) {
	try {
		console.log("加载文件夹", dir);
		const files = await readdir(dir);
		for (const file of files) {
			if ((await stat(path.join(dir, file))).isFile()) {
				await loadFileFromDisk(path.join(dir, file));
			} else {
				await loadDirFromDisk(path.join(dir, file));
			}
		}
	} catch (e) {
		console.error(e);
	}

};

const getByPathname = async function(pathname) {
	let content = cache[pathname];
	if (content) {
		//console.log("缓存命中", pathname);
		return content;
	} else {
		content = await loadFileFromDisk(pathname);
	}
	return content;
};
const deleteByPathname = function(pathname) {
	delete cache[pathname];
};

const deleteDir = function(dir) {
	Object.keys(cache).forEach(key => {
		if (key.startsWith(dir)) {
			delete cache[key];
		}
	});
};
const isFileInCache = function(pathname, type = "file") {
	if (type === "file") {
		console.log("检查文件是否在缓存中");
		return cache[pathname] === undefined;
	} else {
		console.log("检查dir是否在缓存中");
		return Object.keys(cache).some(key => key.startsWith(pathname));
	}
};
module.exports = {
	getByPathname,
	deleteByPathname,
	deleteDir,
	isFileInCache,
	loadFileFromDisk,
	loadDirFromDisk
};