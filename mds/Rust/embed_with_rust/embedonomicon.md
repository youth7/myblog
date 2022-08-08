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
    * 采用7.0.0版本（[qemu-w64-setup-20220419.exe](https://qemu.weilnetz.de/w64/qemu-w64-setup-20220419.exe)）

* debug工具

    * [gcc-arm-none-eabi-10.3-2021.10-win32](https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.exe)
    * [gcc-arm-11.2-2022.02-mingw-w64-i686-arm-none-eabi.exe](https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/11.2-2022.02/binrel/gcc-arm-11.2-2022.02-mingw-w64-i686-arm-none-eabi.exe)



>  注意：Rust Edition原书采用2018，本文采用2021。按照官方的说法，Rust Edition和Rust的版本应该是独立的，基于任何一个Rust Edition的代码应该都可以在最新版本的Rust编译器上编译。（All Rust code, regardless of edition, is ultimately compiled to the same internal representation within the compiler.）





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

创建一个名为link.x的文件，其内容为：

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





## 检查与测试



# `main`接口

# 异常处理

# 使用旧式方法写汇编

# 使用符号进行日志输出

# 全局的单例对象

# DMA

