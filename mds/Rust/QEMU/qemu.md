

## 简介

QEMU是一个**模拟器**，可以模拟除了CPU外等众多设备。注意QEMU和virtualbox之类是有区别的，前者具emulation和virtualization的能力，而后者只有virtualization的能力，关于两者的区别可以参考[这里](https://stackoverflow.com/questions/6234711/what-are-the-specific-differences-between-an-emulator-and-a-virtual-machine)。简单来说：

> Emulation is using software to provide a different execution environment or architecture.
>
> Virtualization is more about creating virtual barriers between multiple  virtual environments running in the same physical environment. 

QEMU的两种模式：

* System Emulation：对系统的全方位的底层模拟，可以模拟cpu、内存和各种设备。毫无疑问，编写OS时使用的就是这个模式。
* [User Mode Emulation](https://www.qemu.org/docs/master/user/main.html)：这个模式的作用是：*In this mode, QEMU can launch processes compiled for one CPU on another CPU*，相当于模拟了程序的运行环境（意思是**在A平台上编译好的程序可以直接在B平台上面跑**）。其实现原理是该模式提供了以下特性：
  * **System call translation**
  * **POSIX signal handling**：将host和虚拟CPU的信号重定向到QEMU中的目标程序上
  * **Threading**：在Linux上，QEMU模拟了`clone`系统调用，为每个QEMU虚拟线程都创建了一个与之对应的系统原生线程。

QEMU能运行在以下架构和OS：https://www.qemu.org/docs/master/about/build-platforms.html

QEMU能模拟以下架构：https://www.qemu.org/docs/master/about/emulation.html



参考资料：

* [一步步教你：如何用Qemu来模拟ARM系统](https://www.cnblogs.com/sewain/p/14206365.html)



## [System Emulation](https://www.qemu.org/docs/master/system/index.html)

### 简介

### [invocation（命令行调用）](https://www.qemu.org/docs/master/system/invocation.html#)

`qemu-system-x86_64 [options] [disk_image]`

这些选项按照功能可分为多种类型，而课程中用到的参数有：

* **Standard options**
  * `-machine`：指定需要模拟的机器。这里指定的貌似是整机芯片组的架构而不仅仅是cpu架构，可以参考[这里](https://xiaobinzhao.github.io/2021/12/14/qemu%20 Machine Type/)


* **Display Options**
  * `-nographic`：禁用图形化，串口设备的输出会被重定向到QEMU monitor，这样是为了方便debug内核。


* **Boot Image or Kernel specific**
  * `-bios`：通过文件名指定BIOS程序。根据多阶段启动的思路（见[这里](http://rcore-os.cn/rCore-Tutorial-Book-v3/appendix-c/index.html)），在OS启动前可以有多个启动阶段，而负责各个阶段的启动程序可以用这个选项来指定


* **Debug/Expert optionS**

  * `-s`：Shorthand for -gdb [tcp::1234](tcp::1234)

  * `-S`：Do not start CPU at startup (you must type ‘c’ in the monitor).


### [Device Emulation（设备模拟）](https://www.QEMU.org/docs/master/system/device-emulation.html)

`--device`：上面的`-machine`只模拟了芯片组（SoCs），但有些时候需要模拟一些与其进行交互的外设，此时就需要需要模拟外设。一些关键的概念有：

* 设备前端：A device front end is how a device is presented to the guest. The type of device presented should match the hardware that the guest operating system is expecting to see.
* 设备总线：QEMU会根据用户指定的设备自动推断所需的总线，但用户也可以自己指定。
* 设备后端：The back end describes how the data from the emulated device will be processed by QEMU
* 设备Pass Through： 模拟设备实际访问宿主机底层硬件的地方

### 一些快捷键

* graphical frontends的快捷键见[这里](https://www.QEMU.org/docs/master/system/keys.html)

* character backend multiplexer的快捷键见[这里](https://www.QEMU.org/docs/master/system/mux-chardev.html)（这里能使用的命令都是用`Ctrl-a`作为前缀转义过的，似乎是为了区别QEMU monitor中可用的命令，常用的有：
  * Ctrl-a x：退出模拟器



### QEMU monitor

**QEMU monitor的作用：可以给QEMU emulator发送复杂的命令，包括：**

* 插拔媒体设备，例如CD和软盘
* 将VM保存到硬盘或者从硬盘恢复VM
* 无需外部的debugger来检查VM的内部状态

> 注意emulator的作用是设备模拟，而monitor的作用则更像是用户的一个shell，用来和emulator进行交互。





### Disk Images

### Generic Loader

通过对模拟设备`loader`进行设置，可以在QEMU启动时：

1. 将数据加载到内存中

   ```bash
   -device loader, addr=<addr>, data=<data>, data-len=<data-len> [,data-be=<data-be>] [,cpu-num=<cpu-num>]
   ```

2. 设置CPU PC寄存器的值

   ```bash
   -device loader,addr=<addr>, cpu-num=<cpu-num>
   ```

3. 将文件加载到内存中

   ```bash
   -device loader,file=<file> [,addr=<addr>] [,cpu-num=<cpu-num>] [,force-raw=<raw>]
   ```



加载一个用于启动的ELF文件的例子如下：

```bash
-device loader,file=./images/boot.elf,cpu-num=0
```





### QEMU System Emulator Targets

**RISC-V**（目前只关注这个target） 

当borad model为 `sifive_u` 或者 `virt`时，可以指定使用不同的risc-v CPU固件来启动

* `-bios default` - This is the default behaviour if no -bios option is included. This option will load the default OpenSBI firmware automatically. The firmware is included with the QEMU release and no user interaction is required. All a user needs to do is specify the kernel they want to boot with the -kernel option 
* `-bios none` - QEMU will not automatically load any firmware. It is up to the user to load all the images they need. 
* `-bios <file>` - Tells QEMU to load the specified file as the firmwar



## User Mode Emulation的例子

在X86的Ubuntu20上编译RISCV64的C语言代码，然后通过user mode emulation运行的过程如下：

首先需要安装相关GCC工具链：

```bash
sudo apt update
sudo apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
```



接着准备C语言源文件`main.c`

```C
#include <stdio.h>

int main() {
    printf("Hello, RISC-V!\n");
    return 0;
}
```



然后使用刚才安装的GCC工具链交叉编译，

```bash
riscv64-linux-gnu-gcc  main.c
```



最后使用QEMU运行

>  这里假设用户已经按照官网的教程编译好QEMU模拟器

```bash
$ qemu-riscv64 a.out 
```



此时可能会有报错：

```
Could not open '/lib/ld-linux-riscv64-lp64d.so.1': No such file or directory
```

这是因为运行 RISC-V 程序需要对应的动态链接器（`ld-linux-riscv64-lp64d.so.1`），而这个动态链接器一般包含在 RISC-V 的 C 库（如 `glibc`）中。若该库未安装或者安装路径配置有误，QEMU 就无法找到动态链接器，进而引发此错误。

有两种解决方案，一是使用静态链接绕开问题：

```bash
riscv64-linux-gnu-gcc -static main.c #直接使用静态链接
$ qemu-riscv64 a.out 
Hello, RISC-V!
```



二是运行时候告诉QEMU动态链接库的位置，具体见下一步（当libc6-riscv64-cross被正确安装后依然报上面的错误时，才用这个方法）。

```bash
$ qemu-riscv64 -L /usr/riscv64-linux-gnu a.out # 运行告知动态链接库的位置 
Hello, RISC-V!
```









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



