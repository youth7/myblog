# QEMU基础

## 简介

QEMU是一个**模拟器**，可以模拟除了CPU外等众多设备。注意QEMU和virtualbox之类是有区别的，前者具emulation和virtualization的能力，而后者只有virtualization的能力，关于两者的区别可以参考[这里](https://stackoverflow.com/questions/6234711/what-are-the-specific-differences-between-an-emulator-and-a-virtual-machine)

QEMU的两种模式：

* System Emulation：对系统的全方位的底层模拟，可以模拟cpu、内存和各种设备。毫无疑问，编写OS时使用的就是这个模式。
* [User Mode Emulation](https://www.qemu.org/docs/master/user/main.html)：假设A，B是不同架构下的CPU，则该模式可以让在A上编译并运行的程序跑在B上，相当于模拟了程序的运行环境。这个模式提供了以下特性：
  * 系统调用转换
  * POSIX信号处理：将host和虚拟CPU的信号重定向到QEMU中的目标程序上
  * 线程模型：在Linux上，QEMU模拟了`clone`系统调用，为每个QEMU虚拟线程都创建了一个与之对应的系统原生线程。

本文只介绍System Emulation。

参考资料：
* [一步步教你：如何用Qemu来模拟ARM系统](https://www.cnblogs.com/sewain/p/14206365.html)



## 在Ubuntu20.04.2上编译安装QEMU7.2.0

按照官方的指引编译时报错了，根据错误信息还需要安装以下工具：

```bash
apt-get install libslirp-dev	#这个一定要在编译前就安装，并启用编译选项--enable-slirp，否则后面运行时候会出现错误：network backend 'user' is not compiled into this binary

sudo apt install ninja-build #报错缺少ninja
sudo apt-get install libglib2.0-dev	#报错：lib-2.56 gthread-2.0 is required to compile QEMU
sudo apt install libpixman-1-dev	#报错：Dependency "pixman-1" not found, tried pkgconfig
```

```bash
sudo ./configure --enable-slirp
sudo make
```





## [System Emulation](https://www.qemu.org/docs/master/system/index.html)
## [一些工具](https://www.qemu.org/docs/master/tools/index.html)
## [System Emulation的管理与交互](https://www.qemu.org/docs/master/interop/index.html)
## [System Emulation Guest Hardware Specifications](https://www.qemu.org/docs/master/specs/index.html#)
This section of the manual contains specifications of guest hardware that is specific to QEMU


---

> 以下为待分类的旧内容

## QEMU监视器（[QEMU monitor](https://www.QEMU.org/docs/master/system/monitor.html)）

QEMU 运行时会提供一个监视器console用来与用户交互。使用监视器console中提供的命令可以检查运行中的操作系统、插拔媒体设备、抓取屏幕截图或音频片段，以及控制虚拟机的其他方面。 

> 与其他的虚拟化程序如 [VirtualBox](https://wiki.archlinux.org/title/VirtualBox) 和 [VMware](https://wiki.archlinux.org/title/VMware) 不同, QEMU不提供管理虚拟机的GUI（运行虚拟机时出现的窗口除外），也不提供创建具有已保存设置的持久虚拟机的方法。除非您已创建自定义脚本以启动虚拟机，否则必须在每次启动时在命令行上指定运行虚拟机的所有参数。

参考资料:

* [QEMU (简体中文)](https://wiki.archlinux.org/title/QEMU_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#QEMU_%E7%9B%91%E8%A7%86%E5%99%A8)

* [使用 QEMU 监视器管理虚拟机](https://documentation.suse.com/zh-cn/sles/15-SP2/html/SLES-all/cha-qemu-monitor.html#sec-qemu-monitor-access)





## 启动QEMU时的命令行选项

具体参考[文档](https://www.QEMU.org/docs/master/system/invocation.html)：这些命令行选项按照功能可分为多种类型，而课程中用到的参数有：

* -machine：指定需要模拟的机器。这里指定的貌似是整机芯片组的架构而不仅仅是cpu架构，可以参考[这里](https://xiaobinzhao.github.io/2021/12/14/QEMU%20%20Machine%20Type/)
* -nographic：禁用图形化，串口设备的输出会被重定向到QEMU monitor
* -bios：通过文件名指定BIOS程序
* --device：模拟一个设备，关于设备的模拟请看[这里](https://www.QEMU.org/docs/master/system/device-emulation.html)，需要了解的概念有：
  * 设备前端：A device front end is how a device is presented to the guest. The type of device presented should match the hardware that the guest operating system is expecting to see.
  * 设备总线：
  * 设备后端：The back end describes how the data from the emulated device will be processed by QEMU
  * 设备Pass Through：模拟设备的输出数据是如何被QEMU处理的。


## QEMU运行时的快捷键

* 图形化前端设备的快捷键见[这里](https://www.QEMU.org/docs/master/system/keys.html)

* 字符后端设备的快捷键见[这里](https://www.QEMU.org/docs/master/system/mux-chardev.html)（这里能使用的命令都是用`Ctrl-a`作为前缀转义过的，似乎是为了区别QEMU monitor中可用的命令，常用的有：
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