# 第一条内核指令

这章最难的地方就是编写一个从裸机上启动的程序，一定要先参考[这里](../embed_with_rust/embedonomicon.md)的前几章，否则卡点太多晕头转向。裸机运行程序的流程是：

1. 编译程序得到一个二进制文件
2. 将这个二进制文件load到裸机的某个地址
3. 启动裸机，它会执行指定位置的代码

下面仔细展开每个步骤中的细节。

> 注：教程中已经有的细节这里不再重复，例如汇编代码、core Rust和链接脚本

## 编译程序得到一个二进制文件

为了简单，我们的OS内核只由一条RISCV指令构成。这非常简单，可以用汇编直接完成

```assembly
.section .text.entry
.globl _start	#定义全局符号_start，使其对外可见，它是一个地址，稍后会被链接脚本引用
 _start:
     li x1, 100
```

如果对应的编译器编译这段代码，则这一步算是完成了。但我们的目标是用Rust来写OS，因此我们需要先编一个Rust程序来包含这段代码，这意味着你必须了解Rust是如何内联汇编的。

```rust
#![no_main]
#![no_std]
use core::panic::PanicInfo;
use core::arch::global_asm;

#[panic_handler]
fn panic(_panic: &PanicInfo<'_>) -> ! {
    loop {}
}

global_asm!(include_str!("entry.asm"));
```

此时用命令：

```bash
cargo build --release --target riscv64gc-unknown-none-elf
```

来编译，则这一步应该OK了。然而事情并没有那么简单，因为内核代码**并不是地址无关**的（为何不编译为PIE暂时不清楚，不过二进制是否PIE和下一步的load二进制到特定地址是两个独立的问题，不要混淆），这意味着它通过绝对地址来进行变量访问和函数调用，因此我们需要指定一个基地址，这就需要用到链接脚本，这意味着你必须：

1. 了解链接、链接脚本、链接程序`ld`的知识
2. 了解Rust如何调用链接脚本，涉及cargo和rustc的用法

链接脚本的内容如下：

```assembly
OUTPUT_ARCH(riscv)
ENTRY(_start)/*引用了上面汇编代码中定义的全局符号_start*/
BASE_ADDRESS = 0x80200000;/*符号定义，这个符号在后面二进制文件中可以找到*/

SECTIONS
{
    . = BASE_ADDRESS;
    skernel = .;

    stext = .;
    .text : {
        *(.text.entry)
        *(.text .text.*)
    }

    . = ALIGN(4K);
    etext = .;
    srodata = .;
    .rodata : {
        *(.rodata .rodata.*)
        *(.srodata .srodata.*)
    }

    . = ALIGN(4K);
    erodata = .;
    sdata = .;
    .data : {
        *(.data .data.*)
        *(.sdata .sdata.*)
    }

    . = ALIGN(4K);
    edata = .;
    .bss : {
        *(.bss.stack)/*注意这是栈空间，为何栈空间需要写入ELF呢？*/
        sbss = .;	/*sbss和ebss之间的内容需要初始化为0,但是.bss.stack不需要初始化，因此.bss.stack不在sbss和ebss之间*/
        *(.bss .bss.*)
        *(.sbss .sbss.*)
    }

    . = ALIGN(4K);
    ebss = .;
    ekernel = .;

    /DISCARD/ : {
        *(.eh_frame)
    }
}
```

