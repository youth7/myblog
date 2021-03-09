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
* e_shoff：段表（section header table）在ELF文件中的偏移量
* e_phoff：program header table在ELF文件中的偏移量
* e_shstrndx: 段名字符串表在段表中的索引。具体关于这个字段的使用需要看段表的解析这个章节。

section header table和program header table分别记录了链接和加载运行时所有段的重要信息，因此它们的关系如下：

![elf_architecture](/imgs/elf_architecture.jpg)



## ELF中如何存储字符串

这里先说一下ELF中如何存储字符串。ELF中的元信息都是结构化的（可以将结构化理解为每一项都是定长的），这样做的好处是是的ELF能够被方便地解析，只需要每次都读取固定长度的字节就可以完整读出一条记录，同时记录中的各个字段也是固定的。例如段表里面每一条记录代表一个段，记录上面包含段的name、type和address，分别表示段的名称、类型和地址。其中name并不是直接存储段的名称，而是存了一个偏移量，根据这个偏移量再去字符串池查找就可以获取到段的真实名称。  

如下图所示，图中3个段的的真实名称分别是.text、.data和.symbol，它们都存在字符串池中。而name中只存储了名称在字符串池中的偏移，使用name的值去字符串池中查找（通过绿色的地址），就可以得到真实的名称了

![string table](/imgs/str_table.jpg)

此时反过来想想，如果name直接存放字符串，则我们解析段就非常麻烦了，这体现在两个地方

* 读取一条记录中的不同字段：由于不是结构化的，在读取name的时候我们需要不断检查是否读到了字符串的结束，如果是的话才继续读取type和addr。
* 读取不同的记录：也是因为非结构化的原因，需要不断判断何时读取完段表中的一条记录。



## 一个读取ELF header的例子

**ELF header总是在elf文件的最前面，占据64个字节**。下面我们分别使用nodejs和Rust来读取ELF header

* [Node.js版本](./js_read_elf.md)
    
* Rust版本



# 参考

[Executable and Linkable Format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)

[ELF Sections & Segments and Linux VMA Mappings](https://web.archive.org/web/20171129031316/http://nairobi-embedded.org/040_elf_sec_seg_vma_mappings.html)