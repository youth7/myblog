# COFF、PE、和ELF
常见的**可执行文件**有以下几种格式：
* COFF（common file format）：源于Unix System V Relaease 3的可执行文件格式
* PE（Portable Executeable ）：COFF的变种，Windows下的可执行文件格式
* ELF（Executable Linkable Format ）：COFF的变种，Linux下的可执行文件格式

> 需要注意的是，ELF似乎是一种平台无关的规范，例如ARM和IBM的z/TPF下的可执行文件也是基于ELF格式，它们和Linux下的ELF的显著不同是：代码段使用的是不同类型机器码

# 几种ELF文件

ELF是Executable and Linkable Format的缩写，从名称上可以看出它同时包含了**可执行文件**和**可链接文件**两种格式，这是因为二者的格式只有非常细小的区别，从广义上来说可以看作同一种格式。在X86-64的Linux下，ELF包含以下几种类型：

> 在ELF[规范](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)中，ELF文件类型多达9种，但在Linux的[man page](https://man7.org/linux/man-pages/man5/elf.5.html)中发现，Linux似乎只实现了其中4种

* **可重定位文件**（Relocatable File）  ：如果源码**仅仅进行编译而不链接**，则生成这种文件，稍后可以用来链接生成可执行文件或者共享目标文件（例如Linux下的.o文件就是可重定位文件）。
  
* **可执行文件**（Executable File）：可以复制到内存中直接执行的文件（例如Linux下的`/bin/bash`）
  
* **共享目标文件**（Shared Object File）：一种特殊的可重定位文件，可以动态地加载进内存并链接（例如Linux下的.so文件）。
  
* **核心转存文件**（略）




# ELF文件的结构
## 整体结构
ELF由一个ELF header和其它数据组成，其它数据包括

* Program header table（PHT）：描述了零个或者多个`segments`
* Section header table（SHT）：描述了零个或者多个`sections`
* 其它被PHT和SHT中的`项`所引用的数据

> `segments`和`sections`在中文中都被翻译为节，关于它们之间的关系可以参考[这里](https://stackoverflow.com/questions/14361248/whats-the-difference-of-section-and-segment-in-elf-file-format)，简单来说两者分别从运行时、链接时的角度对ELF中的单元进行划分，如下图所示

![elf.jpg](/imgs/elf.jpg)

给定一个ELF文件，要解析它首先要解决以下问题：
* 文件有哪些段、类型是什么？
* 各个段的起始地址、大小是多少？

以上信息部分可以直接从ELF section header（以下简称ESH）读取，部分虽然不是直接包含在ESH中，但是可以从ESH中导航到一个记录了它们的段（如section header table和program header table，它们是极为重要的段），经过二次解析后可以提取到相关信息，因此ESH是解读ELF的关键步骤。



## ELF section header（ESH）
ESH的结构可以参考[这里](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)，Linux中对其的实现是在`/usr/include/elf.h`中，这里我们只显示64位的部分（32位即将走入历史博物馆）

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
ESH的具体解读可以从上面链接中查到，这里不再重复，但有几个非常重要的项需要额外说明
* **e_shoff**：段表（section header table）在文件中的偏移量
* **e_shentsize**：段表中每一项（即“段描述符”）的大小
* **e_shnum**：段的总数量
* **e_shstrndx**：字符串表在段表中的下标，一个无符号的16位整型

**ESH总是在elf文件的最前面，占据64个字节。因此从elf文件第0个字节开始读取，连续读64个字节，就等于读取了header**。我们通过以下nodejs程序来读取ESH（完整的代码请看[这里](./js_read_elf.md)，下面只给出关键部分）：

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
通过ESH我们可以找到**段表的入口和大小**，它是解读ELF文件的关键，关于段表的解读请看[这里](./elf_section_table.md)

## ELF头部的其它信息