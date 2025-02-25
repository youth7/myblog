# RISCV嵌入式GCC工具链的安装

> xPacks这个项目很好，提供了多种工具（例如GCC、QEMU）对各种目标平台（例如X86、ARM、RISCV）的二进制产物

* 通过xPacks安装：
  * 官网：https://xpack-dev-tools.github.io/
  * github：https://github.com/xpack-dev-tools/

* 手动下载安装（去到对应project的releases页面）：
  * https://github.com/xpack-dev-tools/riscv-none-elf-gcc-xpack/releases



# RISCV Linux GCC工具链安装

如果仅仅是想在当前平台（X86+Linux）进行交叉编译，则可以直接安装

```bash
sudo apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
```

