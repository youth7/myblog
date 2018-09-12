



# COFF、PE、和ELF
* COFF（common file format）：源于Unix System V Relaease 3的可执行文件格式
* PE（Portable Executeable ）：COFF的变种，Windows下的可执行文件格式
* ELF（Executable Linkable Format ）：COFF的变种，Linux下的可执行文件格式

# 几种ELF文件
* **可重定位文件**（Relocatable File）  
这种文件包含代码和数据。如果源码仅仅进行编译而不链接，则生成这种文件，稍后可以用来链接生成**可执行文件**或者**共享目标文件**。  
Linux下的.o文件（也叫做目标文件）就是可重定位文件。（Linux中静态链接库，即.a文件，可以简单认为它就是将一系列的.o文件打包一起）。可以通过以下方法生成.o文件：
```BASH
	gcc -c main.c
	# -c 表示只编译不链接，执行完毕之后将会生成一个main.o文件

```

* **可执行文件**（Executable File）：
包含代码和数据，可以复制到内存中直接执行的文件，例如Linux下的/bin/bash

* **共享目标文件**（Shared Object File）：
一种特殊的可重定位文件，可以动态地加载进内存并链接。例如Linux下的.so文件


# ELF文件的结构
## ELF文件的整体结构
链接时： 

| ELF 头部    | 
| ------------- |
| program header table（可选）| 
| 段1 |
| 段2 |
| ... |
| 段n |
| 段表 |

执行时： 

| ELF 头部    | 
| ------------- |
| program header table| 
| 段1 |
| 段2 |
| ... |
| 段n |
| 段表（可选） |
我们目前只关注链接时的结构，执行时的结构稍后再讨论。  

给定一个ELF文件，要解析它首先要解决以下问题：
* 文件有哪些段？
* 起止地址是多少？
* 各个段的大小是多少？
* 这个段存放的是代码还是数据？ 

这些信息隐藏在ELF的**头部**（ELF section header）和**段表**（Section header table）中。  

我们接下来的讨论都是基于下面的C语言程序编译后的可重定位文件（平台为X86-64，小端机器）

```C
int global_init_var = 84;
int global_uninit_var;
void func(int i) {
	printf("%d\n", i);

}
int main(void) {
	static int static_var = 85;
	static int static_var2;
	int a = 1;
	int b;
	func(static_var + static_var2 + a + b);
	return 0;
}
```
通过以下命令编译，将会产生一个elf.o文件
```BASH
gcc -c elf.c
```

## ELF头部（ELF section header，以下简称header）
header包含了ELF文件的概要信息，它是解读ELF文件的基础。header可以用一个结构体来表示，在Linux的/usr/include/elf.h中我们可以找到它的详情：
```C
typedef struct{
  unsigned char	e_ident[EI_NIDENT];	/* Magic number and other info */
  Elf64_Half	e_type;			/* Object file type */
  Elf64_Half	e_machine;		/* Architecture */
  Elf64_Word	e_version;		/* Object file version */
  Elf64_Addr	e_entry;		/* Entry point virtual address */
  Elf64_Off	e_phoff;		/* Program header table file offset */
  Elf64_Off	e_shoff;		/* Section header table file offset */
  Elf64_Word	e_flags;		/* Processor-specific flags */
  Elf64_Half	e_ehsize;		/* ELF header size in bytes */
  Elf64_Half	e_phentsize;		/* Program header table entry size */
  Elf64_Half	e_phnum;		/* Program header table entry count */
  Elf64_Half	e_shentsize;		/* Section header table entry size */
  Elf64_Half	e_shnum;		/* Section header table entry count */
  Elf64_Half	e_shstrndx;		/* Section header string table index */
} Elf64_Ehdr;
```
这就是header的结构，其中最为重要是以下几个：
* **e_shoff**：段表（section header table）在文件中的偏移量
* **e_shentsize**：段表中每一项（即“段描述符”）的大小
* **e_shnum**：段的总数量
* **e_shstrndx**：字符串表在段表中的下标，一个无符号的16位整型

header总是在elf文件的最前面，占据64个字节。因此从elf文件第0个字节开始读取，连续读64个字节，就等于读取了header。我们通过以下nodejs程序来读取header（完整的代码请看[这里](./js_read_elf.md)，下面只给出关键部分）：

```JAVASCRIPT

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

```
通过header我们可以找到段表的入口和大小，它是解读ELF文件的关键，关于段表的解读请看[这里](./elf_section_table.md)

## ELF头部的其它信息