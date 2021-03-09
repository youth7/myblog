


# 段表（section header table）
我们知道源ELF是按照段（section）来组织的，源码中的不同类型的对象经过编译之后会被放入不同的段中，例如函数会被放入.text段，变量会被放入.data段。段的元信息（例如段的名称，类型，位置）记录在段表中，理解好段表是解析段的前提条件

 

段表由若干条格式相同的记录（记录又叫做“段描述符”）组成，每条记录的结构是固定的，在Linux中对段表的实现如下：

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


它们的意义如下：

* **sh_name**：段名称的索引，需要配合
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