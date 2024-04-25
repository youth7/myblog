# Visual Studio、msbuild、Windows SDK之间的关系

* **Visual Studio**：一个IDE
* [**msbuild**](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild?view=vs-2019)：全称`Build Tools for VS`，是Visual Studio的编译工具，现在可以独立于Visual Studio下载了，在[这里](https://visualstudio.microsoft.com/zh-hans/downloads/)最下方的【用于Visual Studio的工具】→【Visual Studio 2022 生成工具】，下载后得到`vs_BuildTools.exe`
* **[Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)**：
  *  The Windows SDK provides the latest headers, libraries, metadata, and tools for building Windows applications
  * 可以通过`vs_BuildTools.exe`（即`msbuild`）来顺带安装，[又或者独立下载安装](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
* **[MSVC](https://en.wikipedia.org/wiki/Microsoft_Visual_C%2B%2B)**：
  * 即**Microsoft Visual C++**，最初是独立的产品，后来成为Visual Studio的一部分。
  * 在某些场合有时候又指Windows上的其中一种ABI（另外一种是GNU ABI）
* **[Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)**:
  *  installs Microsoft C and C++ (MSVC) runtime libraries. Many applications built using Microsoft C and C++ tools require these libraries.


# 安装rust时候究竟需要安装哪些

只有`MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)`是必须的，具体见《The rustup book》的[这里](https://rust-lang.github.io/rustup/installation/windows-msvc.html)



# 参考

* https://stackoverflow.com/questions/59018512/difference-between-visual-studio-build-tools-and-windows-sdk

* https://rust-lang.github.io/rustup/installation/windows-msvc.html
* https://rustmagazine.github.io/rust_magazine_2021/chapter_5/faq.html