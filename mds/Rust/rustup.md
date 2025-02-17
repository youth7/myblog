# Visual Studio、msbuild、Windows SDK之间的关系

* **Visual Studio**：一个IDE，**它包含了MSVC**

* **[MSVC](https://en.wikipedia.org/wiki/Microsoft_Visual_C%2B%2B)**：
  
  * 即**Microsoft Visual C++**，是一个**编译器**，最初是独立的产品，**后来成为Visual Studio的一部分**。
  * 在某些场合有时候又指Windows上的ABI（另外一种是GNU ABI）
  
* [**MSBuild**](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild?view=vs-2022)：

  * 是微软的Build Engine，它是一个能够build各种applications的platform，它就是MSBuild。

  * 一般跟随Visual Studio一起下载安装。也可以独立安装：在[这里](https://visualstudio.microsoft.com/zh-hans/downloads/)最下方的【用于Visual Studio的工具】→【Visual Studio 2022 生成工具】，下载后得到`vs_BuildTools.exe`。

  * > To install MSBuild on a system that doesn't have Visual Studio, go to **Build Tools for Visual Studio 2022** on the [downloads page](https://visualstudio.microsoft.com/downloads/?cid=learn-onpage-download-cta). Another way of getting MSBuild is to install the [.NET SDK](https://learn.microsoft.com/en-us/dotnet/core/sdk#acquiring-the-net-sdk).

  * **它提供了核心的编译工具链，提供`cl.exe`（编译器）、`link.exe`（链接器）**。工具的路径参考这个[答案](https://stackoverflow.com/questions/61554532/where-is-msvc-installed-detecting-location-of-cl-exe-and-link-exe)，例如本机上是：`D:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.36.32532\bin\Hostx64\x64`。官方文档上说了，可以不依赖Visual Studio而独立安装build tool，意味着编译C/C++工程可以不需要Visual Studio，因此它（而不是Visual Studio）才是提供编译工具链的源头。

* **[Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)**：

  *  The Windows SDK provides the latest headers, libraries, metadata, and tools for building Windows applications。Use this SDK to build Universal Windows Platform (UWP) and Win32 applications for Windows 
  * 可以通过`vs_BuildTools.exe`（即`msbuild`）来顺带安装，[又或者独立下载安装](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)

* **[Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)**:

  *  **The Visual C++ Redistributable installs Microsoft C and C++ (MSVC)  runtime libraries**. Many applications built using Microsoft C and C++  tools **require these libraries**. If your app uses those libraries, a  Microsoft Visual C++ Redistributable package must be installed on the  target system before you install your app




# 安装rust时候究竟需要安装哪些

只有`MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)`是必须的，具体见《The rustup book》的[这里](https://rust-lang.github.io/rustup/installation/windows-msvc.html)



# 参考

* https://stackoverflow.com/questions/59018512/difference-between-visual-studio-build-tools-and-windows-sdk

* https://rust-lang.github.io/rustup/installation/windows-msvc.html
* https://rustmagazine.github.io/rust_magazine_2021/chapter_5/faq.html