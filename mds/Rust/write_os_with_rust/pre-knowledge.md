本文是对[rCore-Tutorial-Book 第三版 — rCore-Tutorial-Book-v3 3.6.0-alpha.1 文档 (rcore-os.github.io)](https://rcore-os.github.io/rCore-Tutorial-Book-v3/index.html)的前置知识进行补充，包括以下几块

* Rust基础

  * cargo
  * Attribute
  * 编译器设置

* QEMU基础

  * 简介
  * 基本使用
  * 启动流程

* ELF基础

  

# Rust基础

# QEMU基础

QEMU是一个**模拟器**，可以模拟除了CPU外等众多设备。注意QEMU和virtualbox之类是有区别的，前者具emulation和virtualization的能力，而后者只有virtualization的能力，关于两者的区别可以参考[这里](https://stackoverflow.com/questions/6234711/what-are-the-specific-differences-between-an-emulator-and-a-virtual-machine)

QEMU的两种模式：

* System Emulation：对系统的全方位的底层模拟，可以模拟cpu、内存和各种设备。毫无疑问，编写OS时使用的就是这个模式。
* User Mode Emulation：假设A，B是不同架构下的CPU，则该模式可以让在A上编译的程序跑在B上，相当于模拟了程序的运行环境。这个模式提供了以下特性：
  * 系统调用转换
  * POSIX信号处理
  * 线程模型


## QEMU命令行可选项

具体参考[文档](https://www.QEMU.org/docs/master/system/invocation.html)：这些命令行选项按照功能可分为多种类型，而课程中用到的参数有：

* -machine：指定需要模拟的机器。这里指定的貌似是整机芯片组的架构而不仅仅是cpu架构，可以参考[这里](https://xiaobinzhao.github.io/2021/12/14/QEMU%20%20Machine%20Type/)
* -nographic：禁用图形化，串口设备的输出会被重定向到[QEMU monitor](https://www.QEMU.org/docs/master/system/monitor.html)
* -bios：通过文件名指定BIOS程序
* --device：模拟一个设备，关于设备的模拟请看[这里](https://www.QEMU.org/docs/master/system/device-emulation.html)，需要了解的概念有：
  * 设备前端：A device front end is how a device is presented to the guest. The type of device presented should match the hardware that the guest operating system is expecting to see.
  * 设备总线：
  * 设备后端：The back end describes how the data from the emulated device will be processed by QEMU
  * 设备Pass Through：模拟设备的输出数据是如何被QEMU处理的。


## QEMU的快捷键

* 图形化前端设备的快捷键见[这里](https://www.QEMU.org/docs/master/system/keys.html)

* 字符后端设备的快捷键见[这里](https://www.QEMU.org/docs/master/system/mux-chardev.html)（这里能使用的命令都是用`Ctrl-a`作为前缀转义过的，似乎是为了区别[monitor](https://www.QEMU.org/docs/master/system/monitor.html)中可用的命令），常用的有：
  * Ctrl-a x：退出模拟器


## 通用Loader

通过设置`loader`设备，可以在QEMU启动时：

* 指定某处内存的值
* 加载镜像文件到内存中的指定位置
* 设置CPU PC寄存器的值

## 针对RISC-V的专门配置

当borad model为 `sifive_u` 或者 `virt`时，可以指定使用不同的risc-v CPU固件来启动

* `-bios default` - This is the default behaviour if no -bios option is included. This option will load the default OpenSBI firmware automatically. The firmware is included with the QEMU release and no user interaction is required. All a user needs to do is specify the kernel they want to boot with the -kernel option 
* `-bios none` - QEMU will not automatically load any firmware. It is up to the user to load all the images they need. 
* `-bios <file>` - Tells QEMU to load the specified file as the firmwar





# ELF基础
这个请参考[这里的第7章](/mds/csapp3e/index.md)

