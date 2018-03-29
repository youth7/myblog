


```JAVASCRIPT
"use strict";
const fs = require("fs");
const util = require("util");
const open = util.promisify(fs.open);
const close = util.promisify(fs.close);
const read = util.promisify(fs.read);
const elfFile = "elf.o";
const headerSize = 64;
let fd;

const getUInt64As32 = function(buffer, start, end) {
	/**
	因为js中不支持64位的整数，且我们的elf.o文件中，所有64位的整数的最大值都可以用32位来表示，
	因此我们可以直接读取低位的4个字节作为整数的值返回，这种做法只存在于这个例子当中
	**/
	return buffer.slice(start, end).readUInt32LE(0);
};
async function readElfHeader() {
	const getSectionHeaderOffset = header => getUInt64As32(header, 40, 48);
	const rawHeader = await read(fd, Buffer.allocUnsafe(headerSize), 0, headerSize, null);
	const header = {
		sectionHeaderOffset: getSectionHeaderOffset(rawHeader.buffer),
		entrySize: rawHeader.buffer.slice(58, 60).readUInt16LE(),
		entryCount: rawHeader.buffer.slice(60, 62).readUInt16LE(),
		stringTableIndex: rawHeader.buffer.slice(62, 64).readUInt16LE()
	};
	console.log("header信息如下：----------------");
	console.log("段表偏移\t", header.sectionHeaderOffset);
	console.log("段大小\t", header.entrySize);
	console.log("段数量\t", header.entryCount);
	console.log("字符表索引\t", header.stringTableIndex);
	return header;
}


const readSectionTable = async function(header) {
	const size = header.entrySize * header.entryCount;
	const sectionTable = await read(fd, Buffer.allocUnsafe(size), 0, size, header.sectionHeaderOffset);
	const parsedSectionTable = [];
	for (let i = 0; i < header.entryCount; i++) {
		const rawSection = sectionTable.buffer.slice(i * header.entrySize, (i + 1) * header.entrySize);
		const item = {
			name: rawSection.slice(0, 4).readUInt32LE(),
			type: rawSection.slice(4, 8).readUInt32LE(),
			offset: getUInt64As32(rawSection.slice(24, 32)),
			size: getUInt64As32(rawSection.slice(32, 40))
		};
		parsedSectionTable.push(item);
	}
	return parsedSectionTable;
};

const getSctionStringTable = async function(section) {
	const stringTable = await read(fd, Buffer.allocUnsafe(section.size), 0, section.size, section.offset);
	return stringTable;
};

const displaySctionTable = function(sectionTable, stringTable) {
	const getNameFromStringTable = function(start) {
		let end = start;
		for (;; end++) {
			if (stringTable.buffer[end] == 0) {
				break;
			}
		}
		return stringTable.buffer.slice(start, end).toString("ascii");
	};
	console.log("段表信息如下：----------------");
	console.log("名称\t类型\t偏移\t大小");
	sectionTable.forEach(sction => {
		console.log(`${getNameFromStringTable(sction.name)}\t${sction.type}\t${sction.offset}\t${sction.size}`);
	});
};

(async function() {
	fd = await open(elfFile, "r");
	const header = await readElfHeader();
	const sectionTable = await readSectionTable(header);
	const stringTable = await getSctionStringTable(sectionTable[header.stringTableIndex]);
	displaySctionTable(sectionTable, stringTable);
	await close(fd);
})();
```