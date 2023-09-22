# Visual Studio、msbuild、Windows SDK之间的关系

* Visual Studio：一个IDE
* [msbuild](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild?view=vs-2019)：全称`Build Tools for VS`，是Visual Studio的编译工具，现在可以独立于Visual Studio下载了，在[这里](https://visualstudio.microsoft.com/zh-hans/downloads/)最下方的【用于Visual Studio的工具】→【Visual Studio 2022 生成工具】，下载后得到`vs_BuildTools.exe`
* Windows SDK：
  * *As for Windows SDK, it contains the headers, libraries, metadata, and tools for developing and building Windows 10 apps*
  * *Windows SDK contains headers, libraries and sample code used to develop applications*
  * 可以通过`vs_BuildTools.exe`来顺带安装
* MSVC：
  * 全称是The Microsoft Visual C++ compiler and libraries toolset
  * 在某些场合有时候又指Windows上的其中一种ABI，另外一种是GNU ABI
  * 早期时候MSVC是上述三者的合体，因为当时它们都是捆绑在一起安装的，后来分离之后MSCV这个概念其实已经名存实亡，成为一个历史名词。



# 安装rust时候究竟需要安装哪些

只有`MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)`是必须的，具体见《The rustup book》的[这里](https://rust-lang.github.io/rustup/installation/windows-msvc.html)



# 参考

* https://stackoverflow.com/questions/59018512/difference-between-visual-studio-build-tools-and-windows-sdk

* https://rust-lang.github.io/rustup/installation/windows-msvc.html
* https://rustmagazine.github.io/rust_magazine_2021/chapter_5/faq.html