# 内存管理

完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day4



本节完成了一个简易的堆内存管理功能，包含堆内存的申请和释放。但这个功能在后续开发其它模块时都未被使用，是因为后面的模块都无申请堆内存的需求，因此本节相对独立。



本节主要完成两个功能：

* 内存的布局和地址
* 内存的申请和释放







## 内存的布局和地址

### 内存的布局

在对堆内存进行分配之前我们先要知道堆在哪里，即我们需要设计在内存中如何放置数据、代码、堆、栈。基于简单自然，课程中对内存进行了如下布局（这和现代的操作系统内存布局挺相似）

![](../../../imgs/rvos_mem_layout.jpg)



那么接下来的工作就是让QEMU按照上述方式将ELF加载到内存中。而QEMU是通过读取ELF中的PHT（program header table）来进行加载的，因此重点工作就是通过链接脚本，将上述布局的信息写入PHT。

链接脚本需要完成以下事情：

* 定义若干个逻辑上的内存区域（本例中只有一个）
* 定义各种节（section），具体内容包括：
  * 节的名称
  * 节由源目标文件中的哪些节组成
  * 节加载到上面定义的哪个内存区域中（这一步完成之后，最终生成的二进制文件就按照我们的设计布局了）
* 对外暴露一些关键地址



要完成上述任务，链接脚本的基本结构大概就这样，剩下就是填充内容里面的细节

```c
/*
定义内存区域
*/
MEMORY
{
	ram   (wxa!ri) : ORIGIN = ..., LENGTH = ...
}

/*
定义各种节，所有节都加载到名为ram的内存区域中
*/
SECTIONS
{
    .text:{}>ram
    .rodata:{}>ram
    .data:{}>ram
    .bss:{} 
}

/*
暴露各种变量给后续用C语言编写的代码使用
*/
PROVIDE(...)
PROVIDE(...)
PROVIDE(...)
```



### 自动计算地址并暴露符号给C语言侧

