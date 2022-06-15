# 前置知识

本章的任务是从裸机启动并向控制台打印`hello world`然后关机，这是从零到一的最为关键的一步，有好几个领域的知识需要提前掌握，包括：

* Rust系统编程基础：宏、[Attribute](https://course.rs/advance/macro.html)、[core](https://doc.rust-lang.org/core/index.html)

* Qemu的基本使用，这个其实不太重要，只需要了解教材中的基本用法即可

* risc-v的基础知识，包括汇编，risc-v的基本架构，几种运行模式等，可参考《RISC-V架构与嵌入式开发快速入门》

* 编译链接基础知识，包括ELF格式，编译和静态链接的一般过程，可参考《程序员的自我修养：链接、装载与库》

* 一些工具知识，包括：

  * gcc编译套件的安装和使用，如使用gdb来debug Qemu
  * rust的cargo的使用和设置，如设置编译器的一些性质和使用链接脚本
  * rust的二进制工具使用（其实用系统自带的二进制工具也可以）

  

# 重点

## 启动流程和入口

本章最为关键的内容就是理解清楚risc-v体系的启动流程，只有了解启动流程的各个阶段，并把内核代码**放置到cpu的pc寄存器指向的位置**才能让自己编写的内核接管系统。

> * 关于系统启动的一般过程可以参考[这里](https://www.zhihu.com/question/21672895/answer/774538058)
> 
> * 关于risc-v的启动过程可以参考[这里](https://rcore-os.github.io/rCore-Tutorial-Book-v3/appendix-c/index.html)

一般来说系统启动分为3个阶段

`Rom Stage ⟹ Ram Stage ⟹ Find something to boot Stage`

这个过程比较粗糙，这是因为启动过程都是跟硬件相关的，很难做出一个精细的公共规范。后来有人总结出了一个通用的启动流程（https://riscv.org/wp-content/uploads/2019/12/Summit_bootflow.pdf），将上述三个阶段进一步细分如下，每个阶段都负责一部分资源的初始化并且将控制权转移到下一阶段：

`ROM ⟹ LOADER ⟹ RUNTIME ⟹ BOOTLOADER ⟹ OS`

（感觉这个启动流程有点牵强，并不是每个硬件平台都能如此细分）

而对于我们实验中所用的Qemu来说，则只简单地分为3个步骤，这个3个步骤如何划分到上面所说的三个阶段尚<u>未明确</u>

| 步骤 | 代码入口   | 运行的程序       | 说明                                                         |
| ---- | ---------- | ---------------- | ------------------------------------------------------------ |
| 1    | 0x1000     | Qemu固件中的程序 | 这里的“固件”是指Qemu中的写死的代码，对标真机中的“固件”<br>此阶段依然没有初始化栈空间，可以认为没有初始化内存？ |
| 2    | 0x80000000 | RustSBI          | 固件中写死。入口地址是通过gdb debug看出来的，真机是否如此不清楚。 |
| 3    | 0x80200000 | 用户自己写的代码 | 入口地址是启动Qemu时候通过命令行指定的，具体的流程如下：<br>1，在`main.rs`中调用汇编`entry.asm`，先分配栈空间。<br>2，`entry.asm`调用`main.rs`中定义的`rust_main()`，进行一些初始化工作，然后输出hello world并关机 |



## ELF VS bin

从教材提供的Qemu启动脚本可知道我们无论是SBI还是我们的三叶虫OS都是`.bin`后缀的，这是因为此时完整的OS尚不存在，不能处理复杂的ELF文件，因此需要直接就可以运行的二进制指令（这也是为何我们用rust写的三叶虫OS需要strip之后才能直接使用）。

关于ELF和bin文件的差异可以看：[what-is-the-difference-between-elf-files-and-bin-files](https://stackoverflow.com/questions/2427011/what-is-the-difference-between-elf-files-and-bin-files)。简单来说就是ELF处理二进制之外还有其它元数据，这些元数据是用来支持debug、静态/动态链接的。

## 分配栈空间

在`entry.asm`中虽然分配了栈，但是我们的代码中并没有显式使用，  栈主要是函数调用的时候被用来保存一些寄存器信息，而这些代码是编译器自动生成的，因此我们感知不到栈的使用。

# 一些可以暂时忽略的问题

这些问题会在后续章节逐渐清晰，暂时不需要过于关注，包括：

* SBI规范和调用方式（想想为何用`ecall`就能调用SBI提供的函数？）
* risc-v的启动流程和特权机制
