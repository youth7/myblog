# 第一条内核指令

这节的内容是**编写一个最为简单的从裸机上启动的程序**，一定要先参考[这里](../embed_with_rust/embedonomicon.md)的前几章，否则卡点太多晕头转向。裸机运行程序的流程是：

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
BASE_ADDRESS = 0x80200000;

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


2. 加载bin文件到指定位置



对于步骤1，使用以下命令进行裁剪，

```rust
rust-objcopy --strip-all target/riscv64gc-unknown-none-elf/release/os -O binary target/riscv64gc-unknown-none-elf/release/os.bin
```

注意`--strip-all`的作用是：

*Do not copy relocation and symbol information from the source file.  Also deletes debug sections*

`objcopy`只是删除一些运行时无关的信息，与运行有关的数据段信息是会保留的。并且从上面的符号表可看到，我们自定义的有用的section全部放在前面，无用的符号表之类全在自定义节的后面，因此无论这个ELF是否地址无关，剪裁后都可以正常执行。



对于步骤2，对于我们这个环境，其启动流程如下

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

这一节是在上一步的基础上，**增加设置栈空间的内容**，只有设置好栈之后才能进行下一节的函数调用，主要包含以下几步

1. 在汇编代码中划分栈空间，通过修改汇编代码实现，因为设置栈需要修改sp，这只能使用汇编实现，修改`entry.asm`为：

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

   bin文件此时被QEMU直接加载到内存中，**它已经不仅仅是一个静态image了，成为了程序运行时的内存布局**，因此必须初始化`.bss`（它在ELF中不占空间）

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

这一节是在上一步的基础上，**增加定义的函数，调用RustSBI的方法完成一些基础功能**。如果不熟悉Rust宏和RustSBI可以先将其视为一个黑盒。

SBI为上层软件提供一个公共的抽象，使得基于它的上层软件具有移植性。RustSBI是RISC-V的一部分，如果不熟悉可以先将其视为一个黑盒，只需要知道如何调用就可以，记住我们的目的是开发一个OS而不是专精做RISC-V开发，同理后续的Rust宏也一样对待。

首先，我们将RustSBI的功能封装为独立的模块，新建`sbi.rs`

```rust
#![allow(unused)]
use core::arch::asm;

#[inline(always)]
fn sbi_call(eid: usize, fid: usize, arg0: usize, arg1: usize, arg2: usize) -> usize {    // 用asm!而不是像之前那样include_str!的原因是需要给汇编传参
    let mut ret;
    unsafe {
        asm!(
            "ecall",//调用riscv的ecall指令
            inlateout("x10") arg0 => ret,//x10寄存器的值从由变量arg0指定。并且，指令调用结束后的返回值写到ret变量中
            in("x11") arg1,//传参，a1寄存器的值从由变量arg1指定
            in("x12") arg2,//传参，a2寄存器的值从由变量arg2指定
            in("x16") fid,//a6存function id
            in("x17") eid,//a7存extension id
        );
    }
    ret
}



// legacy extensions: ignore fid
const SBI_SET_TIMER: usize = 0;
const SBI_CONSOLE_PUTCHAR: usize = 1;
const SBI_CONSOLE_GETCHAR: usize = 2;
const SBI_CLEAR_IPI: usize = 3;
const SBI_SEND_IPI: usize = 4;
const SBI_REMOTE_FENCE_I: usize = 5;
const SBI_REMOTE_SFENCE_VMA: usize = 6;
const SBI_REMOTE_SFENCE_VMA_ASID: usize = 7;

// system reset extension
const SRST_EXTENSION: usize = 0x53525354;
const SBI_SHUTDOWN: usize = 0;

pub fn console_putchar(c: usize) {
    sbi_call(SBI_CONSOLE_PUTCHAR, 0, c, 0, 0);
}

pub fn shutdown() -> ! {
    crate::println!("shutdown now ...");//这个宏是在后面console.rs中导出的
    sbi_call(SRST_EXTENSION, SBI_SHUTDOWN, 0, 0, 0);
    unreachable!("impossible to be here");
}
```

