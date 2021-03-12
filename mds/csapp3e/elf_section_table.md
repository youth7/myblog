


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

各自的详细意义可以从注释中得知，网上也有很多参考资料，这里不再重复，不过有几个字段需要额外说明：

## sh_type

sh_type中的取值范围如下

| 名称         | 值   |
| ------------ | ---- |
|SHT_NULL|0|
|SHT_PROGBITS|1|
|SHT_SYMTAB|2|
|SHT_STRTAB|3|
|SHT_RELA|4|
|SHT_HASH|5|
|SHT_DYNAMIC|6|
|SHT_NOTE|7|
|SHT_NOBITS|8|
|SHT_REL|9|
|SHT_SHLIB|10|
|SHT_DYNSYM|11|
|SHT_LOPROC|0x70000000|
|SHT_HIPROC|0x7fffffff|
|SHT_LOUSER|0x80000000|
|SHT_HIUSER|0xffffffff|

每种类型的意义可从参考资料中查到这里不再重复，不过其中有两组比较相似需要解释一下：

* SHT_SYMTAB 和SHT_DYNSYM：前者包含全部符号，后者只包含动态链接时候需要的符号，是前者的一个子集。原因是前者很多信息在动态链接用不上。
* SHT_REL和SHT_RELA：都是重定位段，区别是后者带有explicit addends

## sh_link和sh_info

sh_link和sh_info的解读和sh_type相关，具体如下

| sh_type                  | sh_link                                                      | sh_info                                                      |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| SHT_DYNAMIC              | The section header index of the **string table** used by entries in the section. | 0                                                            |
| SHT_HASH                 | The section header index of the **symbol table** to which the hash table applies. | 0                                                            |
| SHT_REL 或SHT_RELA       | The section header index of the **associated symbol table**. | The section header index of the section to which the relocation applies |
| SHT_SYMTAB 或 SHT_DYNSYM | The section header index of the **associated string table**. | One greater than the symbol table index of the last local symbol (binding STB_LOCAL). |
| 其它                     | SHN_UNDEF                                                    | 0                                                            |



# 一些重要的段

因为后续要细致解释静态链接和动态链接，因此有必要先了解一下与之相关的段

## 重定位段

## 符号表

## 字符串表



# 一些特殊的段

这些段由操作系统使用，包含了一些控制信息，其中多数为链接信息，必须要对它们有一个大致的印象
|sh_name|sh_type|sh_flags|
|---|---|---|
|.bss | SHT_NOBITS | SHF_ALLOC + SHF_WRITE|
|.comment | SHT_PROGBITS | none|
|.data | SHT_PROGBITS | SHF_ALLOC + SHF_WRITE|
|.data1 | SHT_PROGBITS | SHF_ALLOC + SHF_WRITE|
|.debug | SHT_PROGBITS | none|
|.dynamic | SHT_DYNAMIC |see below|
|.dynstr | SHT_STRTAB | SHF_ALLOC|
|.dynsym | SHT_DYNSYM | SHF_ALLOC|
|.fini | SHT_PROGBITS | SHF_ALLOC + SHF_EXECINSTR|
|.got | SHT_PROGBITS |see below|
|.hash | SHT_HASH | SHF_ALLOC|
|.init | SHT_PROGBITS | SHF_ALLOC + SHF_EXECINSTR|
|.interp | SHT_PROGBITS |see below|
|.line | SHT_PROGBITS | none|
|.note | SHT_NOTE | none|
|.plt | SHT_PROGBITS |see below|
|.relXXX | SHT_REL |see below|
|.relaXXX | SHT_RELA |see below|
|.rodata | SHT_PROGBITS | SHF_ALLOC|
|.rodata1 | SHT_PROGBITS | SHF_ALLOC|
|.shstrtab | SHT_STRTAB | none|
|.strtab | SHT_STRTAB |see below|
|.symtab | SHT_SYMTAB |see below|
|.text | SHT_PROGBITS | SHF_ALLOC + SHF_EXECINSTR|

# 一个读取段表的例子

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





# 参考资料

[https://docs.oracle.com/cd/E19683-01/816-1386/6m7qcoblj/index.html#chapter6-47976](https://docs.oracle.com/cd/E19683-01/816-1386/6m7qcoblj/index.html#chapter6-47976)

[ELF格式探析之三：sections](https://segmentfault.com/a/1190000016834180)

https://paper.seebug.org/papers/Archive/refs/elf/Understanding_ELF.pdf

