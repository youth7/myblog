# 《The embedonomicon》学习笔记

# 和原教程的一些差异

  * 重写了第五章，因为`!asm`和`!global_asm`已经进入stable，原文那种方式实在太繁琐。
  * Rust Edition原书采用2018，本文采用2021。按照官方的说法，Rust Edition和Rust的版本应该是独立的，基于任何一个Rust Edition的代码应该都可以在最新版本的Rust编译器上编译。（*All Rust code, regardless of edition, is ultimately compiled to the same internal representation within the compiler.*）
  * 原文中是通过cargo子命令的方式去调用cargo-binutils，例如使用`cargo size`而不是`rust-size`。个人觉得这样虽然简洁但是不够直观，因此我将使用直接调用的方式调用cargo-binutils
  * 所有命令都是在powershell下运行的



# 【0】前言

[《The embedonomicon》](https://docs.rust-embedded.org/embedonomicon/preface.html)包含了以下内容：

* 带领你从头开始构建`#![no_std]`应用程序（裸机编程）
* 开发基于特定架构的Cortex-M微控制器的应用程序，并不断迭代这个过程



## 目的

通过本文，你会学到：

* 如何构建一个`#![no_std]`程序（裸机编程，不依赖OS）。
* 如何控制Rust程序的内存布局（在链接阶段确定），这需要接触链接器、链接脚本和一些跟ABI相关的Rust feature
* 如何实现可以被静态覆盖（statically overridden）的函数，静态覆盖意味着没有运行时消耗



## 前置条件

因为本文是基于win10的，所以只介绍win10下相关工具的安装过程

* Rust相关
    * Rust编译器：原书采用1.31，本文采用1.60.0
    * cargo-binutils：直接使用最新
    
* QEMU模拟器
  
    采用7.0.0版本（[qemu-w64-setup-20220419.exe](https://qemu.weilnetz.de/w64/qemu-w64-setup-20220419.exe)）
    
* gdb工具

    使用[gcc-arm-none-eabi-10.3-2021.10-win32](https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.exe)或[arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi](https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/11.3.rel1/binrel/arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi.exe)。
    
    >  注意不要使用gcc-arm-11.2-2022.02-mingw-w64-i686-arm-none-eabi，这个版本依赖过期的32位python2.7，在Win10上很难准备相关的运行环境给它，相关讨论见[这里](https://community.arm.com/support-forums/f/compilers-and-libraries-forum/52585/python-2-7-dependency-for-arm-none-eabi-gdb-at-windows-hosts)

  

# 【1】最小的`#![no_std]`程序

这个章节主要是写一个`#![no_std]`版的hello world程序，完整代码见：[https://github.com/youth7/the-embedonomicon-note/tree/01-the-smallest-nostd-program](https://github.com/youth7/the-embedonomicon-note/tree/01-the-smallest-nostd-program)

## std和core

**[`std`](https://doc.rust-lang.org/std/)**

`std`意味着程序运行在通用OS上（通用OS通常提供线程，进程，文件系统，socket等API），它封装了OS抽象层的访问方式。除此还提供其它功能，包括：

* 栈溢出保护
* 命令行参数处理
* 在`main`函数的调用前生成主线程



**[`core`](https://doc.rust-lang.org/core/)**

`#![no_std]`意味着程序将依赖`core`而不是`std`。`core`是`std`的子集，只提供语言的基本类型（如float、string、slice）以及暴露处理器的特性（如一些原子操作和SIMD指令）。`core`不提供标准的运行时，没有**堆分配**。因此，`#![no_std]`通常是系统中的第一或唯一的程序，它能做普通Rust程序所不能的事情，例如：

* 内核或者OS
* 固件
* bootloader



## 例子

现在我们来看看这个程序

```rust
#![no_main]//告诉编译器不要使用main函数作为程序的入口，因为main对运行时有要求
#![no_std]//上面已经解释过

use core::panic::PanicInfo;

#[panic_handler]//自定义程序奔溃时的行为，因为缺乏运行时的原因这个必须自己定义
fn panic(_panic: &PanicInfo<'_>) -> ! {
    loop {}
}
```

依次使用以下2个命令将源码编译为目标文件，并查看其中的符号

```powershell
# 编译代码，--target是cargo命令的参数,指定了编译产物的目标平台，详情参考cargo book
# --emit指定了编译产物的文件类型，详情参考rustc book
cargo rustc --target thumbv7m-none-eabi -- --emit=obj

# 列出目标文件中的符号
rust-nm  target/thumbv7m-none-eabi/debug/deps/app-*.o
```

此时的输出为

```powershell
00000000 T rust_begin_unwind
```



如果你安装了wsl2的话，可以用其它命令来查看符号，例如使用`readelf`来查看
```powershell
readelf -s ./target/thumbv7m-none-eabi/debug/deps/*.o
```

控制台输出：

```powershell
Symbol table '.symtab' contains 10 entries:
   Num:    Value  Size Type    Bind   Vis      Ndx Name
     0: 00000000     0 NOTYPE  LOCAL  DEFAULT  UND
     1: 00000000     0 FILE    LOCAL  DEFAULT  ABS 49d4frxgydk7ies3
     2: 00000000     0 SECTION LOCAL  DEFAULT    3
     3: 00000000     0 NOTYPE  LOCAL  DEFAULT    3 $t.0
     4: 00000000     0 SECTION LOCAL  DEFAULT    6
     5: 00000000     0 SECTION LOCAL  DEFAULT    7
     6: 00000000     0 SECTION LOCAL  DEFAULT   11
     7: 00000000     0 SECTION LOCAL  DEFAULT   18
     8: 00000000     0 SECTION LOCAL  DEFAULT   20
     9: 00000001     8 FUNC    GLOBAL HIDDEN     3 rust_begin_unwind
```

或者使用`nm`来查看

```powershell
nm ./target/thumbv7m-none-eabi/debug/deps/*.o
```

控制台输出：

```powershell
00000000 t $t.0
00000001 T rust_begin_unwind
```



## `#[panic_handler]`和`eh_personality`

刚开始的时候觉得两者都是程序崩溃时调用的，它们有什么区别？[文档](https://doc.rust-lang.org/stable/book/ch09-01-unrecoverable-errors-with-panic.html)是这样解释的：

>## Unwinding the Stack or Aborting in Response to a Panic
>
>By default, when a panic occurs, the program starts *unwinding*, which means Rust walks back up the stack and cleans up the data from each function it encounters. However, this walking back and cleanup is a lot of work. Rust, therefore, allows you to choose the alternative of immediately *aborting*, which ends the program without cleaning up. Memory that the program was using will then need to be cleaned up by the operating system. If in your project you need to make the resulting binary as small as possible, you can switch from unwinding to aborting upon a panic by adding `panic = 'abort'` to the appropriate `[profile]` sections in your *Cargo.toml* file. For example, if you want to abort on panic in release mode, add this:
>
>```
>[profile.release]
>panic = 'abort'
>```

可见前者是程序panic时候调用的，而运行panic处理程序时候，可以选择是unwind stack或者直接abort。我个人的疑问是这两个设定是相互独立的吗，还是说`#[panic_handler]`指向的实现里面包含了`eh_personality`？

但无论如何，**在本文的运行环境下并不需要对`eh_personality`做任何修改**

> 另：eh应该是exception handling的缩写，见[这里的讨论](https://www.reddit.com/r/rust/comments/estvau/til_why_the_eh_personality_language_item_is/)



# 【2】内存布局

这个章节主要是介绍如何通过各种工具来调整内存布局，使得生成的二进制程序能够在裸机上运行，并通过gdb来验证生成的程序是否正确，完整代码见：[https://github.com/youth7/the-embedonomicon-note/tree/02-memory-layout](https://github.com/youth7/the-embedonomicon-note/tree/02-memory-layout)

这一章主要是讲如何生成正确结构的二进制文件，使其能够在特定架构的CPU上运行。要实现这个目标就必须：

* 了解CPU对二进制文件结构的要求
* 编写Rust代码
* 通过链接器调整二进制文件结构



## 了解CPU对二进制文件结构的要求

教程是基于Cortex-M3微控制器[LM3S6965](http://www.ti.com/product/LM3S6965)编写的，关于它的技术细节可以查阅文档，目前对我们来说最重要的是：

>  **初始化[vector table](https://developer.arm.com/docs/dui0552/latest/the-cortex-m3-processor/exception-model/vector-table) 前两个指针的值**

vector_table是一个指针数组，里面每个元素（vector）都指向了某个内存地址（大部分是异常处理函数的起始地址），关于它的具体结构可以看[这里](https://documentation-service.arm.com/static/5ea823e69931941038df1b02?token=)。对本教程来说最重要的是前2个指针：

* 第1个：（`ISP：Initial SP value`）栈顶指针，用于初始化栈
* 第2个：（`Reset`）指向了`reset handler`，它是一个函数，会在系统被重置或者加电时运行（同时也是程序栈帧里面的第一帧）。

所以我们需要做的事情就是：

1. 在Rust代码中编写`reset handler`函数，并将其暴露出来以供链接脚本使用
2. 结合步骤1，通过链接脚本将vector table前两个元素的值设置好

> vector_table属于异常模型的一部分，里面每个vector指向的对象都跟异常处理相关。`Initial SP value`和`Reset`其实也可以理解为当系统因异常重启时需要如何初始化系统系统。
>
> 系统重置的时候，vector_table的默认地址是0x00000000，可以通过修改`VTOR（Vector Table Offset Register）`来调整vector_table的默认地址。

## 编写Rust代码

后续会用到一些跟编译相关的attribute，这里先统一介绍

* `#[export_name = "foo"]` 指定源码中的某个变量、函数编译后的符号名为 `foo`.
* `#[no_mangle]` 使用变量、函数在源码中的名称作为符号名
* `#[link_section = ".bar"]` 将符号放置到名为 `.bar`的节中

首先编写`reset handler`函数，它是系统栈帧中的第一个帧，从第一个帧返回是一种未定义行为，因此这个函数永远不能退出，即它必须是一个发散函数

```rust
#[no_mangle]
pub unsafe extern "C" fn Reset() -> ! {
    let _x = 42;
    //永不退出的发散函数
    loop {}
}

//说明这个函数需要编译到名称为.vector_table.reset_vector的这个节中，这个节在后面会被引用到
#[link_section = ".vector_table.reset_vector"]
//告诉编译器不要用Rust的命名规则为Reset重命名，保留原来的名称就好
#[no_mangle]
//RESET_VECTOR就是vector table中的第二个元素，指向了异常处理函数Reset
//其实这里不太明白为何要多用一个变量RESET_VECTOR而不是直接使用Reset函数
pub static RESET_VECTOR: unsafe extern "C" fn() -> ! = Reset;
```



## 通过链接器调整二进制文件结构

在根目录下创建一个名为`link.x`的文件，其内容为：

```link
/* Memory layout of the LM3S6965 microcontroller */
/* 1K = 1 KiBi = 1024 bytes */
MEMORY
{
  FLASH : ORIGIN = 0x00000000, LENGTH = 256K
  RAM : ORIGIN = 0x20000000, LENGTH = 64K
}

/* The entry point is the reset handler */
ENTRY(Reset);

EXTERN(RESET_VECTOR);

SECTIONS
{
  .vector_table ORIGIN(FLASH) :
  {
    /* First entry: initial Stack Pointer value */
    LONG(ORIGIN(RAM) + LENGTH(RAM));

    /* Second entry: reset vector */
    KEEP(*(.vector_table.reset_vector));
  } > FLASH

  .text :
  {
    *(.text .text.*);
  } > FLASH

  /DISCARD/ :
  {
    *(.ARM.exidx .ARM.exidx.*);
  }
}
```

这个脚本初始化了vector table的前两项并将它放置到正确的地方，关于链接脚本的完整语法请参考[https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_toc.html#TOC16](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_toc.html#TOC16)，这里我们只简要说明一下各个部分的作用。

### [MEMORY](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_3.html#SEC16)

定义了可用的存储空间的地址和大小。此处定义了两个可用的存储空间：

* FLASH：定义了微控制器上的闪存起始和大小
* RAM：定义为微控制器上的内存起始和大小

具体的值是根据LM3S6965的技术文档

> 关于FLASH 、RAM、ROM的区别请看[这里](https://zhuanlan.zhihu.com/p/38339306)

### [ENTRY](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_3.html#SEC24)

定义了程序的入口为Rust代码中定义的函数`Reset`。链接器会抛弃未使用的节，如果脚本中没有这一行则链接器会认为`Reset`未被使用从而抛弃之。

而`Reset`就是在系统重置时运行的第一个函数，因此指定它为入口也是合理的。

### [EXTERN](https://sourceware.org/binutils/docs/ld/Miscellaneous-Commands.html)

链接器会从`entry`命令指定的函数开始，从目标文件中递归搜索所有用到的符号，一旦所有符合解析完成了就停止，即使此时还有目标文件未被搜索。`EXTERN`的作用是强制链接器去继续解析被`EXTERN`作为参数的符号，例如本节中的`RESET_VECTOR`。

其实不太明白为何要多用一个变量`RESET_VECTOR`而不是直接使用`Reset`这个符号，`Reset`已经包含了足够的信息用来填充vector table（ 在下一小结我们会通过检查符号表来印证这个结论），唯一的可能性是使用`RESET_VECTOR`会使得链接脚本更加容易编写？



注意：文中关于`EXTERN`的目的和文档中的记录在**字面上**不是完全一致，这里先记录几个关键点：

* ELF中undefined symbol的相关知识，可以参考[这里](https://docs.oracle.com/cd/E19120-01/open.solaris/819-0690/chapter2-9/index.html)。

* 文档说`EXTERN`与`-u`等价，`-u`中有这么一句：*If this option is being used to force additional modules to be pulled into the link*，这可能就是文章中使用`EXTERN的目的`



### [SECTIONS](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_chapter/ld_3.html#SEC17)

定义了如何将input目标文件中的节（section）输出到output目标文件中。此处在output目标文件中定义了3个节：`.vector_table`、`.text`和`/DISCARD/`。

* `.vector_table`被输出到`FLASH`（`FLASH`在`MEMORY`中定义）中，它的前两个元素的值分别是`LONG(ORIGIN(RAM) + LENGTH(RAM))`和`KEEP(*(.vector_table.reset_vector))`，前者就是栈顶（SP）的值（栈的增长方向是从高地址往低地址），后者将所有名为`.vector_table.reset_vector`的节都放置到SP后，因为Rust代码中只有一个`.vector_table.reset_vector`节且这个节中只有`RESET_VECTOR`这个符号，因此这条语句的作用相当于将`RESET_VECTOR`作为vector table的第2个元素。注意`KEEP`关键字是必须的，关于KEEP的详细说明看[这里](https://wiki.osdev.org/Linker_Scripts#KEEP)。

* `.text`也是被输出到`FLASH`，它紧跟着`.vector_table`
* `/DISCARD/`：这是一个特别的节名称，所有被放置到这个节的内容都会被抛弃



## 检查可执行文件

因为采用自定义的链接脚本，所以必须告诉编译器使用这个脚本，这可以通过修改`.cargo/config`文件来实现，新建`.cargo`文件夹并创建文件`config`文件，在里面添加以下内容

```toml
# 针对这个target使用链接脚本
[target.thumbv7m-none-eabi]
rustflags = ["-C", "link-arg=-Tlink.x"]

# 指定编译的target，修改这里之后就无需在命令行传递--target参数了
[build]
target = "thumbv7m-none-eabi"
```

先使用`cargo build --bin app`编译项目。成功后使用以下命令来检查结果是否符合预期

```powershell
# 使用rust-objdump去检查最终生成的可执行文件中的汇编代码
rust-objdump -d --no-show-raw-insn .\target\thumbv7m-none-eabi\debug\app
```

此时输出为：

```powershell
.\target\thumbv7m-none-eabi\debug\app:  file format elf32-littlearm

Disassembly of section .text:

00000008 <Reset>:
       8:       sub     sp, #4
       a:       movs    r0, #42
       c:       str     r0, [sp]
       e:       b       0x10 <Reset+0x8>        @ imm = #-2
      10:       b       0x10 <Reset+0x8>        @ imm = #-4
```

可以看到`Reset`位于`0x00000008`，这和预期是一样的。因为`.vector_table`的大小是8个字节，它后面就是`.text`节，而函数`Reset`又是`.text`节里唯一的内容。

保险起见我们还需要检查一下vector table，使用以下命令：

```powershell
# 使用rust-objdump去检查最终生成的可执行文件中指定节的具体内容
rust-objdump -s --section .vector_table .\target\thumbv7m-none-eabi\debug\app
```

此时的输出为

```powershell
.\target\thumbv7m-none-eabi\debug\app:  file format elf32-littlearm
Contents of section .vector_table:
 0000 00000120 09000000                    ... ....
```

vector table第1个元素是的值由`LONG(ORIGIN(RAM) + LENGTH(RAM))`决定，这个表达式的值为0x20000000 + 64*1024 = 0x20010000，二进制表示为`00100000_00000001_00000000_00000000`。将这个二进制按照小端法读取出来就是0x00000120（这是objump的行为）。

第2个元素的值是0x09000000，但是从上面我们可以知道`Reset`函数其实位于0x00000008。其实这是ARM cpu的规范，用函数地址的最低位的奇偶性来表示当前处于哪种模式，具体可以看[这里](https://stackoverflow.com/questions/37004954/function-address-in-arm-assembly-have-one-byte-offset)（记住这个讨论，下面会继续用到）

### 检查`RESET_VECTOR`和`Reset`

再用命令`rust-readobj.exe .\target\thumbv7m-none-eabi\debug\app -s -S --elf-output-style=GNU`检查一下符号表和section header:

```powershell
There are 17 section headers, starting at offset 0x111fc:

Section Headers:
  [Nr] Name              Type            Address  Off    Size   ES Flg Lk Inf Al
  [ 0]                   NULL            00000000 000000 000000 00      0   0  0
  [ 1] .vector_table     PROGBITS        00000000 010000 000008 00   A  0   0  4
  [ 2] .text             PROGBITS        00000008 010008 00000a 00  AX  0   0  2
  [ 3] .debug_abbrev     PROGBITS        00000000 010012 00013c 00      0   0  1
  [ 4] .debug_info       PROGBITS        00000000 01014e 00058e 00      0   0  1
  [ 5] .debug_aranges    PROGBITS        00000000 0106dc 000030 00      0   0  1
  [ 6] .debug_ranges     PROGBITS        00000000 01070c 000018 00      0   0  1
  [ 7] .debug_str        PROGBITS        00000000 010724 00048c 01  MS  0   0  1
  [ 8] .debug_pubnames   PROGBITS        00000000 010bb0 0000c9 00      0   0  1
  [ 9] .debug_pubtypes   PROGBITS        00000000 010c79 00036b 00      0   0  1
  [10] .ARM.attributes   ARM_ATTRIBUTES  00000000 010fe4 000032 00      0   0  1
  [11] .debug_frame      PROGBITS        00000000 011018 00003c 00      0   0  4
  [12] .debug_line       PROGBITS        00000000 011054 000054 00      0   0  1
  [13] .comment          PROGBITS        00000000 0110a8 000013 01  MS  0   0  1
  [14] .symtab           SYMTAB          00000000 0110bc 000050 10     16   3  4
  [15] .shstrtab         STRTAB          00000000 01110c 0000c3 00      0   0  1
  [16] .strtab           STRTAB          00000000 0111cf 00002a 00      0   0  1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings), I (info),
  L (link order), O (extra OS processing required), G (group), T (TLS),
  C (compressed), x (unknown), o (OS specific), E (exclude),
  R (retain), y (purecode), p (processor specific)

Symbol table '.symtab' contains 5 entries:
   Num:    Value  Size Type    Bind   Vis       Ndx Name
     0: 00000000     0 NOTYPE  LOCAL  DEFAULT   UND
     1: 00000000     0 FILE    LOCAL  DEFAULT   ABS 11xi6ura3lrymj6b
     2: 00000008     0 NOTYPE  LOCAL  DEFAULT     2 $t.1
     3: 00000004     4 OBJECT  GLOBAL DEFAULT     1 RESET_VECTOR
     4: 00000009    10 FUNC    GLOBAL DEFAULT     2 Reset
```

从上可知：

* `Reset`位于`.text`，其value和size分别是9和10，表示了这个函数在`.text`中的偏移量和大小（注意偏移量9和我们前面讨论的地址0x09000000是一致的）
* `RESET_VECTOR`位于`.vector_table`，其value和size分别是4和4，表示了这个函数在`.text`中的偏移量和大小，具体的值还需要进一步读取。





## 测试一下

用以下命令启动一个Qemu模拟器，打开一个gdb服务器并监听端口3333

```powershell
qemu-system-arm `
      -cpu cortex-m3 `
      -machine lm3s6965evb `
      -gdb tcp::3333 `
      -S `
      -nographic `
      -kernel target/thumbv7m-none-eabi/debug/app
```

然后在新窗口启动GDB并进行远程调试

```powershell
arm-none-eabi-gdb -q target/thumbv7m-none-eabi/debug/app
Reading symbols from target/thumbv7m-none-eabi/debug/app...
(gdb) target remote :3333 	#连接远程调试服务器，程序会自动停止在第1行等待调试
Remote debugging using :3333
app::Reset () at src/main.rs:12
12      pub unsafe extern "C" fn Reset() -> ! {
(gdb) print/x $sp			#打印栈顶的值
$1 = 0x20010000
(gdb) s						#运行下一行代码
13          let _x = 42;
(gdb) s						#运行下一行代码
15          loop {}
(gdb) print _x				#打印变量_x的值
$2 = 42
(gdb) print &_x				#打印变量_x的地址
$3 = (*mut i32) 0x2000fffc
(gdb) quit					#退出
```



# 【3】`main`接口

本章节主要介绍了如何将上一章节的成果从binary package转化为lib package，以便其他开发者可以使用它来开发自己的应用程序。这样相当于建立了一个抽象层，屏蔽了裸机相关的内容，开发者只需编写自己的`main`程序即可。本章难点在于理解为何需要初始化内存，以及如何初始化内存，完整代码见：[https://github.com/youth7/the-embedonomicon-note/tree/03-main-interface](https://github.com/youth7/the-embedonomicon-note/tree/03-main-interface)

为了达到这个目标，我们需要将之前的项目改为lib package（名为rt，即runtime的意思），然后再新建一个binary package（名为app），然后在`app`中引用`rt`。

> 关于package和crate的对比可以看[这里](https://stackoverflow.com/questions/68250956/what-is-the-exact-difference-between-a-crate-and-a-package)

## 将原项目改造名为`rt`的lib package

首先将之前类型为binary的package改为lib类型，这需要：

* `main.rs`重命名为`lib.rs`

* 把`Cargo.toml`中`[package]`的`name`改为`rt`，同时将项目根目录重命名为`rt`

  ```toml
  [package]
  name = "rt" #修改这里
  version = "0.1.0"
  edition = "2021"
  ```


* 改写`Reset`函数，让它去调用用户编写的`main`函数，注意这里只列出了改写的部分

  ```rust
  #![no_std]
  
  use core::panic::PanicInfo;
  
  // CHANGED!
  #[no_mangle]
  pub unsafe extern "C" fn Reset() -> ! {
      extern "Rust" {
          fn main() -> !;//将控制权交给用户的main函数，因此main必须是发散的
      }
  
      main()
  }
  ```

* 在根目录创建`build.rs`，这是非常关键的一步，原理是通过Rust提供的[构建脚本](https://doc.rust-lang.org/stable/cargo/reference/build-scripts.html#build-scripts)来调整一些编译时的行为，请看考代码中的注释

  ```rust
  use std::{env, error::Error, fs::File, io::Write, path::PathBuf};
  
  fn main() -> Result<(), Box<dyn Error>> {
      //从环境变量OUT_DIR中读取一个路径，用于存放构建过程的一些中间产物
      let out_dir = PathBuf::from(env::var_os("OUT_DIR").unwrap());
  
      //这是最重要的一步了，通过特定的指令告诉编译器从哪个路径搜索链接脚本
      println!("cargo:rustc-link-search={}", out_dir.display());
  
      // 将链接脚本复制到上一步指定的路径
      // 如果在上一步中将链接脚本的搜索路径设置为库的根目录，则这一步可以省略
      File::create(out_dir.join("link.x"))?.write_all(include_bytes!("link.x"))?;
  
      Ok(())
  }
  ```
  

 注：当在`rt`下修改`build.rs`时会触发自动编译，此时`OUT_DIR`指向`rt/target`下的子目录；而编译`app`时`OUT_DIR`则指向`app/target`下的子目录，这意味着`link.x`会被复制到项目`app`中。



## 使用`rt`编写应用程序

创建一个binary package

```powershell
cargo new --bin app
```

修改`cargo.toml`，引入`rt`作为依赖

```toml
[dependencies]
rt = { path = "../rt" }
```

将`rt`中`.cargo`文件夹复制到`app`的根目录，使用和`rt`一样的cargo配置编译。

最后编写自己的`main.rs`

```rust
#![no_std]
#![no_main]

extern crate rt;

#[no_mangle]
pub fn main() -> ! {
    let _x = 42;

    loop {}
}
```

然后编译并检查二进制文件

```powershell
cargo build --bin app # 编译
rust-objdump   -d --no-show-raw-insn .\target\thumbv7m-none-eabi\debug\app # 显示汇编代码
```

会有如下输出，可以看到`Reset`已经被链接进来并调用了`main`函数

```powershell
.\target\thumbv7m-none-eabi\debug\app:  file format elf32-littlearm

Disassembly of section .text:

00000008 <main>:
       8:       sub     sp, #4
       a:       movs    r0, #42
       c:       str     r0, [sp]
       e:       b       0x10 <main+0x8>         @ imm = #-2
      10:       b       0x10 <main+0x8>         @ imm = #-4

00000012 <Reset>:
      12:       push    {r7, lr}
      14:       mov     r7, sp
      16:       bl      0x8 <main>              @ imm = #-18
      1a:       trap
```



注：其实`app`的`.cargo/config`里面的`rustflags`配置项声明了需要了`link.x`，说明`app`对`rt`还是有些显式依赖的，不知道后续有无办法能够移除这个配置项，使得`app`无需知道`rt`中的任何内容。



## 将`rt`改造为类型安全

用户虽然可以编写自己的`main`函数，但如果`main`不符合`rt`的要求，例如用户不小心把`main`编写为一个非发散的函数，此时编译不会报错但运行时会有不可预知的错误。

>  个人认为虽然`rt`中声明了`main`的类型是发散函数，但给`rt`提供`main`是链接器行为而不是编译器行为，链接器不会去管语言级别的一些细节，因此不会有链接错误。而编译时rt`和`app`之间没有代码层面的依赖，因此也不会察觉类型不匹配的问题。

可以在`rt`的`lib.rs`中定义并暴露一个宏给`app`调用，通过宏来做类型检查以消除上述隐患。

```rust
#[macro_export]
macro_rules! entry {
    ($path:path) => {
        #[export_name = "main"]//__main导出为main，则rt中最终链接的是当前文件内的main函数，而不是用户的main函数
        pub unsafe fn __main() -> ! {
            // $path就是用户传入的函数，对它进行类型检验后调用，此时用户写的函数的名称可以自定义了，不一定就是要用main
            let f: fn() -> ! = $path;

            f()
        }
    }
}
```

然后修改`app`中的`main.rs`

```rust
#![no_std]
#![no_main]

use rt::entry;
//使用rt中暴露出来的宏来调用用户编写的函数，此时用户编写的函数可以用其它名称
//其实这样做增加了一些复杂性，之前的方法用户只需要编写一个main函数就可以了，其它什么不用管
//而现在则需要了解entry宏
entry!(main2);

fn main2() -> ! {
    let _x = 42;

    loop {}
}
```



## 在`main`运行之前初始化内存（难点）

`rt`现在已经比较完整了，但是功能上还是有一些缺失，比如用户不能在自己的代码中使用静态变量和字符串，因为编译器会将这些内容生成到`.bss`、`.data`、`.rodata`节中，但我们的链接脚本中抛弃了这些节。为此我们需要修改一下链接脚本：

```link
  /DISCARD/ :
  {
    *(.ARM.exidx .ARM.exidx.*);
  }

  /* 新增三个用于保存数据的section */
  .rodata :
  {
    *(.rodata .rodata.*);
  } > FLASH

  .bss :
  {
    *(.bss .bss.*);
  } > RAM

  .data :
  {
    *(.data .data.*);
  } > RAM
```

这样就能在代码中使用这些变量了

```rust
#![no_std]
#![no_main]

use rt::entry;
//使用rt中暴露出来的宏来调用用户编写的函数，此时用户编写的函数可以用其它名称，例如这里就用了main2
//其实这样做增加了一些复杂性，之前的方法用户只需要编写一个main函数就可以了，其它什么不用管
//而现在则需要了解entry宏
entry!(main2);
static RODATA: &[u8] = b"Hello, world!";
static mut BSS: u8 = 0;
static mut DATA: u16 = 1;
fn main2() -> ! {
    let _x = RODATA;
    let _y = unsafe { &BSS };
    let _z = unsafe { &DATA };

    loop {}
}
```

如果在真机上调试这段代码，你会发现`BSS`和`DATA`的值并非预期中的0和1，这是因为真机启动后内存中的值是随机导致的。但在Qemu上你无法重现这个问题，因为Qemu已经帮你初始化了。

关于真机内存中的值是随机这个问题需要这样认识：

* 编译和链接时会确定一些信息并将它们记录到ELF中，这些信息包括：
  * 变量`BSS`和`DATA`的值（它们分别属于节`.bss`和`.data`）
  * 节`.bss`和`.data`的LMA、VMA值（理解LMA和VMA非常重要，可以参考[这里](https://github.com/cisen/blog/issues/887)和[这里](https://blog.csdn.net/eydwyz/article/details/124179377)）
* ELF会被加载（烧录）到ROM里面，但运行时却在RAM里面。（例如链接脚本里面就把`.bss`和`.data`分配到RAM中，**因此相关变量的地址是指向RAM的**，而此时RAM里面的内容尚未被初始化，直接读取的话会读到脏数据）
* 因为第2条的原因，需要在运行前**将ROM里面的相关数据复制到RAM中**

上述的核心思想是，**编译和链接器为了保持程序能够正常执行，对程序和运行环境作出了一些约定，这些约定被记录在ELF文件中。加载器或者OS必须保证程序运行时这些约定都得以满足**。而对于本教程，Qemu负责将ELF加载到ROM，`lib.rs`中的代码负责初始化RAM并将ROM内的部分数据加载到RAM。

（以上论述仅针对裸机编程，对于现代常用的通用操作系统来说，因为OS已经帮你将虚拟内存设置好了，程序面向的是一个理想的环境：VMA和LMA相等，因此无需关注上述的一些细节了。）

为此我们在使用内存先需要先初始化，首先修改`link.x`，这相当于将一些约定信息写入到ELF中

```link
  /* 新增三个用于保存数据的section */
  .rodata :
  {
    *(.rodata .rodata.*);
  } > FLASH

  .bss :
  {
    _sbss = .; /* 将.bss的起始地址保存到_sbss中 */
    *(.bss .bss.*);
    _ebss = .;/* 将.bss的结束地址保存到_ebss中 */
  } > RAM

  .data : AT(ADDR(.rodata) + SIZEOF(.rodata))  /*指定.data的LMA，紧贴着.rodata*/
  {
    _sdata = .;/* 将.data的起始地址保存到_sdata中 */
    *(.data .data.*);
    _edata = .;/* 将.data的结束地址保存到_edata中 */
  } > RAM

  _sidata = LOADADDR(.data);/*将.data的LMA与某个符号关联起来*/
```

然后修改`lib.rs`，增加对RAM进行初始化的代码

```rust
    // 为何这里需要extern块修饰呢？
    extern "C" {
        static mut _sbss: u8;
        static mut _ebss: u8;

        static mut _sdata: u8;
        static mut _edata: u8;
        static _sidata: u8;
    }

    //初始化.bss只需要将对应区域全部置为0即可
    let count = &_ebss as *const u8 as usize - &_sbss as *const u8 as usize;
    ptr::write_bytes(&mut _sbss as *mut u8, 0, count);

    //初始化.data则需要从ROM复制
    let count = &_edata as *const u8 as usize - &_sdata as *const u8 as usize;
    ptr::copy_nonoverlapping(&_sidata as *const u8, &mut _sdata as *mut u8, count);
```



最后编译并检查一下结果是否符合预期

```powershell
cargo build --bin app
rust-readobj .\target\thumbv7m-none-eabi\debug\app --program-headers --elf-output-style=GNU
```

输出如下：

```powershell
Elf file type is EXEC (Executable file)
Entry point 0x51
There are 6 program headers, starting at offset 52

Program Headers:
  Type           Offset   VirtAddr   PhysAddr   FileSiz MemSiz  Flg Align
  LOAD           0x010000 0x00000000 0x00000000 0x00008 0x00008 R   0x10000
  LOAD           0x010008 0x00000008 0x00000008 0x0038c 0x0038c R E 0x10000
  LOAD           0x0103a0 0x000003a0 0x000003a0 0x00094 0x00094 R   0x10000
  LOAD           0x020000 0x20000000 0x20000000 0x00000 0x00001 RW  0x10000
  LOAD           0x020002 0x20000002 0x00000434 0x00002 0x00002 RW  0x10000
  GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RW  0x0

 Section to Segment mapping:
  Segment Sections...
   00     .vector_table
   01     .text
   02     .rodata
   03     .bss
   04     .data
   05
   None   .debug_abbrev .debug_info .debug_aranges .debug_ranges .debug_str .debug_pubnames .debug_pubtypes .ARM.attributes .debug_frame .debug_line .comment .symtab .shstrtab .strtab
```

可以看到`.data`的LMA和VMA是不一样，这是因为我们在`link.x`中通过`AT`命令对`.data`的LMA进行了调整



# 【4】异常处理

这一章是通过完善vector table，为`rt`增加更多的异常处理程序，同时实践*编译期重写（compile time overridable behavior）*这个功能。这节完整代码见[这里](https://github.com/youth7/the-embedonomicon-note/tree/04-Exception-handling)。

本章主要完成两个功能：

* 为`rt`中vector table中的其它项提供一个默认值（在此之前只提供了前两项）
* 用户在使用`rt`的时候，能够用自定义的函数去覆盖vector table中的默认函数

关于中断、异常（trap）、陷入的概念请参考[这里](http://rcore-os.cn/rCore-Tutorial-Book-v3/chapter0/3os-hw-abstract.html)

### 调整Rust代码

为了演示方便，只修改vector table的前16个函数，因为它们与设备无关，且适用于所有Cortex-M系列的微控制器。先修改`lib.rs`

```rust
pub union Vector {
    // 一个Vector就是vector table中的一项，根据arm的文档，每一项要么是一个异常处理函数，要么是预留（值为0）
    reserved: u32,
    handler: unsafe extern "C" fn(),
}

extern "C" {
    //声明会用到的外部函数，因为有可能是用户提供的所以必须用extern，不明白为何是C规范而不是Rust规范，
    //注意这里只是声明并没有提供具体实现，实现有两种，一种是使用默认的DefaultExceptionHandler；一种是用户提供
    fn NMI();
    fn HardFault();
    fn MemManage();
    fn BusFault();
    fn UsageFault();
    fn SVCall();
    fn PendSV();
    fn SysTick();
}

#[link_section = ".vector_table.exceptions"]// 将异常处理函数保存到节.vector_table.exceptions中
#[no_mangle]
pub static EXCEPTIONS: [Vector; 14] = [//定义vector table中剩余的14项
    Vector { handler: NMI },
    Vector { handler: HardFault },
    Vector { handler: MemManage },
    Vector { handler: BusFault },
    Vector { handler: UsageFault},
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { handler: SVCall },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { handler: PendSV },
    Vector { handler: SysTick },
];

#[no_mangle]
pub extern "C" fn DefaultExceptionHandler() {// 定义一个默认的异常处理函数
    loop {}
}
```



### 调整链接脚本

```link
EXTERN(EXCEPTIONS); 

SECTIONS
{
  .vector_table ORIGIN(FLASH) :
  {
    /* vector table第一项：ISP */
    LONG(ORIGIN(RAM) + LENGTH(RAM));

    /* vector table第二项 */
    KEEP(*(.vector_table.reset_vector));

    KEEP(*(.vector_table.exceptions)); /* 将剩余的14个异常处理函数保存到flash中，加上上面已有的两项刚好16项 */
  } > FLASH

  /* 为符号提供默认值，只有当用户未提供自定义的异常处理程序时候才会生效，注意被提供默认值的项都是在lib.rs中声明过的外部函数 */
  PROVIDE(NMI = DefaultExceptionHandler);
  PROVIDE(HardFault = DefaultExceptionHandler);
  PROVIDE(MemManage = DefaultExceptionHandler);
  PROVIDE(BusFault = DefaultExceptionHandler);
  PROVIDE(UsageFault = DefaultExceptionHandler);
  PROVIDE(SVCall = DefaultExceptionHandler);
  PROVIDE(PendSV = DefaultExceptionHandler);
  PROVIDE(SysTick = DefaultExceptionHandler);
...
```



### 测试一下

先修改`main.rs`，在`main2()`中触发一个异常

```rust
#![no_std]
#![no_main]
#![feature(core_intrinsics)]// 因为使用了core_intrinsics的原因，必须切换到nightly来构建

use core::intrinsics;
use rt::entry;
//使用rt中暴露出来的宏来调用用户编写的函数，此时用户编写的函数可以用其它名称，例如这里就用了main2
//其实这样做增加了一些复杂性，之前的方法用户只需要编写一个main函数就可以了，其它什么不用管
//而现在则需要了解entry宏
entry!(main2);
fn main2() -> ! {
    //触发 HardFault exception
    intrinsics::abort()
}
```

因为用到了core_intrinsics，因此需要切换到nightly中编译

```powershell
rustup default nightly # 切换为nightly
rustup target add thumbv7m-none-eabi #在nightly下需要先重新安装target和其它相关工具
cargo  build --bin app# 编译项目
```

然后按照第二章中的方法启动QEMU和GDB进行调试（注意需要在`app`项目的根目录下进行）

```powershell
(gdb)  target remote :3333
Remote debugging using :3333
rt::Reset () at src/lib.rs:12
12      pub unsafe extern "C" fn Reset() -> ! {
(gdb) b DefaultExceptionHandler # 在默认的异常处理函数DefaultExceptionHandler设置一个断点
Breakpoint 1 at 0x100: file src/lib.rs, line 103.
(gdb) c # 继续运行
Continuing.

# intrinsics::abort()触发异常，使得执行流程切换到DefaultExceptionHandler中
Breakpoint 1, rt::DefaultExceptionHandler () at src/lib.rs:103 
103         loop {}
(gdb) list # 列出断点附近的源码
98          Vector { handler: SysTick },
99      ];
100
101     #[no_mangle]
102     pub extern "C" fn DefaultExceptionHandler() {// €
103         loop {}
104     }
(gdb)
```



安全起见检查vector table是否符合我们的预期，通过以下命令编译并检查

````powershell
cargo build --bin app --release # 使用release模式编译
.\target\thumbv7m-none-eabi\release\app -s -j .vector_table #查看.vector_table内容 
````

 输出如下：

```powershell
.\target\thumbv7m-none-eabi\release\app:        file format elf32-littlearm
Contents of section .vector_table:
 0000 00000120 45000000 83000000 83000000  ... E...........
 0010 83000000 83000000 83000000 00000000  ................
 0020 00000000 00000000 00000000 83000000  ................
 0030 00000000 00000000 83000000 83000000  ................
```

可见.vector_table中有16项，对比一下各项的值可知它确实和`lib.rs`中的`EXCEPTIONS`数组是一致的（0x83000000就是默认的异常函数的值）。此外需要留意第4项，它是异常处理函数`HardFault()`的地址，下一节我们会在`app`中覆盖这个函数，覆盖后它的地址就不再是0x83000000。



### 用户自定义异常处理函数

因为在`lib.rs`中声明了各个异常处理函数为extern，所以用户可以在外部自定义异常处理函数来替代`rt`中的`DefaultExceptionHandler()`，这只需要在`rt`的`main.rs`中定义符合签名的函数即可。

```rust

#[no_mangle]
pub extern "C" fn HardFault() -> ! {
    //自定义异常处理函数，用QEMU调试时候应该停留在这里
    loop {}
}
```

然后像上面那样编译debug，可以发现代码确实停留在用户自定义的` HardFault()`

```powershell
(gdb) target remote :3333
Remote debugging using :3333
rt::Reset () at src/lib.rs:12
12      pub unsafe extern "C" fn Reset() -> ! {
(gdb) b HardFault
Breakpoint 1 at 0x44: file src/main.rs, line 19.
(gdb) c
Continuing.

Breakpoint 1, app::HardFault () at src/main.rs:19
19          loop {}
(gdb) list
14      }
15
16      #[no_mangle]
17      pub extern "C" fn HardFault() -> ! {
18          //QEMU€
19          loop {}
20      }
```

再像上一小节那样编译并检查.vector_table

```powershell
.\target\thumbv7m-none-eabi\release\app:        file format elf32-littlearm
Contents of section .vector_table:
 0000 00000120 47000000 85000000 41000000  ... G.......A...
 0010 85000000 85000000 85000000 00000000  ................
 0020 00000000 00000000 00000000 85000000  ................
 0030 00000000 00000000 85000000 85000000  ................
```

此时`DefaultExceptionHandler()`的地址变成了0x85000000，但是第4项`HardFault()`的值和`DefaultExceptionHandler()`不一样，这是因为用户在`app`中定义了自己的异常处理函数。





# 【5】使用新方法写汇编

这一章主要是在代码中嵌入汇编来修改寄存器的值，从而实现为`HardFault()`传递参数。原文编写时候`asm!`和`global_asm!`尚未稳定，因此是使用旧方式嵌入汇编。这种方式非常繁琐，因此我将它改为用`asm!`来实现。完整代码见[这里](https://github.com/youth7/the-embedonomicon-note/tree/05-assembly-on-stable)

在上一章中，我们将`HardFault()`放置到vector table的特定位置，当对应的异常发生时候`HardFault()`就会被调用。而本章不再将`HardFault()`直接放置到vector table，而是创建一个辅助函数`HardFaultTrampoline()`并将它放置到vector table，然后通过它来调用`HardFault()`。而`HardFaultTrampoline()`在调用`HardFault()`前会修改特定寄存器的值，从而实现为`HardFault()`传参。

## 修改`rt`

首先修改`lib.rs`如下：

```rust
extern "C" {
    fn NMI();
    // fn HardFault();删除对HardFault的声明，因为不需要在rust代码中调用它
    fn MemManage();
    fn BusFault();
    fn UsageFault();
    fn SVCall();
    fn PendSV();
    fn SysTick();
}

#[link_section = ".vector_table.exceptions"]// 将异常处理函数保存到节.vector_table.exceptions中
#[no_mangle]
pub static EXCEPTIONS: [Vector; 14] = [//定义vector table中剩余的14项
    Vector { handler: NMI },
    Vector { handler: HardFaultTrampoline },// 改为使用辅助函数，通过它去调用HardFault
    Vector { handler: MemManage },
    Vector { handler: BusFault },
    Vector { handler: UsageFault},
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { handler: SVCall },
    Vector { reserved: 0 },
    Vector { reserved: 0 },
    Vector { handler: PendSV },
    Vector { handler: SysTick },
];

#[allow(non_snake_case)]
#[no_mangle]
pub fn DefaultExceptionHandler(_ef: *const u32) -> ! {//因为HardFaultTrampoline会传递参数，因此函数签名也要同步修改
    loop {}
}
```



将`HardFaultTrampoline()`放置到vertor table，取代原来的`HardFault()`。它的功能是读取当前栈指针的值，然后将它作为参数传递给`HardFault()`，这样`HardFault()`就可以读取异常发生时候栈里面的内容了。为何不直接在`HardFault()`中读取栈指针呢？因为`HardFault()`是用Rust写的，无法直接访问寄存器的值。

然后在`lib.rs`中使用汇编实现`HardFaultTrampoline()`

```rust
#[no_mangle]
extern "C" fn HardFaultTrampoline() {
    unsafe{
        asm!(
          "mrs r0, MSP",
          "b HardFault"
        )
    }
}
```



## 修改`app`

因为`HardFaultTrampoline()`会给`HardFault()`传参，所以需要修改`main.rs`中`HardFault()`的签名

```rust
#[no_mangle]
#[allow(non_snake_case)]
pub fn HardFault(_ef: *const u32) -> ! {//因为HardFaultTrampoline会传递参数，因此函数签名也要同步修改
    loop {}
}
```

## 测试一下

然后用以下命令编译并检查汇编代码

 ```powershell
  cargo build --bin app --release #编译
  rust-objdump -d --print-imm-hex --no-show-raw-insn .\target\thumbv7m-none-eabi\release\app #显示汇编
 ```

 会有以下输出

```powershell
.\target\thumbv7m-none-eabi\release\app:        file format elf32-littlearm

Disassembly of section .text:

00000040 <HardFault>:
      40:       b       0x40 <HardFault>        @ imm = #-0x4

00000042 <main>:
      42:       trap
      44:       trap

00000046 <Reset>:
      46:       push    {r7, lr}
      48:       mov     r7, sp
      4a:       bl      0x42 <main>             @ imm = #-0xc
      4e:       trap

00000050 <UsageFault>:
      50:       b       0x50 <UsageFault>       @ imm = #-0x4

00000052 <HardFaultTrampoline>:
      52:       push    {r7, lr}# 比我们的汇编多了两行，可能是因为函数调用导致生成了保存寄存器的代码
      54:       mov     r7, sp
      56:       mrs     r0, msp
      5a:       b.w     0x40 <HardFault>        @ imm = #-0x1e
      5e:       pop     {r7, pc}
```

可知`HardFaultTrampoline()`的地址是0x00000052，再检查一下vector table的内容

```powershell
rust-objdump -s -j .vector_table  .\target\thumbv7m-none-eabi\release\app
```

输出如下：

```powershell
.\target\thumbv7m-none-eabi\release\app:        file format elf32-littlearm
Contents of section .vector_table:
 0000 00000120 47000000 51000000 53000000  ... G...Q...S...
 0010 51000000 51000000 51000000 00000000  Q...Q...Q.......
 0020 00000000 00000000 00000000 51000000  ............Q...
 0030 00000000 00000000 51000000 51000000  ........Q...Q...
```

留意第4项的值为0x53000000（Thumb mode），此时证实`HardFaultTrampoline()`确实已经生效。



# 【6】利用符号进行日志输出

在嵌入式系统中，常见的日志输入/输出方式有以下几种：

* 串口：将日志信息写到串口，串口的接收端连接着显示设备
* 内存：将日志信息写到RAM中，然后再从RAM中读取
* 文件：将日志信息写到文件，这要求设备必须有sd卡或者片外flash（出现文件概念的话意味着需要OS支持？）
* 嵌入式设备自带的显示模块、网络网口等

本章主要是2和3的混合体，不过略有区别：不是直接输出日志内容（字符串），而是输出日志内容的地址，然后再根据地址去ELF文件中查找日志的具体内容。（为何不直接输出字符串？是因为在嵌入式中不容易实现？）

具体步骤如下：

1. 在Rust代码中定义若干变量，
2. 修改变量在ELF中的符号名（*symbol name*），将日志内容嵌入到符号名中，则经过编译后日志的内容便存储到ELF中
3. 在Rust代码中输出变量的地址，在符号表中查询这些地址便能得到日志的内容

完整代码请看[这里](https://github.com/youth7/the-embedonomicon-note/tree/06-logging-with-symbols)

## 修改变量导出的符号名称的例子

创建一个名为foo的lib package，然后修改`lib.rs`文件如下：

```rust
#![allow(unused)]
fn main() {
    #[export_name = "Hello, world!"] //修改变量A的符号名
    #[used]// 要求编译器不要丢弃静态变量A，即使它没有被使用
    static A: u8 = 0;

    #[export_name = "你好，这是一个中文句子"]
    #[used]// 要求编译器不要丢弃静态变量B，即使它没有被使用
    static B: u8 = 0;//修改变量B的符号名
}

```

接着编译并检查符号表

```powershell
cargo build --lib;rust-nm .\target\debug\libfoo.rlib
```

会有以下输出：

```powershell
   Compiling foo v0.1.0 (D:\workspace\rust\app\foo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.09s

foo-71f85fa4234f96d2.3bevs2kbnkn4yeof.rcgu.o:
00000000 a @feat.00
00000000 R Hello, world!
00000000 D __imp_Hello, world!
00000000 D __imp_你好，这是一个中文句子
00000000 R 你好，这是一个中文句子

lib.rmeta:
.\target\debug\libfoo.rlib:lib.rmeta: no symbols
```

可见我们成功将一些自定义信息当做符号名写入了ELF中。

## 将日志信息编码到符号名中

通过以下步骤将日志信息编码

1. 为每条日志创建一个对应的`static`类型变量，但变量本身不存储日志的内容，日志的内容是通过attribute编码到符号名中
2. 将步骤1中的变量的地址输出到控制台

先修改`app`中的`main.rs`

```rust
#![no_main]
#![no_std]

use core::fmt::Write;
//使用semihosting技术进行输出，因为QEMU直接支持semihosting。而在真机环境则可能需要用到串口等技术
use cortex_m_semihosting::{debug, hio};

use rt::entry;

entry!(main);

fn main() -> ! {
    let mut hstdout = hio::hstdout().unwrap();

    #[export_name = "Hello, world!"]// 将日志信息编码到静态变量A的符号名中，
    static A: u8 = 0;

    // 将地址的值作为usize输出
    let _ = writeln!(hstdout, "{:#x}", &A as *const u8 as usize);

    #[export_name = "Goodbye"]
    static B: u8 = 0;

    let _ = writeln!(hstdout, "{:#x}", &B as *const u8 as usize);

    debug::exit(debug::EXIT_SUCCESS);

    loop {}
}
```

然后引入相关依赖

```toml
[dependencies]
cortex-m-semihosting = "0.5.0"
rt = { path = "../rt" }
```

最后构建并运行

```powershell
cargo build #构建

#开启semihosting运行
qemu-system-arm `
    -cpu cortex-m3 `
    -machine lm3s6965evb `
    -nographic `
    -semihosting-config enable=on,target=native `
    -kernel target/thumbv7m-none-eabi/debug/app
```

会有如下输出：

```powershell
Timer with period zero, disabling
0x1c4c
0x1c4d
```



每次都要构建后再运行一大串QEMU命令是很繁琐的，可以通过修改`.cargo/config`来简化：

```toml
[target.thumbv7m-none-eabi]
# 增加runner的相关配置项
runner = "qemu-system-arm -cpu cortex-m3 -machine lm3s6965evb -nographic -semihosting-config enable=on,target=native -kernel"
```

这样构建和运行可以简化为一行命令：`cargo run --release`

```powershell
PS D:\workspace\rust\app\app> cargo run --release
    Finished release [optimized] target(s) in 0.03s
     Running `qemu-system-arm -cpu cortex-m3 -machine lm3s6965evb -nographic -semihosting-config enable=on,target=native -kernel target\thumbv7m-none-eabi\release\app`
Timer with period zero, disabling
0x11ec
0x11ed
```



## 从地址中解码出日志信息

在上一步中我们得到了变量的地址，现在需要在符号表中查找这些地址，从而获得这些地址对应的符号名，这可以通过以下命令完成

```powershell
rust-objdump .\target\thumbv7m-none-eabi\debug\app -t | findstr "00000001"
```

然后有以下输出：

```powershell
#从左到右各列的意义是：符号地址 | 符号的flag | 跟符号相关的节的序号 | 所属的节 | 符号长度 | 符号名
00001c4c g     O .rodata        00000001 Hello, world!
00001c4d g     O .rodata        00000001 Goodbye
```

用`findstr`去查找objdump的输出中含有字符串`00000001`的行，如无意外应该只会找到我们定义的两个符号，因为静态变量`A`和`B`的类型都是`u8`，只占一个字节，所以第五列（符号长度）的值必然是`00000001`。



## 一些改进

在之前的实现中，静态变量被编译后会存储到`.rodata`节，这意味着把ELF烧录到flash中后这些静态依然占据空间，即使它们的值并没有被使用（只用到了它们的地址）。因此要想一个办法让程序不要加载这些节从而节省空间，这需要使用链接脚本。

在`app`中创建一个新的链接脚本`log.x`并添加以下内容：

```link
SECTIONS
{
  .log 0 (INFO) : {
    *(.log);
  }
}
```

这段代码的意义如下：

* 收集所有input目标文件中的名为`.log`的节，然后在output目标文件中生成名为`.log`的节

* `INFO`表示该节在运行时不需要在内存中分配空间

* `0`表示该节的的加载地址（设为`0`是有它的特殊意义的，等下再说）

然后修改`app`中的`main.rs`为：

```rust
#![no_main]
#![no_std]

//使用semihosting技术进行输出，因为QEMU直接支持semihosting。而在真机环境则可能需要用到串口等技术
use cortex_m_semihosting::{debug, hio};

use rt::entry;

entry!(main);

fn main() -> ! {
    let mut hstdout = hio::hstdout().unwrap();

    #[export_name = "Hello, world!"]// 将日志信息编码到静态变量A的符号名中，
    #[link_section = ".log"]// 指定该静态变量输出到.log这个节
    static A: u8 = 0;

    // 将地址的值作为usize输出
    let address = &A as *const u8 as usize as u8;
    hstdout.write_all(&[address]).unwrap(); // 不使用core中的格式化I/O，改为使用第三方依赖的二进制I/O

    #[export_name = "Goodbye"]
    #[link_section = ".log"]// 指定该静态变量输出到.log这个节
    static B: u8 = 0;

    let address = &B as *const u8 as usize as u8;
    hstdout.write_all(&[address]).unwrap(); // 不使用core中的格式化I/O，改为使用第三方依赖的二进制I/O

    debug::exit(debug::EXIT_SUCCESS);

    loop {}
}
```

代码中最值得留意的地方有两点：

* 将变量的地址类型强转为`u8`
* 不使用core中的格式化I/O，改为使用第三方依赖的二进制I/O

因为改为了二进制I/O，因此会涉及到多字节的序列化问题，为了避免这个问题干脆将地址改为单个字节。但地址本来是4字节的，这样可能会导致地址的值被截断。为了避免截断的问题我们将`.log`的加载地址设为0，同时将地址的取值范围限制为[0, 255]，这样就能保证地址能够用单个字节来精确表示，避开了被截断的问题。但弊端就是最多只能使用255条日志。

最后在`.cargo/config`中指定新的链接脚本

```link
# 针对这个target使用链接脚本
[target.thumbv7m-none-eabi]
rustflags = [
    "-C", "link-arg=-Tlink.x",
    "-C", "link-arg=-Tlog.x"
]
runner = "qemu-system-arm -cpu cortex-m3 -machine lm3s6965evb -nographic -semihosting-config enable=on,target=native -kernel"
# 指定编译的target，修改这里之后就无需在命令行传递--target参数了
[build]
target = "thumbv7m-none-eabi"
```



然后运行`cargo run --release | Format-Hex`，会有以下输出（注意，原文中是用linux中的`xxd`来显示二进制输出，这里用Win11中powershell自带的的`Format-Hex`来代替）：

```powershell
    Finished dev [unoptimized + debuginfo] target(s) in 0.03s
     Running `qemu-system-arm -cpu cortex-m3 -machine lm3s6965evb -nographic -semihosting-config enable=on,target=native -kernel target\thumbv7m-none-eabi\debug\app`      
Timer with period zero, disabling


           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F

00000000   00 01 
```

可见输出的地址是0x00和0x01，在.log节中查找这两个地址：

```powershell
rust-objdump .\target\thumbv7m-none-eabi\release\app -t | findstr log
```

会有以下输出

```powershell
00000000 g     O .log   00000001 Hello, world!
00000001 g     O .log   00000001 Goodbye
```

一切都符合预期。

## 抽象为一个库

上面虽然已经实现了输出日志，但是这个过程还是相当繁琐用且不直观的，用户的期望的输出日志应该像使用`std::println!`那么简单，为实现这个目的我们需要将上面的逻辑封装为一个lib crate。

先用命令`cargo new --lib log`创建一个名为`lib`的lib package，然后修改`lib.rs`的内容为：

```rust
#![no_std]

pub trait Log {
    type Error;

    fn log(&mut self, address: u8) -> Result<(), Self::Error>;
}

#[macro_export]
macro_rules! log {
    ($logger:expr, $string:expr) => {{//用户调用宏的时候参数包括2个：一个log Trait实例；一个日志字符串
        #[export_name = $string]
        #[link_section = ".log"]
        static SYMBOL: u8 = 0;// 每条日志字符串都有一个对应的静态变量

        $crate::Log::log(&mut $logger, &SYMBOL as *const u8 as usize as u8)
        // 由用户提供具体的输出实现，但是对于本教程来说，个人认为应该由库提供实现才对，这样用户就无需关注这方面的细节
    }};
}
```

和之前的`rt`一样，需要提供`build.rs`用于构建时复制`log.x`

```rust
use std::{env, error::Error, fs::File, io::Write, path::PathBuf};

fn main() -> Result<(), Box<dyn Error>> {
    // Put the linker script somewhere the linker can find it
    let out = PathBuf::from(env::var("OUT_DIR")?);

    File::create(out.join("log.x"))?.write_all(include_bytes!("log.x"))?;

    println!("cargo:rustc-link-search={}", out.display());

    Ok(())
}
```

最后修改`app`中的`main.rs`，让它调用`log`中的宏来输出日志

```rust
#![no_main]
#![no_std]

use cortex_m_semihosting::{
    debug,
    hio::{self, HostStream}//0.5.0之后改为使用HostStream结构体，原文中是使用HStdout
};

use log::{log, Log};
use rt::entry;

struct Logger {
    hstdout: HostStream,
}

impl Log for Logger {
    type Error = ();

    fn log(&mut self, address: u8) -> Result<(), ()> {
        self.hstdout.write_all(&[address])
    }
}

entry!(main);

fn main() -> ! {
    let hstdout = hio::hstdout().unwrap();
    let mut logger = Logger { hstdout };

    let _ = log!(logger, "Hello, world!");

    let _ = log!(logger, "Goodbye");

    debug::exit(debug::EXIT_SUCCESS);

    loop {}
}

```

此时打印日志所用的宏已经非常接近`println!`，比之前那种晦涩的方法好多了！同时不要忘记修改 `Cargo.toml` ，引入`log`作为依赖

```toml
[dependencies]
rt = {path ="../rt"}
log = {path ="../log"}
cortex-m-semihosting  = "0.5.0"
```

最后运行一下`cargo run --release | Format-Hex`会有以下输出：

```powershell
    Finished release [optimized] target(s) in 0.71s
     Running `qemu-system-arm -cpu cortex-m3 -machine lm3s6965evb -nographic -semihosting-config enable=on,target=native -kernel target\thumbv7m-none-eabi\release\app`
Timer with period zero, disabling


           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F

00000000   00 01   
```

按照上一小节的方法用`rust-objdump`去检查ELF文件，会发现相关位置就是我们日志中输出的字符串，这里不再重复

## 日志分级

实现日志分级的思想比较简单，如上所述我们地址的有效范围是[0, 255]，我们在这个区间之中取一点n，让[0, n]这个地址区间放error级别的日志地址，[n, 255]放warn级别的日志地址，则实现了日志分级。此时想专门看某种类型的日志的话，只需要拿特定范围的地址值去搜索ELF文件即可。

首先我们需要修改`log`中的`lib.rs`，提供分别用于输出warn和error级别日志的宏：

```rust
#![no_std]

pub trait Log {
    type Error;
    fn log(&mut self, address: u8) -> Result<(), Self::Error>;
}

// 输出error等级的日志
#[macro_export]
macro_rules! error {
    ($logger:expr, $string:expr) => {{
        #[export_name = $string]
        #[link_section = ".log.error"] // 放置到.log.error这个节
        static SYMBOL: u8 = 0;
        $crate::Log::log(&mut $logger, &SYMBOL as *const u8 as usize as u8)//最终都是调用log函数，只是放置的地方不一样
    }};
}

// 输出warn等级的日志
#[macro_export]
macro_rules! warn {
    ($logger:expr, $string:expr) => {{
        #[export_name = $string]
        #[link_section = ".log.warning"] // 放置到.log.warning这个节
        static SYMBOL: u8 = 0;
        $crate::Log::log(&mut $logger, &SYMBOL as *const u8 as usize as u8)//最终都是调用log函数，只是放置的地方不一样
    }};
}
```

然后调整链接脚本，让不同级别的日志按照我们上面描述的方式放置，注意`__log_warning_start__`就是我们上面说的`n`，它是不同级别日志的分界点

```link
SECTIONS
{
  .log 0 (INFO) : {
    *(.log.error);              /*前面部分放置error级别日志*/
    __log_warning_start__ = .;  /*将当前地址值与符号__log_warning_start__关联起来，意味着剩下地址存的都是警告级别的日志*/
    *(.log.warning);            /*剩下部分放置warning级别日志*/
  }
}
```

最后修改`app`中的`main.rs`，使用新的宏来输出不同级别的日志

```rust
#![no_main]
#![no_std]

use cortex_m_semihosting::{
    debug,
    hio::{self, HostStream}//0.5.0之后改为使用HostStream结构体，原文中是使用HStdout
};

use log::{error, warn, Log};
use rt::entry;

struct Logger {
    hstdout: HostStream,
}

impl Log for Logger {
    type Error = ();
    fn log(&mut self, address: u8) -> Result<(), ()> {
        self.hstdout.write_all(&[address])
    }
}

entry!(main);

fn main() -> ! {
    let hstdout = hio::hstdout().unwrap();
    let mut logger = Logger { hstdout };
    let _ = warn!(logger, "Hello, world!");
    let _ = error!(logger, "Goodbye");
    let _ = error!(logger, "你好呀");
    let _ = warn!(logger, "是的师父！");
    debug::exit(debug::EXIT_SUCCESS);
    loop {}
}
```

用`cargo run --release | Format-Hex`运行程序，会有以下输出：

```powershell
           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F

00000000   02 00 01 03 
```

虽然rust代码里交错输出warn和error日志，但是这并不会改变它们的关系：**error日志的地址永远小于warn日志**。这是由链接脚本决定的，可以从输出中观察到这个规律。同时我们检查一下生成的二进制文件

```bash
# 进入wsl然后执行以下命令：
objdump ./target/thumbv7m-none-eabi/release/app -t | grep log
# 然后会有以下输出
00000002 g     O .log   00000001 Hello, world!
00000000 g     O .log   00000001 Goodbye
00000001 g     O .log   00000001 你好呀
00000003 g     O .log   00000001 是的师父！
00000002 g       .log   00000000 __log_warning_start__
# 在wsl执行的原因是程序中用了中文字符串，在powershell下用rust-objdump去解析的话会乱码，效果不好。如果没有安装wsl的话也可以像之前那样使用命令:
# rust-objdump .\target\thumbv7m-none-eabi\release\app -t | findstr log
```

相比之前多了符号`__log_warning_start__`，地址值属于[0, `__log_warning_start__`]的符号都代表error级别日志；地址值属于[`__log_warning_start__`, 255]的符号都代表warn级别日志。



# 【7】全局的单例对象

本章主要是对上一章基进行改进，使得`log!`的使用更加像里的`std::println!`，即使用类似`log!(日志信息)`这样的API来输出日志。这种调用方式和之前相比少了一个`logger`对象，实现这个特性的原理是，注册一个全局的`logger`对象，从而使得用户在调用`log!`时不需要再提供`logger`。完整代码请见[这里](https://github.com/youth7/the-embedonomicon-note/tree/07-global-singletons)

首先要修改`log`的`lib.rs`，它对外提供这些功能：

* 让用户注册全局的单例对象`logger`
* 提供`log!`宏，该宏可以使用全局或自定义的`logger`进行日志输出

具体代码如下，一些重要的细节已经注释：

```rust
#![no_std]

//关于Sync、Send的语义参考：https://www.zhihu.com/question/303273488/answer/2345814358
pub trait GlobalLog: Sync {
    /**
    声明一个trait，全局的单例日志对象必须实现它，需要注意以下几点：
    1，log方法只需要&self，不消耗所有权，因为它用的是单例的全局共享对象。
    2，这里并没有像下面的Log trait那样定义一个关联的错误类型，这是为了简化细节。
       将错误处理委托给用户，而不是由库指定错误处理规则并强制用户实现。
    **/
    fn log(&self, address: u8);
}

pub trait Log {
    type Error;
    fn log(&mut self, address: u8) -> Result<(), Self::Error>;
}

#[macro_export]
macro_rules! log {
    //该宏接受两种传参，第一种传参不需要提供日志对象，第二种传参需要提供日志对象

    //第一种传参方式，此时会使用一个名为"LOGGER"的全局对象进行日志输出，它是一个定义在某处的全局对象
    ($string:expr) => {
        unsafe {
            extern "Rust" {
                //关于$crate请见：
                //https://zjp-cn.github.io/tlborm/decl-macros/minutiae/hygiene.html?highlight=%24crate#unhygientic
                //我们并不知道LOGGER的具体类型，但要求它必须实现了这里必须实现了GlobalLog，所以必须用trait object
                static LOGGER: &'static dyn $crate::GlobalLog;
            }

            #[export_name = $string]
            #[link_section = ".log"]
            static SYMBOL: u8 = 0;

            $crate::GlobalLog::log(LOGGER, &SYMBOL as *const u8 as usize as u8)
        }
    };

    //第二种传参方式，需要用户自己提供日志对象进行输出，这是上一章的方式
    ($logger:expr, $string:expr) => {{
        #[export_name = $string]
        #[link_section = ".log"]
        static SYMBOL: u8 = 0;

        $crate::Log::log(&mut $logger, &SYMBOL as *const u8 as usize as u8)
    }};
}

//提供一个宏，让用户注册单例的全局日志对象，并将符号名称定为"LOGGER"，这样正好和上面对应
#[macro_export]
macro_rules! global_logger {
    ($logger:expr) => {
        #[no_mangle]
        pub static LOGGER: &dyn $crate::GlobalLog = &$logger;
    };
}
```



然后我们修改`app/main.rs`来使用上述的新特性：

```rust
#![no_main]
#![no_std]

use cortex_m::interrupt;
use cortex_m_semihosting::{
    debug,
    hio::{self, HostStream}//0.5.0之后改为使用HostStream结构体，原文中是使用HStdout
};

use log::{global_logger, log, GlobalLog};
use rt::entry;

struct Logger;

global_logger!(Logger);//将Logger注册为全局logger，这样在使用log!宏的时候就不再需要提供logger对象

entry!(main);

fn main() -> ! {
    log!("Hello, world!");//更为简洁的日志API，不需要主动提供logger对象
    log!("Goodbye");
    debug::exit(debug::EXIT_SUCCESS);
    loop {}
}

//全局logger的实现
impl GlobalLog for Logger {
    fn log(&self, address: u8) {
        //interrupt::free作用是在一个无中断的上下文环境中执行函数，这是访问static mut类型变量的要求
        //因为HSTDOUT是静态变量，只有做到这样才能保证内存安全。
        //这种机制就是所谓的临界区（critical section）
        interrupt::free(|_| unsafe {
            static mut HSTDOUT: Option<HostStream> = None;

            // 延迟初始化
            if HSTDOUT.is_none() {
                HSTDOUT = Some(hio::hstdout()?);
            }
            let hstdout = HSTDOUT.as_mut().unwrap();
            hstdout.write_all(&[address])
        })
        .ok(); // 调用ok()意味着忽略错误并返回Option
    }
}
```

不要忘记在`Cargo.toml`中引入新的依赖

```toml
[dependencies]
rt = {path ="../rt"}
log = {path ="../log"}
cortex-m-semihosting  = "0.5.0"
cortex-m = "0.7.6"
```



用`cargo run --release | Format-Hex`运行程序，会有以下输出：

```powershell
           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F

00000000   00 01 
```

使用全局单例对象来简化`log!`宏的目标已经达成。

因为使用了trait object，因此可能会因为引入vtable（实现动态分派）而造成性能损耗。但LLVM似乎相当智能地做了优化，对比下面的命令和输出可以发现，在release模式下LOGGER都找不到了

```powershell
cargo objdump --bin app --release -- -t| findstr LOGGER
    Finished release [optimized] target(s) in 0.03s #release模式下已经找不到符号LOGGER

cargo objdump --bin app -- -t| findstr LOGGER
    Finished dev [unoptimized + debuginfo] target(s) in 0.03s
00000730 g     O .rodata        00000008 LOGGER
```







# 【8】DMA

第八章对实现DMA做了介绍并给出一些代码，但没有可供实际运行的例子，因此这个章节暂时先放一放，日后如果有能力在此基础上实现一个可以运行的DMA时候再回来补充笔记
