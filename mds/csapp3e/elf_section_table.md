


# 段表（section header table）
header只是给出ELF文件的基本信息，而各个段的基本信息则存储在段表当中。可以将段表想象成一个数组，数组的成员称为“段描述符”，“段描述符”包含了段的基本信息，它的结构如下：
``` C
typedef struct {
  Elf64_Word	sh_name;		/* Section name (string tbl index) */
  Elf64_Word	sh_type;		/* Section type */
  Elf64_Xword	sh_flags;		/* Section flags */
  Elf64_Addr	sh_addr;		/* Section virtual addr at execution */
  Elf64_Off	sh_offset;		/* Section file offset */
  Elf64_Xword	sh_size;		/* Section size in bytes */
  Elf64_Word	sh_link;		/* Link to another section */
  Elf64_Word	sh_info;		/* Additional section information */
  Elf64_Xword	sh_addralign;		/* Section alignment */
  Elf64_Xword	sh_entsize;		/* Entry size if section holds table */
} Elf64_Shdr;
```
其中最为重要的几个项是：
* **sh_name**：段名称在字符串表中的索引
* **sh_type**：段的类型，指明该段是代码、数据、字符串表等等
* **sh_offset**：段的起始地址在ELF文件中偏移量
* **sh_size**：段的大小

我们可以通过以下代码来读取这些信息：
```JAVASCRIPT
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
```
读取出来的全是整数，对于段名name，怎么把它的整数值转换为字符串？这需要用到字符串表，关与字符串表的解读请看[这里](./elf_string_table.md)