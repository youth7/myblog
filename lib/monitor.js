"use strict";
const fs = require("fs");
const promisify = require("util").promisify;
const stat = promisify(fs.stat.bind(fs));
const readdir = promisify(fs.readdir.bind(fs));
const path = require("path");
const loadFiles = require("./load_files.js");
const watchers = {};
const stopWatch = function(filename) {
	watchers[filename].close();
	delete watchers[filename];
};
const handleChangeEvent = async function(filename) {
	if ((await stat(filename)).isDirectory()) {
		console.log("忽略文件夹的change事件", filename);
		return;
	}
	console.log("reload修改后的新文件", filename);
	loadFiles.loadFileFromDisk(filename);
};
const isDirectory = function(path) {
	return watchers[path] !== undefined;
};
const handleRenameEvent = async function(filename) {
	//当有文件被重命名的时候，会产生2个rename事件，分别表示旧文件的消失和新文件的产生。

	const fileDisappear = function() {
		console.log("文件消失", filename);
		loadFiles.deleteByPathname(filename);
	};
	const fileAppear = async function() {
		console.log("文件出现", filename);
		await loadFiles.loadFileFromDisk(filename);
	};
	const dirDisappear = function() {
		console.log("文件夹消失", filename);
		stopWatch(filename);
		loadFiles.deleteDir(filename);
	};
	const dirAppear = async function() {
		console.log("文件夹出现", filename);
		console.log("重新watch目录", filename);
		watchDir(filename);
		loadFiles.loadDirFromDisk(filename);
	};
	let result;
	try {
		result = await stat(filename);
		if (result.isFile()) {
			await fileAppear();
		} else if (result.isDirectory()) {
			await dirAppear();
		}
	} catch (e) {
		console.error("错误，file不存在", filename);
		if (isDirectory(filename)) {
			dirDisappear();
		} else {
			fileDisappear();
		}
	}
};
const getReloadFileFunc = function(dir) {
	return function(type, filename) {
		console.log("事件源是", dir, "类型", type, "改变的文件",filename);
		filename = path.join(dir, filename);
		if (type === "change") {
			handleChangeEvent(filename);
		} else {
			handleRenameEvent(filename);
		}
	};
};
const watchDir = async function(dir) {
	const result = await stat(dir);
	if (!result.isDirectory()) {
		return;
	}
	console.log("watch文件夹", dir);
	const watcher = fs.watch(dir, getReloadFileFunc(dir));
	watchers[dir] = watcher;
	const files = await readdir(dir);
	for (const file of files) {
		await watchDir(path.join(dir, file));
	}
};

//watchDir(require("path").join(__dirname, "..", "mds"));
module.exports = watchDir;