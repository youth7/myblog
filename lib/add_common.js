"use strict";

const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const readFile = promisify(fs.readFile.bind(fs));

//<script type="text/javascript" src="/script/MathJax-master/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>//留存本机host提供的mathjax v2

//只需加载tex-chtml，因为没有渲染mml的需要
const scriptStr = `
<script type="text/javascript" id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
<link rel="stylesheet" href="/css/default.min.css">
<script src="/script/highlight.min.js"></script>
<link rel='stylesheet' href='/css/common.css'>`;

const scriptBuffer = Buffer.from(scriptStr);
//分割线前后需要空行，以防止markdown解析不了

const getNavigator = function(path) {
	return `

[<h1>首页</h1>](/)

`;
};

const mdStr = `

---

`;
const mdBuffer = Buffer.from(mdStr);


const oneLine = /^(# ).*(\.md\))$/gm;
const displayNameAndFilenameReg = /[^\[]*(?=\])|[^\(]*(?=\))/g;
const extract = function(content, lastLevel) {
	const [displayName, filename] = content.match(displayNameAndFilenameReg);
	return;
};


const initNavigator = async function(firstIndex = path.join(__dirname, "../mds/index.md"), level = 1) {
	const content = await readFile(firstIndex, {
		encoding: "utf8"
	});
	const results = content.match(oneLine);
	results.forEach(result => {
		extract(result, level);
	});
};


module.exports = {
	mdBuffer,
	scriptBuffer,
	scriptStr,
	mdStr,
	getNavigator,
	initNavigator
};