# 《Discovery》学习笔记

# 说明

本文是Win10下的[《Discovery》](https://docs.rust-embedded.org/discovery/microbit/index.html)学习笔记，按照自己的理解重写了全部代码（其实基本照抄，只修改了一些细节和增加注释），并做了以下调整：

  * Rust Edition：原书采用2018，本文采用2021
  * 只使用micro:bit v2进行实验，因此精简了部分源码，删除了micro:bit v1的相关内容
  * 所有命令都是在powershell下运行的

在阅读《Discovery》之前建议先阅读并理解[《The embedonomicon》](https://docs.rust-embedded.org/embedonomicon/preface.html)，我是先看了后者并完成[相关笔记](./embedonomicon.md)之后再回来学习《Discovery》，发现很多《Discovery》中未提及的细节的原理在《The embedonomicon》中都有详细的解释。我也会将这些细节列出来，通过关联二者我们能够更好理解相关内容。



全部代码请见[这里]()





# 【0~4】前提准备

## 相关工具

**硬件：**

* [micro:bit v2](https://microbit.org/get-started/user-guide/overview/)
* USB数据线，用来连接micro:bit v2和PC

以上硬件各大电商平台都有售



**软件：**

下载并安装以下工具

| 名称              | 版本      | 地址/备注                                                    |
| ----------------- | --------- | ------------------------------------------------------------ |
| Rust              | 1.64.0    | 一定要升级到高版本，低版本的rust会导致安装`cargo embed`失败，见这个[issue](https://github.com/probe-rs/cargo-embed/issues/378)。安装完rust后还需要用命令`rustup target add thumbv7em-none-eabihf`来增加目标编译平台，因为我们需要再win上交叉编译到arm。 |
| cargo-binutils    | 0.3.6     | https://github.com/rust-embedded/cargo-binutils              |
| cargo- embed      | 0.13.0    | https://github.com/probe-rs/cargo-embed                      |
| putty             | 0.77      | https://the.earth.li/~sgtatham/putty/latest/w64/putty-64bit-0.77-installer.msi) |
| arm-none-eabi-gdb | 11.3.Rel1 | [https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/11.3.rel1/binrel/arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi.exe](https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/11.3.rel1/binrel/arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi.exe)。 |

安装完毕后使用以下命令`rustc -V;cargo size -V;cargo-embed -V`检验：

```powershell
rustc 1.64.0 (a55dd71d5 2022-09-19)
cargo-size 0.3.6
cargo-embed #这里缺失了版本号信息，这是因为bug(https://github.com/probe-rs/cargo-embed/issues/389)导致的，可以不用管
```

**文档：**

* [《Cortex -M4 Devices Generic User Guide》](https://developer.arm.com/documentation/dui0553/b/?lang=en)：microbit:v2使用了这个幸型号的CPU，虽然原文没有直接使用它，但本文解释代码的时候会用到。



## 术语理解

在嵌入式里面有不同的抽象层次，例如：

* PAC（Peripheral Access Crate）：对芯片上外设接口的直接抽象，这是相当低的一个抽象层，能够控制，只有当有高层抽象无法满足时候需求时候才会使用。使用PAC需要了解硬件的特性（如果不是专门做嵌入式的，看那一套API是根本不知道代表什么外设，因此PAC其实是不怎么易用）

* HAL（The Hardware Abstraction Layer）：因为PAC实在太底层了，直接用它并不方便，于是在其之上构建了HAL以便抽象芯片上的所有外设，通常会将芯片上的所有外设抽象为一个能收发数据的struct。
* BSP（The  Board Support Package）：对整块board（例如micro:bit v2）的抽象，构建于HAL之上。



如果依然不太明白上述概念，直接去看一下相关API就马上能感受到了，书中用到的相关库如下（仅针对micro:bit v2）：

| 抽象层         | 库                                    |
| -------------- | ------------------------------------- |
| 第1层抽象：PAC | https://crates.io/crates/nrf52833-pac |
| 第2层抽象：HAL | https://crates.io/crates/nrf52833-hal |
| 第3层抽象：BSP | https://crates.io/crates/microbit     |



每一款硬件都抽象一个HAL是可行的，但这样程序就很难移植，设计一个尽可能通用的HAL对绝大多数硬件进行抽象是有必要的。在rust嵌入式开发中，[`embedded-hal`](https://crates.io/crates/embedded-hal)就是对第2层的通用抽象。这就是文中说的统一图层（Unifying the layers），简单来说就是面向接口开发，使得代码可以移植和复用。



# LED轮盘

本章节主要是在micro:bit v2上实现一个类似LED跑马灯的效果，此过程涉及到构建、烧录、debug、迭代代码等步骤，非常直观地让读者感受到嵌入式开发的基本流程和要素。

## 代码分析

>  本章节代码的所有细节在《The embedonomicon》中都仔细描述过，强烈建议先去看!

回忆《The embedonomicon》中用Rust对ARM进行裸机编程的过程，可以分为以下几步

1. 编写相关的功能代码，代码至少必须包含vector_table，其中vector_table中的前两项（`ISP`和`Reset`）
2. 通过链接脚本调整目标文件的内存布局，这步的目的是：
   1. 遵循硬件的内存规范
   2. 为用户程序运行中特定的需求做准备

2. 将启动函数加载（烧录）到硬件指定的内存位置
3. 启动硬件，硬件将运行vector_table中的`Reset`指向的函数

《Discovery》并不是从零开始进行嵌入式开发，它将步骤2中一系列繁琐的工作用库实现了，使得整个开发过程非常简洁，但是大量的细节被屏蔽了，下面我们来重复一下整个过程。



先用命令`cargo new --bin led-roulette`创建一个bin类型的package，然后修改`src/main.rs`：

```rust
#![deny(unsafe_code)]
#![no_main]
#![no_std]

use cortex_m_rt::entry;//这个和《The embedonomicon》中的entry宏原理是一样的，原理是库函数才是真正的入口，然后库函数再来加载用户函数
use panic_halt as _;
use microbit as _;

#[entry]
fn main() -> ! {//发散函数，《The embedonomicon》也说过
    let _y;
    let x = 42;
    _y = x;
    // infinite loop; just so we don't leave this stack frame
    loop {}
}
```

然后修改`.cargo/config.toml`

```toml
[target.'cfg(all(target_arch = "arm", target_os = "none"))']
rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

这里指定编译时使用库[cortex-m-rt](https://docs.rs/cortex-m-rt/latest/cortex_m_rt/)提供的链接脚本`link.x`，以及项目的编译的target等。（编译完成后你会发现工程目录`.\target\thumbv7em-none-eabihf\debug\build\cortex-m-rt-<xxxx>\out`下能找到`link.x`，这个链接脚本做的第一件事情就是引入下面提到的`memory.x`文件）

和《The embedonomicon》不一样的是，这里需要用`build.rs`将`memory.x`复制到一个构建脚本能够搜索得到的位置，这是库`cortex-m-rt`的要求，个人猜测这是为了通用性将可变的部分拆分出来由应用本身提供。

接着是修改`Cargo.toml`加入相关依赖

```toml
[package]
name = "led-roulette"
version = "0.1.0"
authors = ["Henrik Böving <hargonix@gmail.com>"]
edition = "2021"


[dependencies]
cortex-m = "0.7.3"
cortex-m-rt = "0.7.0"
panic-halt = "0.2.0"
microbit-v2 = "0.12.0"
```

最后是`Embed.toml`，它是`cargo embed`的配置文件，各项的意义参考[这里](https://github.com/probe-rs/cargo-embed/blob/master/src/config/default.toml)

```toml
[default.general]
chip = "nrf52833_xxAA" #芯片信息

[default.reset]
halt_afterwards = true #重置后挂起程序，这样就不会进入无线循环

[default.rtt] #禁用rtt
enabled = false

[default.gdb] #开启gdb debug
enabled = true

```



## 构建

完成上述一系列准备后用下面的命令构建

```powershell
rustup target add thumbv7em-none-eabihf    #添加相关target
cargo build --target thumbv7em-none-eabihf #编译
```

编译通过后检查一下结果

```powershell
 rust-readobj .\target\thumbv7em-none-eabihf\debug\led-roulette --file-headers --elf-output-style=GNU
```

输出如下：

```powershell
ELF Header:
  Magic:   7f 45 4c 46 01 01 01 00 00 00 00 00 00 00 00 00        
  Class:                             ELF32
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              EXEC (Executable file)       
  Machine:                           ARM
  Version:                           0x1
  Entry point address:               0x401
  Start of program headers:          52 (bytes into file)
  Start of section headers:          880180 (bytes into file)
  Flags:                             0x5000400
  Size of this header:               52 (bytes)
  Size of program headers:           32 (bytes)
  Number of program headers:         4
  Size of section headers:           40 (bytes)
  Number of section headers:         24
  Section header string table index: 22
```

可见确实生成了ARM平台的可执行文件



## 将程序烧录到芯片

刷之前先用USB数据线将micro:bit v2和PC连接，然后执行以下命令将上一步生成的ELF文件烧录到硬件

```
cargo embed --target thumbv7em-none-eabihf
```

> `cargo embed`会将ELF文件按照硬件的规范刷到指定的位置，它支持 nRF5x、STM32 、 LPC800等芯片，在《The embedonomicon》中因为使用QEMU模拟器的原因，这一步通过命令行参数直接完成了。

顺利的话会有以下输出：

```powershell
    Finished dev [unoptimized + debuginfo] target(s) in 0.04s
      Config default
      ...
     Erasing sectors ✔ [00:00:00] [#############################################################################################################################################################################################################################################]  4.00KiB/ 4.00KiB @ 25.10KiB/s (eta 0s )
 Programming pages   ✔ [00:00:00] [#############################################################################################################################################################################################################################################]  4.00KiB/ 4.00KiB @ 12.83KiB/s (eta 0s )
    Finished flashing in 0.399s
    GDB stub listening at 127.0.0.1:1337
```

`cargo embed`完成了以下事情：

* 擦除芯片上的旧数据，写入新数据（我们的代码）
* 让芯片在reset之后挂起，不要立即执行`main`进入无限循环
* 在PC上开启一个GDB代理，为下一步的debug做准备

步骤2、3在`Embed.toml`上有所体现。  此时被烧录进去的ELF文件是硬件上唯一运行的程序，不依赖操作系统直接控制硬件。



## debug

在上一步的基础上，打开一个新窗口并执行命令：`arm-none-eabi-gdb.exe  target/thumbv7em-none-eabihf/debug/led-roulette`

```powershell
arm-none-eabi-gdb.exe  target/thumbv7em-none-eabihf/debug/led-roulette
GNU gdb (Arm GNU Toolchain 11.3.Rel1) 12.1.90.20220802-git
...
Reading symbols from target/thumbv7em-none-eabihf/debug/led-roulette...
(gdb) 
```

然后连上GDB代理

```powershell
(gdb) target remote :1337
Remote debugging using :1337	# 连上gdb代理
0x00000100 in nrf52833_pac::{impl#280}::fmt (self=0x1c3e9442, f=0x797af19f) at src/lib.rs:163
163     #[derive(Copy, Clone, Debug, PartialEq, Eq)]
(gdb)
```

设置断点并检查相关变量的值

```powershell
(gdb) break main	# 在main函数上打一个断点
Breakpoint 1 at 0x164: file src/main.rs, line 9.
Note: automatically using hardware breakpoints for read-only addresses.
(gdb) c				# 继续运行直到断点
Continuing.

Breakpoint 1, led_roulette::__cortex_m_rt_main_trampoline () at src/main.rs:9
9       #[entry]
(gdb) break 13		# 在main.rs的13行打一个断点
Breakpoint 2 at 0x170: file src/main.rs, line 13.
(gdb) c				# 继续运行直到断点
Continuing.

Program received signal SIGINT, Interrupt.
led_roulette::__cortex_m_rt_main () at src/main.rs:10
10      fn main() -> ! {//€The embedonomicon€
(gdb) c				# 继续运行直到断点，不知道为何出了中断后c命令没有直接运行到断点处
Continuing.

Breakpoint 2, led_roulette::__cortex_m_rt_main () at src/main.rs:13
13          _y = x;
(gdb) print x		# 打印main函数中_y变量的值
$2 = 42
(gdb)
```



## 用代码点亮芯片

