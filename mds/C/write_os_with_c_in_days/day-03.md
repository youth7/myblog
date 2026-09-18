# 使用UART打印出`hello wordld`

完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day3



> 关于UART的一些基础知识，可以看[这里](./UART.MD)

要打印出hello word必须先初始化UART设备，需要注意QEMU模拟**一对**UART设备，即发送端和接收端都是模拟出来的，千万不要误以为是QEMU上模拟的UART和真机上的UART硬件通讯（虽然这理论上可以实现）。



在真机环境下，初始化UART需要做以下工作

* 屏蔽中断

* 设置波特率（在真实的硬件环境中这一步非常重要，然而在QEMU中这只是一个形式）
* 设置字长
* 设置停止位长度
* 设置奇偶校验
* 设置break control





其实这一小节的核心内容比较鸡肋，因为值得注意的各种地方都是关于UART的一些小技术细节，如果你想把每一张代码都理解透彻，需要花大量时间去阅读UART的技术手册，但这东西在整个操作系统中其实并不是十分重要。

## `uart.c`

本小节新增的文件，主要负责以下内容：

1. 定义好UART的基地址和各个寄存器的偏移量
2. 定义用于读写寄存器的宏
3. 将相关函数暴露出去，使得`kernel.c`可以调用

### QEMU中的各种地址范围

UART的基地址是平台相关的，QEMU中[这里](https://github.com/qemu/qemu/blob/master/hw/riscv/virt.c)的代码指定了基地址。

```C
static const MemMapEntry virt_memmap[] = {
    [VIRT_DEBUG] =        {        0x0,         0x100 },
    [VIRT_MROM] =         {     0x1000,        0xf000 },
    [VIRT_TEST] =         {   0x100000,        0x1000 },
    [VIRT_RTC] =          {   0x101000,        0x1000 },
    [VIRT_CLINT] =        {  0x2000000,       0x10000 },
    [VIRT_ACLINT_SSWI] =  {  0x2F00000,        0x4000 },
    [VIRT_PCIE_PIO] =     {  0x3000000,       0x10000 },
    [VIRT_IOMMU_SYS] =    {  0x3010000,        0x1000 },
    [VIRT_PLATFORM_BUS] = {  0x4000000,     0x2000000 },
    [VIRT_PLIC] =         {  0xc000000, VIRT_PLIC_SIZE(VIRT_CPUS_MAX * 2) },
    [VIRT_APLIC_M] =      {  0xc000000, APLIC_SIZE(VIRT_CPUS_MAX) },
    [VIRT_APLIC_S] =      {  0xd000000, APLIC_SIZE(VIRT_CPUS_MAX) },
    [VIRT_UART0] =        { 0x10000000,         0x100 },
    [VIRT_VIRTIO] =       { 0x10001000,        0x1000 },
    /* UART1 supports page isolation from UART0 */
    [VIRT_UART1] =        { 0x1000a000,         0x100 },
    [VIRT_FW_CFG] =       { 0x10100000,          0x18 },
    [VIRT_FLASH] =        { 0x20000000,     0x4000000 },
    [VIRT_IMSIC_M] =      { 0x24000000, VIRT_IMSIC_MAX_SIZE },
    [VIRT_IMSIC_S] =      { 0x28000000, VIRT_IMSIC_MAX_SIZE },
    [VIRT_PCIE_ECAM] =    { 0x30000000,    0x10000000 },
    [VIRT_PCIE_MMIO] =    { 0x40000000,    0x40000000 },
    [VIRT_DRAM] =         { 0x80000000,           0x0 },
};
```

其中重要的地址有：

| 类型       | 地址范围                  | 作用       |
| ---------- | ------------------------- | ---------- |
| VIRT_MROM  | 0x1000,        0xf000     | mask rom   |
| VIRT_UART0 | 0x10000000,         0x100 | UART基地址 |
| VIRT_DRAM  | 0x80000000,           0x0 | 内存       |

> 内存的size为0，是因为内存的大小是启动QEMU时从命令行传入的，这里的0仅仅是一个占位符

因此我们在宏中定义UART的基地址就是`0x10000000`。



### 直接对内存地址进行写入

C语言中，可以直接对某个内存地址进行读写，地址值可以不需要通过变量来引用，例如：

```C
*((int *) 0x00001234) = 666;
// (int *) 0x00001234是为了说明这个地址存的事一个int
// *(...)=666，是往上面的地址写入一个值为666的整型
int c = *((int *) 0x00001234)
```



## `printf.c`

`uart.c`只是实现了简单的输出，为了方便后续调试中使用类似标准库中的`printf`功能，我们需要手动实现这个函数。它的原理比较简单，具体实现参考[这里](https://github.com/cccriscv/mini-riscv-os/blob/master/05-Preemptive/lib.c)。



修改makefile文件，将`printf.c`的相关内容加入编译和链接，并在`kernel.c`中调用

```c
// 声明uart.c中定义的各种函数，他们后续会被链接进来
extern void uart_init(void);
extern void uart_puts(char *c);
extern int printf(const char* s, ...);

void start_kernel(void)
{
	//留一个特殊数值，debug时候回来验证
	int a = 0x709394;
	//初始化uart，qemu中如果不初始化其实也能正常运行，但是在真机环境中必须初始化
	uart_init();
	//输出内容
	printf("hello printf active %x\n", 0xabcdef);
	uart_puts("hello riscv!!!!!!!!!!!!!!!\n");
	while (1) {}; 
}
```



然后运行命令`make run`，输出符合预期：

```bash
make run
start to compile...
kernel.c: In function 'start_kernel':
kernel.c:9:13: warning: unused variable 'a' [-Wunused-variable]
    9 |         int a = 0x709394;
      |             ^
uart.c: In function 'uart_puts':
uart.c:70:9: warning: unused variable 'i' [-Wunused-variable]
   70 |     int i = 0x123456;
      |         ^
compile done
start to link...
/home/dmai/workspace/x-gcc/riscv64-unknown-elf.gcc-12.1.0/bin/../lib/gcc/riscv64-unknown-elf/12.1.0/../../../../riscv64-unknown-elf/bin/ld: warning: os.elf has a LOAD segment with RWX permissions
link done...
start to run...
hello printf active 00abcdef
hello riscv!!!!!!!!!!!!!!!
```

