# 节表（section header table）

> [https://en.wikipedia.org/wiki/Executable_and_Linkable_Format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)完成、细致、直观地用表格描述了节表的结构，强烈推荐



我们知道源ELF是按照节（section）来组织的，源码中的不同类型的对象经过编译之后会被放入不同的节中，例如函数会被放入`.text`节，变量会被放入`.data`节。**节的元信息记录在节表中**，理解好节表是解析节的前提条件

节表由若干条格式相同的记录组成，在Linux中对节表的实现如下：

```C
typedef struct {
  Elf64_Word    sh_name;        /* Section name (string tbl index) */
  Elf64_Word    sh_type;        /* Section type */
  Elf64_Xword    sh_flags;        /* Section flags */
  Elf64_Addr    sh_addr;        /* Section virtual addr at execution */
  Elf64_Off    sh_offset;        /* Section file offset */
  Elf64_Xword    sh_size;        /* Section size in bytes */
  Elf64_Word    sh_link;        /* Link to another section */
  Elf64_Word    sh_info;        /* Additional section information */
  Elf64_Xword    sh_addralign;        /* Section alignment */
  Elf64_Xword    sh_entsize;        /* Entry size if section holds table */
} Elf64_Shdr;
```

这些元信息包括节的以下内容：

| 名称           | 意义                                           |
| -------------- | ---------------------------------------------- |
| sh_name        | 名称                                           |
| **sh_type**    | 类型，具体意义见下表                           |
| sh_flags       | 表示该节的某项属性是否打开，这些属性具体见下表 |
| sh_addr        | 执行时的虚拟地址                               |
| **sh_offset**  | 在ELF文件中的偏移量                            |
| **sh_size**    | 大小                                           |
| sh_link        | 与该节有关系的另外一个节的索引                 |
| sh_info        | 一些额外的信息，需要配合sh_link一起解读        |
| sh_addralign   | 该节对齐时的单位                               |
| **sh_entsize** | 如果该节是表格类型的话，表格中每一条记录的大小 |



## `sh_type`

`sh_type`的可选值如下：

| 名称         | 值         | 意义                                                         |
| ------------ | ---------- | ------------------------------------------------------------ |
| SHT_NULL     | 0          | 表明这是一个无效的节，更多解释可以看[这里](https://stackoverflow.com/questions/26812142/what-is-the-use-of-the-sht-null-section-in-elf) |
| SHT_PROGBITS | 1          | 节包含代码数据                                               |
| SHT_SYMTAB   | 2          | **符号表，非常重要**                                         |
| SHT_STRTAB   | 3          | **字符串表，非常重要**                                       |
| SHT_RELA     | 4          |                                                              |
| SHT_HASH     | 5          |                                                              |
| SHT_DYNAMIC  | 6          |                                                              |
| SHT_NOTE     | 7          |                                                              |
| SHT_NOBITS   | 8          |                                                              |
| SHT_REL      | 9          |                                                              |
| SHT_SHLIB    | 10         |                                                              |
| SHT_DYNSYM   | 11         |                                                              |
| SHT_LOPROC   | 0x70000000 |                                                              |
| SHT_HIPROC   | 0x7fffffff |                                                              |
| SHT_LOUSER   | 0x80000000 |                                                              |
| SHT_HIUSER   | 0xffffffff |                                                              |

其中有两组比较相似需要解释一下：

* `SHT_SYMTAB` 和`SHT_DYNSYM`：前者包含全部符号，后者只包含动态链接时候需要的符号，是前者的一个子集。原因是前者很多信息在动态链接用不上。
* `SHT_REL`和`SHT_RELA`：都是重定位节，区别是后者带有explicit addends（什么东西？）



## `sh_flags`

只列出Linux中实现了的几项，完整的内容参考[wiki](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)

| 名称          | 意义                     |
| ------------- | ------------------------ |
| SHF_WRITE     | 运行时是否可写           |
| SHF_ALLOC     | 运行时是否为该节分配内存 |
| SHF_EXECINSTR | 是否可执行               |
| SHF_MASKPROC  | 具体作用跟CPU相关        |



## `sh_link`和`sh_info`

`sh_link`和`sh_info`的解读和`sh_type`相关，具体关系如下：

| sh_type                 | sh_link                                                                           | sh_info                                                                               |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| SHT_DYNAMIC             | The section header index of the **string table** used by entries in the section.  | 0                                                                                     |
| SHT_HASH                | The section header index of the **symbol table** to which the hash table applies. | 0                                                                                     |
| SHT_REL 或SHT_RELA       | The section header index of the **associated symbol table**.                      | The section header index of the section to which the relocation applies               |
| SHT_SYMTAB 或 SHT_DYNSYM | The section header index of the **associated string table**.                      | One greater than the symbol table index of the last local symbol (binding STB_LOCAL). |
| 其它                      | SHN_UNDEF                                                                         | 0                                                                                     |

简单来说，sh_link指向了和当前节有关联的其它节（例如符号表或者字符串）



# 一些重要的节

因为后续要细致解释静态链接和动态链接，因此有必要先了解一下与之相关的节

## 符号表

目标文件中的符号对应于源文件中的变量、函数、引用等概念，ELF中所有的符号都存在**symtab**节（符号表）中。符号表中的每一项，包含了一个符号链接和运行时候的全部信息，在Linux中，对符号表的结构实现如下：

```c
typedef struct
{
  Elf64_Word    st_name;        /* Symbol name (string tbl index) */
  unsigned char    st_info;        /* Symbol type and binding */
  unsigned char st_other;        /* Symbol visibility */
  Elf64_Section    st_shndx;        /* Section index */
  Elf64_Addr    st_value;        /* Symbol value */
  Elf64_Xword    st_size;        /* Symbol size */
} Elf64_Sym;
```

其中有几个字段需要特别留意一下

* st_value：符号的值，具体的意义与上下文相关，具体如下
  
  | 目标文件类型 | 条件                   | st_value的意义                                     |
  | ------------ | ---------------------- | -------------------------------------------------- |
  | 可重定位文件 | st_shndx = SHN_COMMON  | 字节对齐数                                         |
  | 可重定位文件 | st_shndx != SHN_COMMON | 符号在**节中的偏移**，注意符号所在节由st_shndx确定 |
  | 共享库文件中 |                        | 符号的虚拟地址                                     |

* st_info：符号的绑定类型（强符号、弱符号等）和属性（该符号表示一个对象、函数、文件），它的计算方式如下：
  
  ```c
  #define ELF64_ST_BIND(info)          ((info) >> 4) // 右移4位，即舍弃低4位，剩下的高28位表示符号绑定信息
  #define ELF64_ST_TYPE(info)          ((info) & 0xf)// 相当于((info) & 0b1111),即只取低4位，表示符号类型
  #define ELF64_ST_INFO(bind, type)    (((bind)<<4)+((type)&0xf))
  ```

关于符号表的一些文章可以看[这里](http://blog.k3170makan.com/2018/10/introduction-to-elf-format-part-vi.html)

## 重定位节

见[RISC-V/Linux下的静态链接和动态链接](static_dyn_link.md)的相关章节，注意重定位节只是收集了模块内引用的外部符号及其细节。外部符号的真实地址是位于定义它们的外部模块中。

## 字符串节

见[ELF和ELF头部](/csapp3e/elf_file_header.md)中的相关章节

### `.BSS`和`.COMMON`

`.bss`：更好地节省空间，因此将值为0的符号全部收录在此

>首先，未初始化的静态变量以及初始化为0的全局或者静态变量在虚拟内存中的.bss段。
>
>其次，虚拟内存区域的内容和物理内存区域中的内容通过内存映射的方式进行关联，对于虚拟内存中的.bss区域中的内容规定映射到匿名文件处，运行的时候在内存分配这些变量，初始值为0



`.common`：符号可能在多处有定义，但在目前这个阶段尚未确定，因此放在公共区留待稍后确定。

> Commons only appear before the linking stage. Commons are what later  goes into the bss or data‚ but it's up to the linker to decide where it  goes. This allows you to have the same variable defined in different  compilation units. As far as I know this is mostly to allow some ancient header files that had `int foo;` in them instead of `extern int foo;`.

|           | static变量 | 全局变量  |
| --------- | ---------- | --------- |
| 未初始化  | `.bss`     | `.common` |
| 初始化为0 | `.bss`     | `.bss`    |

在linux上，当ELF被加载后`.bss`是每个进程私有的。又因为bss`被映射到匿名文件，而匿名文件是demand-zero page的，因此所有分配到`.bss`的变量默认值都是0。

# 一些特殊的节

这些节由操作系统使用，包含了一些控制信息，其中多数为链接信息，必须要对它们有一个大致的印象
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

# 一个读取节表的例子

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

读取出来的全是整数，如何将其转换为字符串请看[这里](./elf_file_header.md)中关于字符串表的章节

# 参考资料

[https://docs.oracle.com/cd/E19683-01/816-1386/6m7qcoblj/index.html#chapter6-47976](https://docs.oracle.com/cd/E19683-01/816-1386/6m7qcoblj/index.html#chapter6-47976)

[ELF格式探析之三：sections](https://segmentfault.com/a/1190000016834180)

https://paper.seebug.org/papers/Archive/refs/elf/Understanding_ELF.pdf
