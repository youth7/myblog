# 《Discovery》学习笔记

# 说明

本文是Win10下的[《Discovery》](https://docs.rust-embedded.org/discovery/microbit/index.html)学习笔记，按照自己的理解重写了全部代码（其实基本照抄，只修改了一些细节），并做了以下调整：

  * Rust Edition：原书采用2018，本文采用2021
  * 只使用micro:bit v2进行实验
  * 所有命令都是在powershell下运行的

在阅读《Discovery》之前建议先阅读并理解[《The embedonomicon》](https://docs.rust-embedded.org/embedonomicon/preface.html)，我是先看了后者并完成相关笔记之后再回来学习前者，发现很多《Discovery》中未提及的细节的原理在《The embedonomicon》中都有详细的解释。我也会将这些细节列出来，通过关联二者我们能够更好理解相关内容。



完整代码请见[这里]()





# 前提准备

## 相关工具安装

下载并安装以下工具

* [arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi](https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/11.3.rel1/binrel/arm-gnu-toolchain-11.3.rel1-mingw-w64-i686-arm-none-eabi.exe)
* [putty v0.77](https://the.earth.li/~sgtatham/putty/latest/w64/putty-64bit-0.77-installer.msi)

## 术语理解