关于SBI的调用规范见[这里](https://docs.rs/rustsbi/latest/rustsbi/#call-sbi-in-different-programming-languages)，RISC-V的Calling Convention见[这里](https://riscv.org/wp-content/uploads/2015/01/riscv-calling.pdf)。



然后，调用RustSBI的功能实现打印功能的模块，新建`console.rs`

```rust
//! SBI console driver, for text output

use crate::sbi::console_putchar;
use core::fmt::{self, Write};

struct Stdout;

impl Write for Stdout {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        for c in s.chars() {
            console_putchar(c as usize);
        }
        Ok(())
    }
}

pub fn print(args: fmt::Arguments) {
    Stdout.write_fmt(args).unwrap();
}

/// print string macro
#[macro_export]
macro_rules! print {
    ($fmt: literal $(, $($arg: tt)+)?) => {
        $crate::console::print(format_args!($fmt $(, $($arg)+)?));
    }
}

/// println string macro
#[macro_export]
macro_rules! println {
    ($fmt: literal $(, $($arg: tt)+)?) => {
        $crate::console::print(format_args!(concat!($fmt, "\n") $(, $($arg)+)?));
    }
}
```

宏里面翻来覆去的依赖关系是这样的：

1. 因为需要模拟到跟std中的`print!/println!`一样**支持动态参数**，所以自定义的`print!/println!`依赖[`Argument`](https://doc.rust-lang.org/core/fmt/struct.Arguments.html)，而`format_args!`恰好能返回`Argument`。

   > Any value that implements the [`Display`](https://doc.rust-lang.org/core/fmt/trait.Display.html) trait can be passed to `format_args!`, as can any [`Debug`](https://doc.rust-lang.org/core/fmt/trait.Debug.html) implementation be passed to a `{:?}` within the formatting string.

2. [`Write`](https://doc.rust-lang.org/alloc/fmt/trait.Write.html) trait中的`write_fmt`方法恰好能接受`Argument`参数，因此需要实现它。注意`Argument`是已经格式化后的字符串。



最后，我们在`main.rs`调用上述封装好的功能，修改为：

```rust
#![feature(panic_info_message)]
#![no_main]
#![no_std]
use core::panic::PanicInfo;
use core::arch::global_asm;

mod console;
mod sbi;

#[panic_handler]
fn panic(info: &PanicInfo<'_>) -> ! {
    //当panic的时候，打印堆栈信息然后关机
    if let Some(location) = info.location() {
        println!(
            "Panicked at {}:{} {}",
            location.file(),
            location.line(),
            info.message().unwrap()
        );
    } else {
        println!("Panicked: {}", info.message().unwrap());
    }
    sbi::shutdown()
}

global_asm!(include_str!("entry.asm"));

#[no_mangle]
pub fn rust_main() -> ! {
    clear_bss();
    println!("hello, power on !!");
    panic!("oh crash !! {}","-_-!")
}  


fn clear_bss() {
    extern "C" {
        //将链接脚本中sbss和ebss视为函数也不是不可以，因为后面不是实施真正的调用，只是利用了地址值
        //并且extern为函数是为了方便，如果extern为静态变量，则还需要&一次取地址，具体见文末的参考
        fn sbss();
        fn ebss();
    }
    (sbss as usize..ebss as usize).for_each(|a| {
        unsafe { (a as *mut u8).write_volatile(0) }
    });
}
```



一切就绪，编译并**剪裁为bin（千万别忘记）**，然后启动QEMU测试一下：

```bash
qemu-system-riscv64 \
    -machine virt \
    -nographic \
    -bios ./bootloader/rustsbi-qemu.bin \
    -device loader,file=target/riscv64gc-unknown-none-elf/release/os.bin,addr=0x80200000
```

输出如下，我们的：

```bash
[rustsbi] RustSBI version 0.3.1, adapting to RISC-V SBI v1.0.0
.______       __    __      _______.___________.  _______..______   __
|   _  \     |  |  |  |    /       |           | /       ||   _  \ |  |
|  |_)  |    |  |  |  |   |   (----`---|  |----`|   (----`|  |_)  ||  |
|      /     |  |  |  |    \   \       |  |      \   \    |   _  < |  |
|  |\  \----.|  `--'  |.----)   |      |  |  .----)   |   |  |_)  ||  |
| _| `._____| \______/ |_______/       |__|  |_______/    |______/ |__|
[rustsbi] Implementation     : RustSBI-QEMU Version 0.2.0-alpha.2
[rustsbi] Platform Name      : riscv-virtio,qemu
[rustsbi] Platform SMP       : 1
[rustsbi] Platform Memory    : 0x80000000..0x88000000
[rustsbi] Boot HART          : 0
[rustsbi] Device Tree Region : 0x87e00000..0x87e0107e
[rustsbi] Firmware Address   : 0x80000000
[rustsbi] Supervisor Address : 0x80200000
[rustsbi] pmp01: 0x00000000..0x80000000 (-wr)
[rustsbi] pmp02: 0x80000000..0x80200000 (---)
[rustsbi] pmp03: 0x80200000..0x88000000 (xwr)
[rustsbi] pmp04: 0x88000000..0x00000000 (-wr)
hello, power on !!
Panicked at src/main.rs:32 oh crash !! -_-!
shutdown now ...
```



# 课外练习

todo：代码中已完成，但本篇笔记没有更新相关内容



# 一些额外的知识

关于链接脚本暴露出来的各种符号（例如`stext`），为何需要被extern成函数，其实隐藏了很多细节，具体看[这里](./symbol.md)的讨论截图。

# 总结

开发最简易的OS内核的一般步骤是：

1. 根据硬件平台规范，编写链接脚本，这是为了将各种源文件编译为**符合硬件地址空间布局的二进制**。
2. 编写内核相关代码，包括：
   1. 用汇编，**先初始化栈**（因为接着马上要进行函数调用了），然后调用高级语言编写的内核
   2. 用高级语言，编写内核相关内容，例如初始化`.bss`



而RISC-V平台因为多了SBI的概念，且SBI并没有链接到内核代码，因此调用SBI的真正方式并不是常规的函数调用。
