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
