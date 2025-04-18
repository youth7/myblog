# 用QEMU在RISCV裸机上调试程序

## 编写程序

编写一个简单的程序，它的唯一功能就是不断对`a0`的值加1

```assembly
.global _start
_start:
	addi a0, a0, 1
	j _start

```

* 注意最后必须换行，否则会报一个警告：`Warning: end of file not at end of a line; newline inserted`
* 同时必须定义全局符号`_start`，原因见[这里](../ld/ld.md)

## 编译

编译上述文件，得到`a.out`

```bash
riscv64-unknown-elf-gcc -nostdlib -fno-builtin -march=rv32g -mabi=ilp32 -g -Wall -Ttext=0x80000000 loop.s  
```

* `-nostdlib`：gcc中和链接相关的选项

* `-fno-builtin`：gcc中和链接相关的选项

* `-nostartfiles`：gcc中和链接相关的选项.

* `-Ttext`：gcc中和链接相关的选项。注意`-Ttext=0x80000000`非常重要，如果缺少这个选项，**编译器会为`_start`函数生成另外一个地址值，这个地址在QEMU模拟出来的RISCV裸机上是无效的，导致后续的debug失败。**

* `-march=rv32g`

* `-mabi=ilp32`

* `-g`：生成调试信息

* `-Wall`：显示编译过程中warning

  

> 关于gcc中和链接相关的选项，以及ld自身的选项，请参考[这里](../ld/ld.md)

## 使用QEMU加载并运行

```bash
qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel a.out -s -S
```

* `-kernel`：
* 

## 使用GDB进行调试

```bash
riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234' a.out
```

* `-q`："Quiet".  Do not print the introductory and copyright messages.
* `-ex`：Execute given GDB comman





## 将上述过程用Makefile来控制





# 用QEMU在RISCV裸机上运行程序

## 编写程序

## 编译

## 使用QEMU加载并运行
