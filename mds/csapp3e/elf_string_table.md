


## 段表字符串表（Section header string table，以下简称字符串表）

从上可知，段表中的每一项（“段描述符”）都是一个Elf64_Shdr结构体，它们的长度都一样。这种定长的结构有利于系统的加载、解释和执行。而每个“段描述符”中长度不一的部分（例如段的名称），则存在于字符串表中，凭借sh_name去字符串表中查找，就可以得知该段的全称。（这种设计兼顾了定长和变长的部分，在软件开发中很常见。把结构化的信息和非结构化的信息分开存储，然后通过一个索引进行查找）。

字符串表是一个段，那么它的基本信息也在段表中，那它究竟在段表中的哪个位置呢？header中有一个属性e_shstrndx，它指明了字符串表在段表中的位置，e_shstrndx的值就是字符串表在段表中的索引。我们通过以下代码读取字符串表。
```JAVASCRIPT
const getSctionStringTable = async function(section) {
	const stringTable = await read(fd, Buffer.allocUnsafe(section.size), 0, section.size, section.offset);
	return stringTable;
};
```
最终通过以下代码显示段表的完整信息
```JAVASCRIPT
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
```

程序输出如下：
```
header信息如下：----------------
段表偏移         1056
段大小   64
段数量   13
字符表索引       12
段表信息如下：----------------
名称    类型    偏移    大小
        0       0       0
.text   1       64      87
.rela.text      4       784     120
.data   1       152     8
.bss    8       160     4
.rodata 1       160     4
.comment        1       164     45
.note.GNU-stack 1       209     0
.eh_frame       1       216     88
.rela.eh_frame  4       904     48
.symtab 2       304     384
.strtab 3       688     92
.shstrtab       3       952     97
```
配合字符串表，就可以完整解读出段表的内容。至此，ELF文件的关键部分都已经解读出来，至于header和段表中其它部分的含义，可以查看[ELF文件的规范](https://refspecs.linuxbase.org/elf/elf.pdf)，或在linux下用以下命令查看
```BASH
man elf
```
