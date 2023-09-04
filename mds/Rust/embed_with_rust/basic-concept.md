# 嵌入式开发一些基础技术

## 关于debug的输出技术

### JTAG：

原本是用来做芯片测试的，后来发展为debug工具，最古老、通用的协议

* https://cloud.tencent.com/developer/article/1739454

* https://www.zhihu.com/question/36391193/answer/132979357

关于JTAG各种Link（如Ulink、Jlink以及ST-Link）的关系可以看[《JTAG、Ulink、Jlink以及ST-Link的区别》](https://zhuanlan.zhihu.com/p/362465210)，简而言之，各种link是一个仿真器（转换器），它的连接方式如下：

![](/imgs/jtag.jpg)  

各种Link的作用就是将PC通过USB协议发出的调试指令转换为JTAG协议（协议转换器），这样才能使用PC端调试mcu。

另外参考[这里](https://piolabs.com/blog/insights/debugging-embedded.html#debug-probes)：

>Nowadays there are **two prevalent interfaces** used for debugging embedded systems: JTAG and Serial Wire Debug (SWD). The **classic JTAG** was developed in the ’80s by the Joint Test Access Group as ****a standard**** for verifying designs and testing printed circuit boards after manufacture. Today, JTAG is widely adopted by the semiconductor industry and frequently used for programming, testing and debugging embedded systems. The main disadvantage of the JTAG interface is that it requires at least four pins (TRST is optional) for normal functioning. This might be a problem when we are using small package ICs with a limited number of pins. 

>There is**a simplified alternative interface called Serial Wire Debug (SWD)** developed by Arm. It replaces the JTAG interface with two signals - a single bi-directional data line (SWDIO) and clock (SWCLK), providing all the usual debug and test functionality with higher performance compared JTAG. Although a lot of modern microcontrollers support both JTAG and SWD interfaces, SWD is a **proprietary interface** and can be used mostly within the Arm ecosystem.





### SWD：

ARM内部搞出来的另外一个debug协议，用来取代JTAG，之所以没那么通用是因为它被视为是ARM的专属技术。

* [SWD - SEGGER Wiki](https://wiki.segger.com/SWD)



### Semihosting：

一种将target输出重定位到host的思路（并非具体标准），非常古老。

> Semihosting is nothing new. It has been used in Embedded Systems for many decades. **Most companies in the space of development tools have developed their own semihosting, basically all following the same idea of halting the target processor, typically by letting it run into a breakpoint. However, there was not interoperability since there was no standard**, until ARM defined somewhat of a standard for ARM processors. This standard, is available at http://infocenter.arm.com/help/topic/com.arm.doc.dui0471i/CHDJHHDI.html . Unfortunately it does not come with an implementation.

> 使用SemiHosting功能,工程师可以不使用额外的UART口来进行log的打印, 只需要在JTAG通信正常的情况下就可以实现相同的功能. 这个功能在芯片开发早期阶段非常有用,特别是当UART口有其他用途的时候. 该功能对于帮助芯片的快速迭代非常有帮助.

* [OpenOCD上Semihosting功能浅析(基于RISCV) - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/506062424)

* [Semihosting - SEGGER Wiki](https://wiki.segger.com/Semihosting)



### RTT：

SEGGER's Real Time Transfer (RTT) is the proven technology for system monitoring and interactive user I/O in embedded applications. **It  combines the advantages of SWO and semihosting at very high performance**.

> 1. Bi-directional communication with the target application
>
> 2. Very high transfer speed without affecting real time behavior
>
> 3. Uses debug channel for communication
>
> 4. **No additional hardware or pin on target required**
>
> 5. Supported by any J-Link model
>
> 6. Supported by ARM Cortex-A/R/M, RISC-V and Renesas RX
>
> 7. Complete implementation code providing functionality and freedom

* [RTT - SEGGER Wiki](https://wiki.segger.com/RTT)
* [SWO](https://wiki.segger.com/SWO)



## 调试架构图

关于嵌入式debug架构的一般性描述可以看看[《Debugging with PlatformIO: Part 2. Debugging an Embedded Target》](https://piolabs.com/blog/insights/debugging-embedded.html#debug-probes),其结构如下，这篇文章很重要，它标明了几个概念：

* debug interfaces：即jtag和swd
* debug probes：下面再介绍
* debug server：host上连接debugger和debug probes的软件

![](/imgs/debug-setup.jpg)



而具体化之后的方案则可以参考[《OpenOCD介绍》](https://bbs.huaweicloud.com/blogs/122621)，它将GDB、OpenOCD、目标系统之间的关系捋清楚。

![](/imgs/700px-GDB_openOCD_focus_graph.png)  

从上图可以看出，所谓的debug probe就是位于各种Link的内部，等下我们还会提到debug  probe。

另外[probe-rs](https://github.com/probe-rs/probe-rs)官网是这样说的：

> The goal of this library is to provide a toolset to interact with a variety of embedded MCUs and debug probes.
>
> Similar projects like OpenOCD, PyOCD, Segger Toolset, ST Tooling, etc. exist. 

因此probe-rs和OpenOCD是位于同一级别的，[`cargo-embed`](https://github.com/probe-rs/cargo-embed#cargo-embed)之所以有那么多神奇的功能就是因为probe-rs。

![](/imgs/openocd.jpg)   



### 关于debug probe

> We can describe debug probes as **hardware mediators between the host machine and the debug port of the target embedded system. The main task of any debug probe is to convert commands from the debugger into signals understandable to the target device**. Usually, debug probes are connected to the host via USB, but there are also more exotic variations with Ethernet or Wi-Fi connectivity allowing developers to debug devices even remotely from anywhere in the world.
>
> ...
>
> There is a plenty of debug adapters available in the market, starting from open-source and vendor-agnostic probes ([Black Magic Probe](https://docs.platformio.org/en/latest/plus/debug-tools/blackmagic.html)) up to proprietary solutions from both silicon vendors ([Atmel-ICE](https://docs.platformio.org/en/latest/plus/debug-tools/atmel-ice.html), [ST-Link](https://docs.platformio.org/en/latest/plus/debug-tools/stlink.html)) and independent commercial companies ([Segger J-Link](https://docs.platformio.org/en/latest/plus/debug-tools/jlink.html)). Some vendors also offer development kits ([Nordic nRF52-DK](https://docs.platformio.org/en/latest/boards/nordicnrf52/nrf52_dk.html), [NXP i.MX RT1010](https://docs.platformio.org/en/latest/boards/nxpimxrt/mimxrt1010_evk.html)) with an onboard debug probe so developers can start debugging without any additional hardware.

从上面的描述可知，各种link其实就是adapter，这些link既可以独立也可以集成到开发板上。