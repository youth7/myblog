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

编译上述文件，得到`start.elf`

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

> `-fno-builtin` means that gcc **will not try to replace library functions with builtin compiled code**, and you'll not get any weirdness  due to such replacements. 
>
> I've been bitten by replacements of `printf("%s", mystr)` by `puts(mystr)`, for example - even when I wasn't including `stdio.h` at all!

具体的解读可参考[这里](https://stackoverflow.com/questions/54281780/what-exactly-is-fno-builtin-doing-here)





### `-Ttext`

> ```
> -Tbss=org
> -Tdata=org
> -Ttext=org
> ```
>
> Same as --section-start, with `.bss`, `.data` or `.text` as the sectionname.
>
> 
>
> ```
> --section-start=sectionname=org
> ```
>
> Locate a section in the output file at the absolute address given by `org`.  You may use this option as many times as necessary to locate multiple sections in the command line. `org` must be a single hexadecimal integer; for compatibility with other linkers, you may omit the leading ‘0x’ usually associated with hexadecimal values.  *Note:* there should be no white space between `sectionname`, the equals sign (“=”), and `org`.

即`ld`中有以下三种选项，他们的命名方式遵循-Txxxx这样的格式，例如：

* `-Ttext=org`，等价于`--section-start .text=org`

* `-Tdata=org`，等价于`--section-start .data=org`

* `-Tbss= org`，等价于`--section-start .bss=org`



`-Ttext=0x80000000`非常重要，如果缺少这个选项，编译器会为`.text`节生成另外一个地址00010074

```bash
# 不加-Ttext=0x80000000参数

Section Headers:
  [Nr] Name              Type            Addr     Off    Size   ES Flg Lk Inf Al
  [ 0]                   NULL            00000000 000000 000000 00      0   0  0
  [ 1] .text             PROGBITS        00010074 000074 000008 00  AX  0   0  4
  ......

    
# 加-Ttext=0x80000000参数
Section Headers:
  [Nr] Name              Type            Addr     Off    Size   ES Flg Lk Inf Al
  [ 0]                   NULL            00000000 000000 000000 00      0   0  0
  [ 1] .text             PROGBITS        80000000 001000 000008 00  AX  0   0  4
  ......
```

从QEMU的[源文件](https://github.com/qemu/qemu/blob/master/hw/riscv/virt.c)来看：

```c
static const MemMapEntry virt_memmap[] = {
    [VIRT_DEBUG] =        {        0x0,         0x100 },
    [VIRT_MROM] =         {     0x1000,        0xf000 },
    [VIRT_TEST] =         {   0x100000,        0x1000 },
  ...
};
```

地址`0x00010074`属于`VIRT_TEST`，这个区域的内存应该是不能被直接访问的。



其实**无论是否添加`-Ttext=0x80000000`选项，QEMU都会把start.elf的`.text`加载到地址`0x80000000中`**（可以编译不同版本的start.elf，然后在`0x80000000`打断点来确认）。唯一不同的是，如果不加`-Ttext=0x80000000`，则`_start`的地址会变成`0x00010074`，此时会触发两个错误：

1. 该地址在QEMU中是不可访问的。
2. 想要实现无限循环，`_start`必须等于入口地址`0x80000000`，而`0x00010074`明显不符合。

```bash
Breakpoint 2, 0x80000000 in ?? ()
(gdb) l
1       .global _start
2       _start:
3               addi a0, a0, 1
4               j _start
5
(gdb) p _start
Cannot access memory at address 0x10074
(gdb) p &_start
$3 = (<text variable, no debug info> *) 0x10074 <_start>
```

> 注意gdb的`p`命令是打印变量的值，如果需要打印变量的地址需要使用`&_start`





其实这里需要注意两个问题，不要混淆它们：

1. 编译时的内存布局：即编译时，compiler以程序运行时的内存布局来确定各个符号的值。
2. 运行阶段的内存布局：必须把ELF文件加载到适合的位置，**满足编译时对地址的期望，使得编译时和运行时的地址视图是一致的（重要：⚠️⚠️⚠️⚠️）**。

即：

> **QEMU：** 我把你的程序放到 **`0x80000000`**，并且从这里开始执行。
>
> **GCC：** 那我编译链接时，**所有地址都必须按 `0x80000000` 来计算**。
>
> **结果：** 跳转正确、符号正确、程序能跑。

如果能够实现全程相对跳转，那么理论上可以不需要`-Ttext=0x80000000`，但在实际开发过程中这几乎不可能。



### 真实硬件的启动流程参考

在[SiFive FE310 芯片数据手册](https://cdn.sparkfun.com/assets/b/f/a/1/2/FE310-G000.pdf)（RISC-V 32 位参考硬件）**第 4.3 节 Memory Map**中，地址段`0x80000000`~`0x80003FFF`的描述是DTIM（Data Tightly Integrated Memory）。而它的启动流程是这样的：

> 6.2 Reset and Trap Vectors
>
> * FE310-G000 fetches the first instruction out of reset from **0x1000**. （这个地址和QEMU是一致的，因为是Mask Rom的代码，地址为0x1000，见下面GDB调试的例子）
> * The instruction stored there jumps straight to OTP at **0x2_0000**, and will either ：
>   * enter a trap loop if the OTP is not programmed,
>   * or start running the OTP code

即对于RISCV的标准启动流程：硬件只实现了Mask ROM阶段（地址是0x1000），SPL→U-Boot阶段（地址0x80000000）不靠硬件实现，所以在技术手册中没被提及。





## 使用QEMU加载并运行

```bash
qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel start.elf -s -S
```









## QEMU启动阶段



![](../../../imgs/qemu-riscv-address.jpg)





[请看这里](./boot-compare.md)，可知`0x1000`就是ROM地址，而`0x8000000`则是DRAM地址，这和RISCV通用启动流程是一致的。



下面我们来验证这点，在运行上一节的命令之后，QEMU停下来并等待连接调试。我们连接上GDB server，然后观察地址（**Mask Rom的代码，地址为0x1000**）和相关代码：

```bash
riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234'  -ex 'disassemble 0x1000, +30'  start.elf
```

> * `-q`："Quiet".  Do not print the introductory and copyright messages.
> * `-ex`：Execute given GDB command

会有如下输出：

```bash
Reading symbols from start.elf...
Remote debugging using localhost:1234
warning: Architecture rejected target-supplied description
0x00001000 in ?? ()
Dump of assembler code from 0x1000 to 0x101e:
=> 0x00001000:  auipc   t0,0x0
   0x00001004:  addi    a2,t0,40 # 0x1028
   0x00001008:  csrr    a0,mhartid
   0x0000100c:  lw      a1,32(t0)
   0x00001010:  lw      t0,24(t0)
   0x00001014:  jr      t0
   0x00001018:  unimp
   0x0000101a:  0x8000
   0x0000101c:  unimp
End of assembler dump.
```

这就是第一阶段的启动代码，可以看到最后通过指令`jr t0`进行跳转。对这条指令进行断点，然后看一下寄存器`t0`的值：

```bash
(gdb) b *0x00001014
Breakpoint 1 at 0x1014
(gdb) c
Continuing.

Breakpoint 1, 0x00001014 in ?? ()
(gdb) p /x $t0
$1 = 0x80000000
```

**可以看到第一阶段结束之后，BIOS会将控制权交给位于`0x80000000`的代码，而我们的内核代码必须精确地加载到这个地址**





## 使用GDB进行调试

```bash
riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234' -ex 'b _start'  -ex 'display/z $$a0'   start.elf
```





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

