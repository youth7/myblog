> 从本章起因为代码量陡增，因此不再罗列全部代码，只对关键部分做出说明，完整代码见[这里](https://github.com/youth7/write-os-with-rust/tree/ch2)

这章主要做两件事情：

* 编写运行在U模式下的用户代码，这些代码会进行system call陷入S模式
* 编写运行在S模式下的操作系统代码，包括：
  * 实现system call本身
  * 加载并运行用户代码
  * 实现从U trap到S并返回的一系列准备和善后工作

这一章有相当多关键而又令人迷惑的小细节，了解清楚每个部分能打通很多关键的经络。OS的代码和用户代码是两个独立的package，并没有用workspace将它们统一管理，原因是它们之间的关联很少，强行用workspace只会增加复杂度。

# 实现用户代码

## 概览

有5个用户代码，作用如下：

* `00hello_world.rs`：第一个加载并运行的用户态程序，调用syscall进行打印
* `01store_fault.rs`：访问非法的内存位置
* `02power.rs`：连续进行系统调用
* `03priv_inst.rs`：非法使用特权指令
* `04priv_csr.rs`：非法读写CSR

和ch1不同的是，用户代码通过syscall来实现控制台输出而不是依赖于SBI（当然OS代码还是依赖SBI进行控制台输出）。

## 创建package

在ch1的根目录下使用命令`cargo new user --lib`创建新的package，此时package的名称是`user`，但教程的示例代码不知基于什么原因将其改为了`user_lib`，我们这里不做更改维持原样。原教程还引入了一个魔改的riscv库来实现修改CSR，这个功能我们直接使用`asm`宏来做，这样就省掉了不必要的依赖

```toml
[package]
name = "user"
version = "0.1.0"
edition = "2021"

[dependencies]

[profile.release]
debug = true
```



## 调用syscall的代码

因为这里的syscall是模拟Linux的（以便我们的OS尚未完成时使用`qemu-riscv64`模拟执行，同时也因为这个教程本身就是模仿Linux？），因此签名和[Linux的syscall](https://man7.org/linux/man-pages/man2/syscall.2.html)几乎一模一样，除了我们暂时无法实现可变参。  

通过syscall用户代码会陷入到S模式并调用OS提供的功能，本章实现了Linux下的[write](https://man7.org/linux/man-pages/man2/write.2.html)和exit两个[syscall](https://man7.org/linux/man-pages/man3/exit.3.html)

```rust
use core::arch::asm;

const SYSCALL_WRITE: usize = 64;
const SYSCALL_EXIT: usize = 93;

fn syscall(id: usize, args: [usize; 3]) -> isize {
    let mut ret: isize;
    unsafe {
        asm!(
            "ecall",
            inlateout("x10") args[0] => ret,
            in("x11") args[1],
            in("x12") args[2],
            in("x17") id
        );
    }
    ret
}

pub fn sys_write(fd: usize, buffer: &[u8]) -> isize {
    syscall(SYSCALL_WRITE, [fd, buffer.as_ptr() as usize, buffer.len()])
}

pub fn sys_exit(exit_code: i32) -> isize {
    syscall(SYSCALL_EXIT, [exit_code as usize, 0, 0])
}
```

* 关于`ecall`的syscall调用规范比较繁琐，可以看一下[这里的讨论](https://stackoverflow.com/questions/59800430/risc-v-ecall-syscall-calling-convention-on-pk-linux)。注意syscall规范是平台相关的，不包含在RISCV的调用约定中，《RISC-V ABIs Specification》上面明确指出：

  > The calling convention for system calls does not fall within the scope of this document. Please refer
  > to the documentation of the RISC-V execution environment interface (e.g OS kernel ABI, SBI).

* `ecall`指令和它后续用到的一系列寄存器不是在一条指令内完成的，见[这里](https://www.risc-v1.com/thread-2746-1-1.html)

* Linux上的syscall table见[这里](https://www.robalni.org/riscv/linux-syscalls-64.html)



## 实现控制台输出相关宏

基本可以沿用ch1中的代码，但是核心实现不再依赖SBI，而是发起syscall。

```rust
use super::write;//上面的syscall模块
use core::fmt::{self, Write};

struct Stdout;

const STDOUT: usize = 1;

impl Write for Stdout {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        write(STDOUT, s.as_bytes());//这个是关键，之前使用sbi中的console_putchar，现在改为syscall
        Ok(())
    }
}
//...后续省略
```



## 用户代码

需要注意，对用户代码来说，在调用关系上当前的lib crate和其它的第三方crate没有区别（用户代码也没有被`lib.rs`引入），因此需要使用`#[macro_use]`来导出全部宏，也可以像使用外部模块那样直接引用指定的宏。

用`04priv_csr.rs`来展示我们对教程源码做的一些细微调整，有：

* 使用`use`直接引用依赖，这样意图更加清晰;
* 使用内联汇编来修改CSR寄存器

```rust
#![no_std]
#![no_main]

use user::println;
use core::arch::asm;

#[no_mangle]
fn main() -> i32 {
    println!("Try to access privileged CSR in U Mode");
    println!("Kernel should kill this application!");
    unsafe {
        asm!("csrw sstatus, t0");
    }
    0
}
```



## `lib.rs`

编译的入口，功能有：

* 构建模块树，以供用户代码调用相关功能
* 结合链接脚本，指导如何去编译用户代码。

这里有点奇怪，虽然我们没有指定编译用户代码，但可能根据[Package Layout](https://doc.rust-lang.org/cargo/guide/project-layout.html#package-layout)的约定，`src/bin`下面的客户代码**都会被编译为可执行文件**，因为这个package属于多个bin crate+1个lib crate的类型，每一个用户代码就是一个bin crate。因为它们都依赖于`lib.rs`所以`lib.rs`也**参与到每一个用户代码的编译中**，具体作用包括：

* 生成`_start`符号并将其指定为入口（即地址为0x80400000），关于`_start`作为入口的一些细节见[这里中ENTRY的相关章节](../embed_with_rust/embedonomicon.md)。

* `_start`会调用`lib.rs`中定义为弱符号的`main`，这意味着如果客户代码中包含`main`则使用客户提供的，否则使用`lib.rs`中默认的`main`


```rust
...
#[no_mangle]
#[link_section = ".text.entry"]
pub extern "C" fn _start() -> ! {
    clear_bss();
    exit(main());
    panic!("unreachable after sys_exit!");
}
...
```

从`#[link_section = ".text.entry"]`可知`_start`会被生成到`.text.entry`，而根据链接脚本，`.text.entry`位于`.text`的顶部，其地址为0x80400000。



## 编译和裁剪

运行以下命令编译并检查

```bash
cargo build --release --target riscv64gc-unknown-none-elf
readelf -s target/riscv64gc-unknown-none-elf/release/01store_fault | grep _start
```

找到`_start`并且地址值为0x80400000，说明用户代码已经链接到`lib.rs`了。经过上述步骤，我们的客户代码已经就绪，等待后续OS的加载和运行。





## 参考：

* [lib.rs和main.rs的关系](https://stackoverflow.com/questions/57756927/rust-modules-confusion-when-there-is-main-rs-and-lib-rs)。总结就是，将`lib.rs`当做其它第三方库对待（直接通过`use`引入）就是了。

# 实现OS代码

## 实现system call本身

## 加载并运行用户代码

## 实现从U trap到S并返回的一系列准备和善后工作











# 一些疑问

1. 因为Trap并不是普通的函数调用，因此调用的双方并没有遵循调用约定？
2. 内核中定义的栈和链接文件中的栈有什么区别
3. 

