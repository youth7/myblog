# 《The embedonomicon》

# 0 前言

[《The embedonomicon》](https://docs.rust-embedded.org/embedonomicon/preface.html)包含了以下内容：

* 带领你从头开始构建`#![no_std]`应用程序（裸机编程）
* 开发基于特定架构的Cortex-M微控制器的应用程序，并不断迭代这个开发过程



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

## 和原教程的一些差异

  * Rust Edition原书采用2018，本文采用2021。按照官方的说法，Rust Edition和Rust的版本应该是独立的，基于任何一个Rust Edition的代码应该都可以在最新版本的Rust编译器上编译。（All Rust code, regardless of edition, is ultimately compiled to the same internal representation within the compiler.）
  * 原文中是通过cargo子命令的方式去调用cargo-binutils，例如使用`cargo size`而不是`rust-size`。个人觉得这样虽然简洁但是不够直观，因此我将使用直接调用的方式调用cargo-binutils
  * 所有命令都是在powershell下运行的

  





# 1 最小的`#![no_std]`程序

> 本节完整代码见：[https://github.com/youth7/the-embedonomicon-note/tree/01-the-smallest-nostd-program](https://github.com/youth7/the-embedonomicon-note/tree/01-the-smallest-nostd-program)

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

```bash
# 编译代码，--target是cargo命令的参数,指定了编译产物的目标平台，详情参考cargo book
# --emit指定了编译产物的文件类型，详情参考rustc book
cargo rustc --target thumbv7m-none-eabi -- --emit=obj

# 列出目标文件中的符号
rust-nm  target/thumbv7m-none-eabi/debug/deps/app-*.o
```

此时的输出为

```bash
00000000 T rust_begin_unwind
```



如果你安装了wsl2的话，可以用其它命令来查看符号，例如使用`readelf`来查看
```bash
readelf -s ./target/thumbv7m-none-eabi/debug/deps/*.o
```

控制台输出：

```bash
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

```bash
nm ./target/thumbv7m-none-eabi/debug/deps/*.o
```

控制台输出：

```bash
00000000 t $t.0
00000001 T rust_begin_unwind
```



## `#[panic_handler]`和`eh_personality`

刚开始的时候觉得两者都是程序崩溃时调用的，它们有什么区别？[文档](https://doc.rust-lang.org/stable/book/ch09-01-unrecoverable-errors-with-panic.html)是这样解释的：

>By default, when a panic occurs, the program starts *unwinding*, which means Rust walks back up the stack and cleans up the data from each function it encounters. However, this walking back and cleanup is a lot of work. Rust, therefore, allows you to choose the alternative of immediately *aborting*, which ends the program without cleaning up. Memory that the program was using will then need to be cleaned up by the operating system. If in your project you need to make the resulting binary as small as possible, you can switch from unwinding to aborting upon a panic by adding `panic = 'abort'` to the appropriate `[profile]` sections in your *Cargo.toml* file. For example, if you want to abort on panic in release mode, add this:
>
>```
>[profile.release]
>panic = 'abort'
>```



我个人的疑问是这两个设定是相互独立的吗，还是说默认的`#[panic_handler]`实现里面包含了`eh_personality`？

但无论如何，**在本文的运行环境下并不需要对`eh_personality`做任何修改**

> 另：eh应该是exception handling的缩写，见[这里的讨论](https://www.reddit.com/r/rust/comments/estvau/til_why_the_eh_personality_language_item_is/)



# 2 内存布局

> 本章节完整代码见[https://github.com/youth7/the-embedonomicon-note/tree/02-memory-layout](https://github.com/youth7/the-embedonomicon-note/tree/02-memory-layout)

这一章主要是讲如何生成正确结构的二进制文件，使其能够在特定架构的CPU上运行。要实现这个目标就必须：

* 了解CPU对二进制文件结构的要求
* 编写Rust代码
* 通过链接器调整二进制文件结构



## 了解CPU对二进制文件结构的要求

教程是基于Cortex-M3微控制器[LM3S6965](http://www.ti.com/product/LM3S6965)编写的，关于它的技术细节可以查阅文档，目前对我们来说最重要的是：

>  **初始化[vector table](https://developer.arm.com/docs/dui0552/latest/the-cortex-m3-processor/exception-model/vector-table) 前两个指针的值**

vector_table是一个指针数组，里面每个元素（vector）都指向了某个内存地址（大部分是异常处理函数的起始地址），关于它的具体结构可以看[这里](https://documentation-service.arm.com/static/5ea823e69931941038df1b02?token=)。对本教程来说最重要的是前2个指针：

* 第1个：（`Initial SP value`）栈顶指针，用于初始化栈
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

### EXTERN

链接器会从entry指定的函数开始，从目标文件中递归搜索所有用到的符号，一旦所有符合解析完成了就停止，即使此时还有目标文件未被搜索。`EXTERN`的作用是强制链接器去继续解析被`EXTERN`作为参数的符号，例如本节中的`RESET_VECTOR`。

一开始不太明白为何要多用一个变量`RESET_VECTOR`而不是直接使用`Reset`函数，后来发现Reset函数是被编译到`.text`节中的，

这样后续要继续引用`Reset`的地址会比较麻烦，用`RESET_VECTOR`来保存`Reset`的地址并放到`.vector_table.reset_vecto`r中有利于在链接脚本中引用该地址

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

```bash
# 使用rust-objdump去检查最终生成的可执行文件中的汇编代码
rust-objdump -d --no-show-raw-insn .\target\thumbv7m-none-eabi\debug\app
```

此时输出为：

```bash
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

```bash
# 使用rust-objdump去检查最终生成的可执行文件中指定节的具体内容
rust-objdump -s --section .vector_table .\target\thumbv7m-none-eabi\debug\app
```

此时的输出为

```bash
.\target\thumbv7m-none-eabi\debug\app:  file format elf32-littlearm
Contents of section .vector_table:
 0000 00000120 09000000                    ... ....
```

vector table第1个元素是的值由`LONG(ORIGIN(RAM) + LENGTH(RAM))`决定，这个表达式的值为0x20000000 + 64*1024 = 0x20010000，二进制表示为`00100000_00000001_00000000_00000000`。将这个二进制按照小端法读取出来就是0x00000120（这是objump的行为）。

第2个元素的值是0x09000000，但是从上面我们可以知道`Reset`函数其实位于0x00000008。其实这是ARM cpu的规范，用函数地址的最低位的奇偶性来表示当前处于哪种模式，具体可以看[这里](https://stackoverflow.com/questions/37004954/function-address-in-arm-assembly-have-one-byte-offset)



## 测试

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







# `main`接口

# 异常处理

# 使用旧式方法写汇编

# 使用符号进行日志输出

# 全局的单例对象

# DMA