`PROVIDE`指令的具体用法见[这里](https://sourceware.org/binutils/docs/ld/PROVIDE.html)，在我们的例子里它的作用就是定义一个符号，然后这个符号能够在另外一个汇编源码中被使用。

> 为何汇编代码中不需要像C那样先声明再使用？
>
> 汇编器的工作方式很“佛系”：它遇到一个不认识的符号，不会像 C 编译器那样追着你问“这是什么类型”，而是直接把它标记为**未定义符号（Undefined Symbol）**，写进目标文件的符号表，然后说：“我不管了，让链接器去操心吧。”
>
> 链接器拿到这个目标文件后，会去链接脚本里找 `PROVIDE(xxx= .)`，找到后把地址填进去。整个过程不需要任何“声明”。



链接脚本定义好各种地址之后，需要在`mem.S`中将其重新导出给C语言侧使用。

```asm
.section .rodata #将下面所有符号都存到.rodata中
/*
将符号设置为global类型，使得外部可见
标签HEAP_START代表一个内存地址，在目标文件中就是一个符号
在这个地址地方开辟一个内存空间，长度4个字节，初始值为符号_heap_start（os.ld中定义）的值，即HEAP_START存的是一个地址的值
*/
.global HEAP_START
HEAP_START: .word  _heap_start
```





在`page.c`语言中我们这样使用：

```C
extern unsigned int HEAP_START;
extern unsigned int HEAP_SIZE;
extern unsigned int TEXT_START;
extern unsigned int TEXT_END;
extern unsigned int DATA_START;
extern unsigned int DATA_END;
extern unsigned int RODATA_START;
extern unsigned int RODATA_END;
extern unsigned int BSS_START;
extern unsigned int BSS_END;
```



**注意`_heap_start`和`HEAP_START`是不一样的**，链接后先查看符号表：

```bash
 readelf -s os.elf | grep -i heap_start
    43: 800013e8     0 NOTYPE  GLOBAL DEFAULT    4 _heap_start
    56: 80000c3a     0 NOTYPE  GLOBAL DEFAULT    2 HEAP_START
```

* `_heap_start`所属节的index是3（`.data`），是在链接文件中直接定义的符号。值为`800013e8`，**表示的是堆内存的起始地址**，
* `HEAP_START`所属节的index是2（`.rodata`），是在汇编代码中定义的符号。值为`80000c3a`，**这是一个内存地址，这个内存地址中存了`_heap_start`的值**





> 注意，在链接文件中直接定义的符号例如`_heap_start`，在C中要当做一个地址来处理，不能直接用变量接收，例如：
>
> ```
> extern char _heap_start;
> int x = _heap_start;        // ❌ 编译器会去读 0x800013e8 处的内容，不是 0x800013e8 本身
> int y = &_heap_start;       // ✔️ 编译器会把地址的值（即符号_heap_start的值）赋给y，即0x800013e8
> ```
> 可以将`kernel.c`改成下面这样：
>
> ```c
> // 声明uart.c中定义的各种函数，他们后续会被链接进来
> extern void uart_init(void);
> extern void uart_puts(char *c);
> extern int printf(const char* s, ...);
> extern int HEAP_START;
> extern int _heap_start;
> 
> void start_kernel(void)
> {
> 	//留一个特殊数值，debug时候回来验证
> 	int a = 0x709394;
> 	//初始化uart，qemu中如果不初始化其实也能正常运行，但是在真机环境中必须初始化
> 	uart_init();
> 	//输出内容
> 	printf("heap addr is %x %x %x\n",  &HEAP_START, HEAP_START, &_heap_start);
> 	uart_puts("hello riscv!!!!!!!!!!!!!!!\n");
> 	while (1) {}; 
> }
> ```
>
> 运行后的输出为：
>
> ```bash
> ......
> link done...
> start to run...
> heap addr is 80000c3a 800013e8 800013e8
> hello riscv!!!!!!!!!!!!!!!
> ```
>
> 符合我们上面的描述





## 堆内存的申请和释放

堆内存的布局如下：

> 内存分配是以*页*(page)为单位进行的，一页就是一个长度为4096KB的内存空间（称为4K页）

![](../../../imgs/rvos_heap_layout.jpg)

* `HEAP_START`：heap的起始地址，紧贴`.bss`
* `_heap_start_aligned`：heap中跳过经过4K对齐后的起始地址
* `_alloc_start`：从这个地址往后的内存区域，用于分配内存空间给用户



具体分为3部分：

1. **无用区**：只用作4K对齐，在本文中不作任何用途。
2. **元数据管理区**（下称为meta区），用于放置元数据，它描述了usable区中各种4K页的使用情况。
3. **实际使用区**（下称usable区），用于存放分配给用户的4K页。

### 实现内存管理的思路

* 用`PageDescriptor`这个结构体来记录usable区中各种4K页的使用情况，**堆内存的管理全在meta区进行，不会涉及usable区**
* 申请内存的函数返回的是usable区的地址，可以**通过简单的方法将这个地址映射回meta区的某个`PageDescriptor`的地址**，这样内存回收的函数设计就变得简单，直接传这个地址即可。



### 一些实现细节

**定义`PageDescriptor`结构体**

```c
/*
第0位：页是否使用
第1位：是否为某段连续内存的结尾
第2位：是否为某段连续内存的开始（暂不实现）
*/
struct PageDescriptor
{
    uint8_t flags;
};
```

这个结构体在RISCV32上其大小必定是一个字节。



**meta区的大小**

我们假设meta区需要 $x$ 页，usable区占据 $y$ ，而一个meta区的页满载时可以存放4096个描述符，那么有：

令 $size=HEAP\_SIZE - (\_alloc\_start - HEAP\_START)$
$$
\begin{cases}
x+y=size/4096\\
4096x = y
\end{cases}
$$
所以：
$$
x=\frac{size}{4096*4097}
$$
最理想的情况下，`size`应该是4096*4097的整数倍，否则解就会出现小数。这意味着在最极端的情况下会出现meta区的descriptor数量比usable区的4K页数量要多的情况。为了简单和保险，我们将 $x$ 向下取正以规避这种情形。





### 4k对齐的算法

首先要知道以下性质:

* **一个无符号整数若是4k的整数倍，那么它的二进制低12位必定为0**，因为`2^12=4096`
* 如果想要生成一个低12位全为1的掩码，即`0b111111111111`，可以通过 `(1<<12) -1`进行
* 把数值`v`按照某个粒度进行对齐，只需要加上这个粒度，然后把低位的全置零即可（超过对齐线的部分去掉）



因此具体的做法是：

1. 首先，生成一个4k掩码`mask=0b111111111111=(1<<12) -1`。注意，对这个掩码取反的话，就得到一个高位全为1，低12位全为0的掩码，即`~mask`。

2. 然后某个地址`addr`，令`r = addr + mask`，此时有两种可能：
   1. 如果`addr`本来就是4k对齐（其低12位全为0），那么加上`mask`后不会产生进位，此时进行`r & ~mask`操作就得到`addr`本身，符合要求。
   2. 如果`addr`本来没有4k对齐，那么加上`mask`后会产生进位到高位，此时进行`r & ~mask`操作（将低12位全部置零，高位不变），就得到一个距离`addr`最近的4k的值。











