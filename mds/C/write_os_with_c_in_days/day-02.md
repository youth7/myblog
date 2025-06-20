# 使用C语言实现day1的功能

本章的任务，是在day1的基础上，使用C语言（`kernel.c`）来实现剩余的功能，而汇编语言（`start.s`）仅仅做初始化和加载工作。

## 实现`start.s`和`kernel.c`

`kernel.c`的功能非常简单，就是一个简单的无限循环

```C
void start_kernel(void)
{
	//留一个特殊数值，debug时候回来验证
	int a = 0x709394;
	while (1) {}; 
}
```



`start.s`则需要实现以下功能：

* 初始化栈，以便后续进行函数调用
* 调用`kernel.c`中的`start_kernel`函数，将控制权转移

它的内容如下：

```assembly
.global	_start
# 声明全局符号start_kernel，它定义在kernel.c中
.global start_kernel

_start:
	# 初始化栈，使sp指向栈顶
	la sp, stack_top
	j start_kernel

# 不加这句对齐的话，stack_bottom不会对齐，而stack_top为了对齐，会强行增加栈的大小，最终使得栈不等于1024，要注意
.balign 16
stack_bottom:
	# 开辟一段空间作为栈
    .skip 1024
stack_top:

```



## 编译 + 链接

编辑makefile，分别编译两个文件，并进行链接

```bash
gcc_flag = -nostdlib -fno-builtin -g -Wall -march=rv32g -mabi=ilp32
os_elf = os.elf

compile: start.s kernel.c
	@echo "start to compile..."
	@riscv64-unknown-elf-gcc  ${gcc_flag} -c -o start.o start.s
	@riscv64-unknown-elf-gcc  ${gcc_flag} -c -o kernel.o kernel.c 
	@echo "compile done"

link: compile
	@echo "start to link..."
	@riscv64-unknown-elf-gcc ${gcc_flag} -Ttext=0x80000000 -o ${os_elf} start.o kernel.o
	@echo "link done..."
```

用`readelf -s -S start.o`检查一下`start.o`：

```bash
...
Section Headers:
  [Nr] Name              Type            Addr     Off    Size   ES Flg Lk Inf Al
...
  [ 3] .data             PROGBITS        00000000 000460 000000 00  WA  0   0  1
  [ 4] .bss              NOBITS          00000000 000460 000000 00  WA  0   0  1
 ...
 
 
 
 Symbol table '.symtab' contains 29 entries:
   Num:    Value  Size Type    Bind   Vis      Ndx Name
     5: 00000418     0 NOTYPE  LOCAL  DEFAULT    1 stack_top
... 
     8: 00000018     0 NOTYPE  LOCAL  DEFAULT    1 stack_bottom
```

`.data`和`.bss`都是为0，说明栈并没有被实际分配空间，它需要运行时才会被真正分配空间。



而`stack_bottom`和`stack_top`的差是0x400=1024，符合预期。注意必须在代码里加上`.balign 16`，否则GCC为了对齐可能会往栈中填充数据，使得`stack_top`变大，这会导致栈的真实大小不是我们指定的1024。





## 使用QEMU加载并运行，然后GDB验证

```bash
debug: link
	@echo "start to debug..."
	@qemu-system-riscv32 -nographic -smp 1 -machine virt -bios none -kernel ${os_elf} -s -S & 
	@riscv64-unknown-elf-gdb -q -ex 'target remote localhost:1234' -ex 'b _start' -ex 'b start_kernel' ${os_elf}
	@echo "debug done"
```

* 执行`make debug`：

```bash
 make debug
start to compile...
kernel.c: In function 'start_kernel':
kernel.c:4:13: warning: unused variable 'a' [-Wunused-variable]
    4 |         int a = 0x709394;
      |             ^
compile done
start to link...
link done...
start to debug...
Reading symbols from os.elf...
Remote debugging using localhost:1234
warning: Architecture rejected target-supplied description
0x00001000 in ?? ()
Breakpoint 1 at 0x80000000: file start.s, line 7.
Breakpoint 2 at 0x80000424: file kernel.c, line 4.
```



* 先验证栈指针是否指向栈顶，可见在跳转到`start_kernel`前，`sp`寄存器已经被正确设置，其值等于`stack_top`的值。

```bash
(gdb) c
Continuing.

Breakpoint 1, _start () at start.s:7
7               la sp, stack_top
(gdb) p stack_top
$1 = {<text variable, no debug info>} 0x80000410 <stack_top>
(gdb) p stack_bottom
$2 = {<text variable, no debug info>} 0x80000010 <stack_bottom>
(gdb) si
0x80000004 in _start () at start.s:7
7               la sp, stack_top
(gdb) si
_start () at start.s:8
8               j start_kernel
(gdb) p $sp
$3 = (void *) 0x80000410 <stack_top>
```



* 继续执行，程序会跳转到`start_kernel`，反汇编的话会观察到之前设置的特殊数值0x709394，一切正常符合预期，从这一刻起可以使用C语言来编写后续的逻辑了。

```bash
(gdb) c
Continuing.

Breakpoint 2, start_kernel () at kernel.c:4
4               int a = 0x709394;
(gdb) disas
Dump of assembler code for function start_kernel:
   0x80000418 <+0>:     addi    sp,sp,-32
   0x8000041c <+4>:     sw      s0,28(sp)
   0x80000420 <+8>:     addi    s0,sp,32
=> 0x80000424 <+12>:    lui     a5,0x709
   0x80000428 <+16>:    addi    a5,a5,916 # 0x709394
   0x8000042c <+20>:    sw      a5,-20(s0)
   0x80000430 <+24>:    nop
   0x80000434 <+28>:    j       0x80000430 <start_kernel+24>
End of assembler dump.
```






