# COFF、PE、和ELF
常见的**可执行文件**有以下几种格式：
* COFF（common file format）：源于Unix System V Relaease 3的可执行文件格式
* PE（Portable Executeable ）：COFF的变种，Windows下的可执行文件格式
* ELF（Executable Linkable Format ）：COFF的变种，Linux下的可执行文件格式

需要注意的是，ELF是一种**平台无关**的规范，它能够应用在常见硬件平台（X86、PowerPC、ARM）和操作系统中（各种Unix-like、Windows、Non-Unix），甚至游戏机平台和手机操作系统中都有它的身影。

# 几种ELF文件

ELF是Executable and Linkable Format的缩写，从名称上可以看出它同时包含了**可执行文件**和**可链接文件**两种格式，这是因为二者的格式只有非常细小的区别，从广义上来说可以看作同一种格式。在X86-64的Linux下，ELF包含以下几种类型：

> 在通用的ELF[规范](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)中，ELF文件类型多达9种，但在Linux的[man page](https://man7.org/linux/man-pages/man5/elf.5.html)中发现，Linux似乎只实现了其中4种

* **可重定位文件**（Relocatable File）  ：如果源码**仅仅进行编译而不链接**，则生成这种文件，稍后可以用来链接生成可执行文件或者共享目标文件（例如Linux下的.o文件就是可重定位文件）。
  
* **可执行文件**（Executable File）：可以复制到内存中直接执行的文件（例如Linux下的`/bin/bash`）
  
* **共享目标文件**（Shared Object File）：一种特殊的可重定位文件，可以动态地加载进内存并链接（例如Linux下的.so文件）。
  
* **核心转存文件**（略）




# ELF文件的结构
ELF中组织信息的单位是段（section），程序编译后的机器指令、数据以及其它元信息都包含在ELF文件不同的段中，段是ELF文件保存信息的单位。

给定一个ELF文件，要解析它首先要解决以下问题：

* 这是一个什么类型的ELF文件？（在哪个平台运行？32位还是64位，是执行/重定位/共享文件）

* 文件有哪些段、类型是什么？
* 如何找到这些段（各个段的起始地址、大小是多少）？

上述信息可以直接或者间接从ELF文件头（ELF header）中读取。从整体来看ELF可以分为两部分：ELF header和file data。ELF header包含了ELF的概要元信息，而file data包含以下数据：

* Program header table（PHT）：描述了零个或者多个`segments`
* Section header table（SHT）：描述了零个或者多个`sections`
* 其它被PHT和SHT中的`项`所引用的数据

> `segments`和`sections`在中文中都被翻译为“段”，关于它们之间的关系可以参考[这里](https://stackoverflow.com/questions/14361248/whats-the-difference-of-section-and-segment-in-elf-file-format)，简单来说两者分别从运行时、链接时的角度对ELF中的单元进行划分，如下图所示

![elf.jpg](/imgs/elf.jpg)



## ELF header
从上可知，ELF header是ELF的一级地图，解析ELF的第一步工作就是解析ELF header。 ELF header的结构可以参考[这里](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)，Linux中对其的实现是在`/usr/include/elf.h`中，这里我们只显示64位的部分（研究即将走入走入历史博物馆的32位意义不大）

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
结合参考资料我们很容易得知各个字段的意义，这里不再重复，但有两个非常重要的项需要说明
* e_shoff：section header table在ELF文件中的偏移量
* e_phoff：program header table在ELF文件中的偏移量

这两个段分别记录了链接和加载运行时所有段的重要信息，因此它们的关系如下：

![elf_architecture](/imgs/elf_architecture.jpg)

## 一个读取ELF header的例子

**ELF header总是在elf文件的最前面，占据64个字节**。下面我们分别使用nodejs和Rust来读取ELF header

* Nodejs版本（完整的代码请看[这里](./js_read_elf.md)，下面只给出关键部分）	
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

* Rust版本



# 参考

[Executable and Linkable Format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)

[ELF Sections & Segments and Linux VMA Mappings](https://web.archive.org/web/20171129031316/http://nairobi-embedded.org/040_elf_sec_seg_vma_mappings.html)