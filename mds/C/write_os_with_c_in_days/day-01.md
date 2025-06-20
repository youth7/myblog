# 编写第一个汇编程序，使其运行在QEMU模拟的RISCV裸机上

完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day1

## 编写程序

编写一个简单的程序（`loop.s`），它的唯一功能就是不断对`a0`的值加1

```assembly
.global _start
_start:
	addi a0, a0, 1
	j _start

```

* 注意最后必须换行，否则会报一个警告：`Warning: end of file not at end of a line; newline inserted`
* 同时必须定义全局符号`_start`，原因见[这里](../../others/ld/ld.md)

## 编译

编译上述文件，得到`a.out`

```bash
riscv64-unknown-elf-gcc -nostdlib -fno-builtin -march=rv32g -mabi=ilp32 -g -Wall -Ttext=0x80000000 loop.s  -o start.elf 
riscv64-unknown-elf-objcopy -O binary start.elf start.bin
# 顺便生成bin文件，等下会用到
```

关于gcc中和链接相关的选项，以及ld自身的选项，请参考[这里](../../others/ld/ld.md)



### `-nostdlib`

这是一个gcc中和链接相关的选项：

> Do not use the **standard system startup files or libraries** when linking......

启动文件（Startup File）是嵌入式系统开发中的核心组件之一，它用于初始化系统并为主程序的运行做好准备。在大多数情况下，启动文件是用汇编语言编写的，并且与具体的处理器架构和工具链紧密相关。具体参考[这里](https://zhuanlan.zhihu.com/p/12989475903)



### `-fno-builtin`

gcc中和C相关的选项，简单来说即告诉编译器要保持函数的调用方式，不要使用built-in（gcc内部的魔改）版本。

> ```
> -fno-builtin
> -fno-builtin-function
> ```
>
> Don’t recognize built-in functions that do not begin with ‘__builtin_’ as prefix.  See [Builtins for C Library Functions](https://gcc.gnu.org/onlinedocs/gcc/Library-Builtins.html), for details of the functions affected, including those which are not built-in functions when -ansi or -std options for strict ISO C conformance are used because they do not have an ISO standard meaning.
>
> **GCC normally generates special code to handle certain built-in functions more efficiently**; for instance, calls to `alloca` may become single instructions which adjust the stack directly, and calls to `memcpy` may become inline copy loops.  The resulting code is often both smaller and faster, but since the function calls no longer appear as such, **you cannot set a breakpoint on those calls, nor can you change the behavior of the functions by linking with a different library**.  
>
> In addition, **when a function is recognized as a built-in function**, GCC may use information about that function to warn about problems with calls to that function, or to generate more efficient code, even if the resulting code still contains calls to that function.  For example, warnings are given with -Wformat for bad calls to `printf` when `printf` is built in and `strlen` is known not to modify global memory.（即使用了built-in function之后，能够提供更多的警告信息？）
>
> With the -fno-builtin-function option only the built-in function is disabled.  function must not begin with ‘__builtin_’.  If a function is named that is not built-in in this version of GCC, this option is ignored.  There is no corresponding -fbuiltin-function option; if you wish to enable built-in functions selectively when using -fno-builtin or -ffreestanding, you may define macros such as:
>
> ```
> #define abs(n)          __builtin_abs ((n))
> #define strcpy(d, s)    __builtin_strcpy ((d), (s))
> ```
>

具体的解读可参考[这里](https://stackoverflow.com/questions/54281780/what-exactly-is-fno-builtin-doing-here)





### `-Ttext`

> ```
> -Ttext=org
> ```
>
> Same as --section-start, with `.bss`, `.data` or `.text` as the sectionname.
>
> 
>
>  ```
> --section-start=sectionname=org
>  ```
>
>  Locate a section in the output file at the absolute address given by `org`.  You may use this option as many times as necessary to locate multiple sections in the command line. `org` must be a single hexadecimal integer; for compatibility with other linkers, you may omit the leading ‘0x’ usually associated with hexadecimal values.  *Note:* there should be no white space between `sectionname`, the equals sign (“=”), and `org`.
>

`-Ttext=0x80000000`非常重要，如果缺少这个选项，编译器会为`_start`函数生成另外一个地址值：

```bash
# 不加-Ttext=0x80000000参数
readelf -s  a.out  | grep start
    13: 00010074     0 NOTYPE  GLOBAL DEFAULT    1 _start
    15: 0001107c     0 NOTYPE  GLOBAL DEFAULT    1 __bss_start
    
# 加-Ttext=0x80000000参
readelf -s  a.out  | grep start
    13: 80000000     0 NOTYPE  GLOBAL DEFAULT    1 _start
    15: 80001008     0 NOTYPE  GLOBAL DEFAULT    1 __bss_start    
    
```

如果在这个地址上设置断点，则QEMU会报错：`Cannot access memory at address 0x10074`。从QEMU的[源文件](https://github.com/qemu/qemu/blob/master/hw/riscv/virt.c)来看：

```c
static const MemMapEntry virt_memmap[] = {
    [VIRT_DEBUG] =        {        0x0,         0x100 },
    [VIRT_MROM] =         {     0x1000,        0xf000 },
    [VIRT_TEST] =         {   0x100000,        0x1000 },
  ...
};
```

地址0x00010074属于`VIRT_TEST`，这个区域的内存应该是不能被直接访问的



## 使用QEMU加载并运行

```bash
qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel start.elf -s -S
```





## 使用GDB进行调试

```bash
riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234' -ex 'b _start'  -ex 'display/z $$a0'   start.elf
```

* `-q`："Quiet".  Do not print the introductory and copyright messages.
* `-ex`：Execute given GDB command



## 不调试，直接运行二进制文件

```bash
qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel start.elf 
```





## 用Makefile来控制上述过程

```makefile

compile: loop.s
	@echo "start to compile..."
	@riscv64-unknown-elf-gcc -nostdlib -fno-builtin -march=rv32g -mabi=ilp32 -g -Wall -Ttext=0x80000000 loop.s  -o start.elf 
	@riscv64-unknown-elf-objcopy -O binary start.elf start.bin	
	@echo "compile done"


debug: compile
	@echo "start to debug..."
	@qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel start.elf -s -S & 
	@riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234' -ex 'b _start'  -ex 'display/z $$a0'   start.elf
	@echo "debug done"

run: compile
	@echo "start to run..."
	@qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel start.elf 
	@echo "run done"

clean:
	@echo "start to clean..."
	@rm -rf start.*
	@echo "clean done"
```

然后运行

```bash
make clean debug
```