然后通过配置cargo，使得在编译时候使用自定义的链接脚本，通过查阅[cargo book](https://doc.rust-lang.org/cargo/reference/config.html?highlight=rustflags#configuration-format)得知需在`.cargo/config`中添加以下内容

```toml
[target.riscv64gc-unknown-none-elf]
rustflags = [
     "-Clink-arg=-Tsrc/linker.ld", "-Cforce-frame-pointers=yes"
]
```

> 关于配置项的意义请看[这里](../embed_with_rust/embedonomicon.md)中的【*检查可执行文件*】那一节。



再用上面的命令编译，然后检查一下编译的结果

```bash
readelf -s -S target/riscv64gc-unknown-none-elf/release/os
There are 8 section headers, starting at offset 0x1298:

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .text             PROGBITS         0000000080200000  00001000
       0000000000000004  0000000000000000  AX       0     0     1
  [ 2] .bss              NOBITS           0000000080201000  00001004
       0000000000000000  0000000000000000  WA       0     0     1
  [ 3] .comment          PROGBITS         0000000000000000  00001004
       0000000000000048  0000000000000001  MS       0     0     1
  [ 4] .riscv.attributes RISCV_ATTRIBUTE  0000000000000000  0000104c
       000000000000003e  0000000000000000           0     0     1
  [ 5] .symtab           SYMTAB           0000000000000000  00001090
       0000000000000150  0000000000000018           7     2     8
  [ 6] .shstrtab         STRTAB           0000000000000000  000011e0
       0000000000000041  0000000000000000           0     0     1
  [ 7] .strtab           STRTAB           0000000000000000  00001221
       0000000000000071  0000000000000000           0     0     1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings), I (info),
  L (link order), O (extra OS processing required), G (group), T (TLS),
  C (compressed), x (unknown), o (OS specific), E (exclude),
  p (processor specific)

Symbol table '.symtab' contains 14 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND 
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS os.7749330116c3775e-cgu.0
     2: 0000000080200000     0 NOTYPE  GLOBAL DEFAULT    1 _start
     3: 0000000080200000     0 NOTYPE  GLOBAL DEFAULT  ABS BASE_ADDRESS
     4: 0000000080200000     0 NOTYPE  GLOBAL DEFAULT    1 skernel
     5: 0000000080200000     0 NOTYPE  GLOBAL DEFAULT    1 stext
     6: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    1 etext
     7: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    1 srodata
     8: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    1 erodata
     9: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    1 sdata
    10: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    1 edata
    11: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    2 sbss
    12: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    2 ebss
    13: 0000000080201000     0 NOTYPE  GLOBAL DEFAULT    2 ekernel
```

文件布局跟链接脚本里指定的一致，这一步算是完成了。



## 将这个二进制文件load到裸机的某个地址

这个流程包含两步：

1. 将上一个流程生成的ELF裁剪为bin文件，ELF和bin的区别看[这里](https://stackoverflow.com/questions/2427011/what-is-the-difference-between-elf-files-and-bin-files)

   使用以下命令进行裁剪

   ```bash
   rust-objcopy --strip-all target/riscv64gc-unknown-none-elf/release/os -O binary target/riscv64gc-unknown-none-elf/release/os.bin
   ```

2. 加载bin文件到指定位置

   对于我们这个环境，其启动流程如下

   | 步骤 | 代码入口   | 运行的程序       | 说明                                                         |
   | ---- | ---------- | ---------------- | ------------------------------------------------------------ |
   | 1    | 0x1000     | QEMU固件中的程序 | QEMU CPU 的程序计数器（PC, Program Counter）会被初始化为 `0x1000` |
   | 2    | 0x80000000 | RustSBI          | 入口地址是QEMU指定的                                         |
   | 3    | 0x80200000 | 用户自己写的代码 | 入口地址是RustSBI指定的                                      |

   我们需要将bin文件load到地址为0x80200000的地方，这可以在命令行启动QEMU时候，通过设置相关参数实现，具体见下一步。

   > * 关于系统启动的一般过程可以参考[这里](https://www.zhihu.com/question/21672895/answer/774538058)
   >
   > * 关于risc-v的启动过程可以参考[这里](https://rcore-os.github.io/rCore-Tutorial-Book-v3/appendix-c/index.html)



## 启动裸机，它会执行指定位置的代码

启动内核，启动gdb监听1234端口，然后停下来等待debug

```bash
qemu-system-riscv64 \
    -machine virt \
    -nographic \
    -bios ./bootloader/rustsbi-qemu.bin \
    -device loader,file=target/riscv64gc-unknown-none-elf/release/os.bin,addr=0x80200000 \
    -s -S
```

在另外一个窗口连接上gdb

```bash
riscv64-unknown-elf-gdb \
    -ex 'file target/riscv64gc-unknown-none-elf/release/os' \
    -ex 'set arch riscv:rv64' \
    -ex 'target remote localhost:1234'
```

此时模拟器正在运行QEMU的固件，它负责加载RustSBI，RustSBI负责加载内核，具体过程这里不再重复，直接在0x80200000设置断点，看内核是否成功加载

```bash
(gdb) b *0x80200000
Breakpoint 1 at 0x80200000
(gdb) c
Continuing.

Breakpoint 1, 0x0000000080200000 in stext ()
(gdb) x/5i $pc
=> 0x80200000 <stext>:  li      ra,100# 我们的内核被成功加载啦！
   0x80200004:  unimp
   0x80200006:  unimp
   0x80200008:  unimp
   0x8020000a:  unimp
```

至此，整个内核的加载终于完成了！

> 这个文件上一次的提交时间是22年的6月，当时被太多细节卡得无法继续写下去。时隔一年3个月，补充了各种底层知识后哥又回来了，现在不仅能轻松完成还能随意按照自己的意愿魔改，值得庆祝的里程碑！



# 为内核支持函数调用

这一节主要工作时设置栈，只有设置好栈之后才能进行函数调用，主要包含以下几步

1. 在汇编代码中划分栈空间，通过修改汇编代码实现：

   ```assembly
   .section .text.entry	#定义名为.text.entry的section，它稍后会被链接脚本引用
   .globl _start	#定义全局符号_start，使其对外可见，它是一个地址，稍后会被链接脚本引用
   _start:
       la sp, boot_stack_top	#设置栈顶值，boot_stack_top此时是指向栈顶的
       call rust_main			#上面设置好sp之后，才能正常调用rust程序
       .section .bss.stack #定义了一个section，后续的内容都会进入这个section，包括后面.space中指定的，注意.bss.stack已经包含在链接脚本中了
       .globl boot_stack_lower_bound	#定义全局符号
   boot_stack_lower_bound:	#栈底 
       .space 4096 * 16	#分配栈空间
       .globl boot_stack_top	#定义全局符号
   boot_stack_top:			#栈顶
   ```

   > 按道理来说栈是无需在ELF文件中指定的，这里设置把栈放置到`.bss`中，有点不好理解。可能这是裸机编程而不是普通的应用程序那种面向虚拟地址空间的编程？

2. 通过Rust代码初始化`.bss`中的内容

   这里的重点是：

   * ELF此时被QEMU直接加载到内存中，**ELF已经不仅仅是一个静态image了，成为了程序运行时的内存布局**，因为ELF中的代码段已经记录了所有的地址信息，因此剪裁为bin文件后不影响代码执行。
   * `.bss`是必须手动初始化的，因为它再ELF中不占空间，但是通过`.space`定义的就占据空间

   ```rust
   #[no_mangle]
   pub fn rust_main() -> ! {
       clear_bss();
       loop {}
   }
   
   
   fn clear_bss() {
       extern "C" {
           fn sbss();//将链接脚本中sbss和ebss视为函数也不是不可以，因为后面不是实施真正的调用，只是利用了地址值
           fn ebss();
       }
       (sbss as usize..ebss as usize).for_each(|a| {
           unsafe { (a as *mut u8).write_volatile(0) }
       });
   }
   ```

   



# 基于SBI服务完成输出和关机
