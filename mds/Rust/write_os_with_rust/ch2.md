> 从本章起因为代码量陡增，因此不再罗列全部代码，只对关键部分做出说明，完整代码见[这里](https://github.com/youth7/write-os-with-rust/tree/ch2)

这章主要做两件事情：

* 编写运行在U模式下的用户代码，这些代码会进行system call陷入S模式
* 编写运行在S模式下的操作系统代码，包括：
  * 实现system call本身
  * 加载并运行用户代码
  * 实现从U trap到S并返回的一系列准备和善后工作

这一章有相当多关键而又令人迷惑的小细节，了解清楚每个部分能打通很多关键的经络。这一章的亮点是在rust中的package中，如何去包含多个bin crate和一个lib crate。

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



## 实现syscall的调用

因为这里的syscall是模拟Linux的（以便我们的OS尚未完成时使用`qemu-riscv64`模拟执行，同时也因为这个教程本身就是模仿Linux），因此签名和[Linux的syscall](https://man7.org/linux/man-pages/man2/syscall.2.html)几乎一模一样，除了我们暂时无法实现可变参。  

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

**`ecall`并没有什么规范，它只是指令。而SBI call和syscall才有相关的规范**，《RISC-V ABIs Specification》上面明确指出：

> The calling convention for system calls does not fall within the scope of this document. Please refer
> to the documentation of the RISC-V execution environment interface (e.g OS kernel ABI, SBI).

其实`ecall`只是一条指令，只使用了`rd`和`rs`两个寄存器，调用后使得CPU trap到不同的模式。而利用这条指令实现syscall，并规定`ecall`后一系列寄存器的使用约定，则是OS的事情。Linux上的syscall table见[这里](https://www.robalni.org/riscv/linux-syscalls-64.html)。



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

* [lib.rs和main.rs的关系](https://stackoverflow.com/questions/57756927/rust-modules-confusion-when-there-is-main-rs-and-lib-rs)，总结就是，将`lib.rs`当做其它第三方库对待（直接通过`use`引入）就是了。

# 实现OS代码

这部分的关键点有：

1. 理解第一个程序是如何被加载并运行的，关键在于加载后如何设置EPC寄存器
2. 在程序正常/异常结束后，OS是如何切换下一个程序的（也和EPC寄存器的设置相关）

OS包含以下几个模块，后面将一一介绍

* syscall：包含系统调用的实现
* sync：一个新的包装类，用来包装`AppMannager`
* trap：实现了trap的相关内容，本章最为核心的内容
* batch：加载并运行用户程序



本章是在ch1的基础上对OS改造增加批处理的功能，同时对一些基础模块进行了改造使得代码更加精简：

1. SBI调用：ch2通过引入[sbi-rt](https://docs.rs/sbi-rt/0.0.2/sbi_rt/index.html)实现，ch1是内联汇编中调用`ecall`指令实现
2. 日志打印：ch2引入了通用的日志框架[log](https://docs.rs/log/latest/log/)，个人认为这不是必要的，沿用ch1的`console.rs`即可





## 实现system call

这个模块实现了syscall，其中控制台的输出功能是调用了SBI的功能，整体并没有特别的地方，只有一处需要留意

```rust
//os/scr/syscall/process.rs
pub fn sys_exit(exit_code: i32) -> ! {
    println!("[kernel] Application exited with code {}", exit_code);
    run_next_app()
}

//user/src/lib.rs
pub extern "C" fn _start() -> ! {
    clear_bss();
    exit(main());
    panic!("unreachable after sys_exit!");
}
```

将`exit`嵌入到`_start`，说明每个用户程序正常结束的话都会调用`sys_exit`打印退出码并通过`run_next_app`运行下一个程序。这样就形成了批处理，但用户程序感知不到，这和C语言中[用`_start`包裹`main`是一样的](https://stackoverflow.com/questions/29694564/what-is-the-use-of-start-in-c)。



到这里，很多年前的一个疑问解开了：

>  如果用户在二进制代码中包含了了特权等级切换的指令，企图获取系统控制权怎么办？

结合后面trap小节的内容我们可以看到这是不可能的，首先了解OS是如何初始化异常处理模块的：

1. OS启动时候初始化了异常处理向量表（`stvec`），指定了异常触发时候的处理函数`trap_handler`
2. `ecall`触发异常，转到内核执行流，执行`trap_handler`
3. `trap_handler`中的逻辑必须保证用户此时的操作是合法的

也就是说，以下机制确保了无法在用户态非法获得资源

1. **不能在用户态执行特权指令**（直接报错）
2. 如果企图在用户态下先通过`ecall`提升特权等级，再执行特权指令也是不行的。**因为`ecall`后立即跳转到内核态执行`trap_handler`，`trap_handler`执行完毕后立即返回用户态**，则此时又回到了情况1。



## sync

引入这个模块的需求如下：

1. `AppManager`需要全局可变，→`static mut`
2. 1会导致对`AppManager`的访问都是unsafe，→去掉`mut`，用`RefCell`包装`AppManager`
3. 2中引入的`RefCell`不是线程安全，→用自定义的`UPSafeCell`包装



如果直接用unsafe的话是可以省去这个模块的，用了这个模块反而使得代码更不容易读，如果代码不复杂的话个人倾向使用unsafe。但参考了后面章节的内容后发现sync模块还有继续使用，因此先保留。



## trap

本章最为核心的内容，这个模块包含以下功能：

* 实现trap的处理过程，包括：
  * `_allTraps`：进入trap时的寄存器保存，用户栈和内核栈的切换，并调用`trap_handler`
  * `trap_handler`：根据trap的类型进行相关处理
  * `__restore`：退出trap时恢复上下文

* 初始化CSR `stvec`（在`init()`中）



总之，`__restore`、`trap_handler`和`run_next_app`（在batch模块中）这3个相互搭配巧妙地实现了批量加载并运行用户程序，其中

* `run_next_app`：加载下一个应用程序到指定位置，并初始化相关资源，然后调用`__restore`

* `__restore`：本来是用于trap退出时候的恢复上下文的，但此时利用它的副作用，实现了驱动新的用户程序运行
* `trap_handler`：异常分派，总体上分为两种情况，详细见`trap_handler`



*trap.S*用汇编实现了`__allTraps`和`__restore`

```assembly
.altmacro
.macro SAVE_GP n
    sd x\n, \n*8(sp)
.endm
.macro LOAD_GP n
    ld x\n, \n*8(sp)
.endm
    .section .text
    .globl __alltraps
    .globl __restore
    .align 2
__alltraps:
#...省略

__restore:
#...省略
```

定义了SAVE_GP和LOAD_GP两个宏，会在后面的循环中用到，达到动态生成代码的目的。`\`表示这是参数引用。

这里最重要的一点是，**`__alltraps`最后一条指令是`call trap_handler`，call完之后会立马向下运行到达`__restore`实现恢复上下文**，*trap.S*不仅仅是定义了两个函数，还定义了trap的进入和退出的完整流程。

### `_allTraps`：

```assembly
__alltraps:
    csrrw sp, sscratch, sp# 交换sp和sscratch的值，交换前sp和sscratch分别指向user栈和kernel栈
    addi sp, sp, -34*8# 在栈上为TrapContex分配空间，它包含32个通用寄存器数量 + 1个sstaus + 1个sepc = 34个
    # 保存通用寄存器 x0~x31，跳过 x0和x4，x2要晚点才能保存
    sd x1, 1*8(sp)
    sd x3, 3*8(sp)
    .set n, 5
    .rept 27
        SAVE_GP %n
        .set n, n+1
    .endr
    # 接下来可以使用t0/t1/t2了，因为已经保存到栈上
    csrr t0, sstatus 
    csrr t1, sepc #注意epc的意义，非常重要！
    sd t0, 32*8(sp)
    sd t1, 33*8(sp)
    # 读取sstatus、sepc到t0和t1，并保存到栈顶部
    csrr t2, sscratch
    sd t2, 2*8(sp)# 此时才能保存x2，因为此时t2才能被使用
    mv a0, sp
    call trap_handler
```

* `x0`恒为0无需保存；

* `x4`是tp（thread pointer）也无需保存，因为当前是单线程。
* `x2`保存的是sp（即sscratch），因为保存sscratch需要用到临时寄存器，因此需要将它放到最后，等全部通用寄存器都保存完毕之后。同理，保存sstatus、sepc也一样

`mv a0, sp`是很关键的一个动作，在此之前环境已经保存到栈上，34字节的栈空间其实就是`TrapContext`的二进制表示，因此将`sp`赋予`a0`意味着后者指向了`TrapContext`的一个实例，而后续被调用的`trap_handler`函数的第一个参数就是`&mut TrapContext`，也就是说这行代码其实是在传参。

唯一需要注意的是此时的栈数据，是否能还原为`TrapContext`呢？**我们可以推断，如果想要成功还原则栈中数据的布局必须和Rust期望的一致，但这个是无法保证的，谁也不知道Rust在不同场景/版本下是否保持一样的布局。即使保持一致，其结构是否和汇编中栈的数据结构一致也是一个问题**。因此有必要通过一些方式稳定布局，使得Rust使用的内存布局和栈中数据一致，代码中是通过`#[repr(C)]`做到这点

```rust
#[repr(C)]
pub struct TrapContext {
    /// general regs[0..31]
    pub x: [usize; 32],
    /// CSR sstatus      
    pub sstatus: Sstatus,
    /// CSR sepc
    pub sepc: usize,
}
```



### `__restore`：

```assembly
__restore:
    mv sp, a0  #这个在稍后的run_next_app中会解释
    # now sp->kernel stack(after allocated), sscratch->user stack
    # 从栈上恢复sstatus、sepc、和sscratch
    ld t0, 32*8(sp)
    ld t1, 33*8(sp)
    ld t2, 2*8(sp)
    csrw sstatus, t0
    csrw sepc, t1 #注意epc的意义，非常重要！
    csrw sscratch, t2
    # 恢复x1和x3
    ld x1, 1*8(sp)
    ld x3, 3*8(sp)
    .set n, 5
    # 恢复其他通用寄存器
    .rept 27
        LOAD_GP %n
        .set n, n+1
    .endr
    # 改变栈指针，回收栈空间
    addi sp, sp, 34*8
    # 交换sp和scratch，即恢复内核栈和用户栈
    csrrw sp, sscratch, sp
    sret
```

它最为重要的功能是：

1. `call trap_handler`后调用，实现恢复上下文的功能
2. 被`run_next_app`调用，实现切换用户程序

而这些是通过以下细节实现的：

1. 保存并恢复`sepc`
2. 使用`sret`返回到U模式，然后从`sepc`指向的地方继续运行。**注意`sepc`，它会被修改为trap处理完成后默认会执行的下一条指令的地址（在`trap_handler函数中`），这是实现连续运行用户程序的关键，下面会讲到**

> *When a trap is taken into S-mode, sepc is written with the virtual address of the instruction thatencountered the exception. Otherwise, sepc is never written by the implementation, though it maybe explicitly written by software.*



### `trap_handler`

```rust
pub fn trap_handler(cx: &mut TrapContext) -> &mut TrapContext {
    let scause = scause::read(); // get trap cause
    let stval = stval::read(); // get extra value
    match scause.cause() {
        Trap::Exception(Exception::UserEnvCall) => {
            cx.sepc += 4;
            //...
        }
        Trap::Exception(Exception::StoreFault) | Trap::Exception(Exception::StorePageFault) => {
            //...
            run_next_app();
        }
        Trap::Exception(Exception::IllegalInstruction) => {
            //...
            run_next_app();
        }
        _ => {
			//...
        }
    }
    cx
}
```

里面最为重要的是：

* 如果是syscall，**会执行`cx.sepc += 4`修改`sepc`使其指向下一条指令，这样`sret`后就能在用户程序的正确位置执行（注意上面提及的，`call trap_handler`之后顺势往下执行`__restore`），这和普通函数调用非常相似**。
* 如果是非法的指令或读写，则直接运行`run_next_app`来实现用户程序切换，详见`run_next_app`。

需要留意到函数末尾返回了`cx`，这意味着后续的`__restore`会得通过`a0`到这个参数的地址，这个特性很有用后面会讲到。



## batch

### `run_next_app`

```rust
pub fn run_next_app() -> ! {
    let mut app_manager = APP_MANAGER.exclusive_access();
    let current_app = app_manager.get_current_app();
    unsafe {
        app_manager.load_app(current_app);
    }
    app_manager.move_to_next_app();
    drop(app_manager);
    extern "C" {
        fn __restore(cx_addr: usize);
    }
    unsafe {
        __restore(KERNEL_STACK.push_context(TrapContext::app_init_context(
            APP_BASE_ADDRESS,
            USER_STACK.get_sp(),
        )) as *const _ as usize);
    }
    panic!("Unreachable in batch::run_current_app!");
}
```

这个函数调用了`__restore`，它的重点是：

1. 将用户程序加载到`APP_BASE_ADDRESS`
2. 构造`TrapContect`实例并传递给`__restore`，**通过利用`__restore`的副作用，修改`sepc`和调用`sret`指令，最终实现在`__restore`结束后跳转到`APP_BASE_ADDRESS`处运行**。这个就是本章节最绕的地方，核心就是**修改`sepc`并且配合`sret`实现跳转**

对于第二点，包含了以下几种情况：

1. 驱动第一个用户程序的启动运行（在`rust_main`中）。
2. 当任意一个程序运行中遇到异常，立即加载下一个（在`trap_handler`中）。
3. 当任意一个用户程序正常结束的话，立即加载下一个。**这个也是非常隐蔽的地方，因为`run_next_app`被`sys_exit`调用了，而`sys_exit`被嵌入到每个用户程序中**（在户代码*lib.rs*中的`exit(main())`中）

还有一处重要的地方是调用`__restore`时的传参：

```rust
KERNEL_STACK.push_context(TrapContext::app_init_context(
            APP_BASE_ADDRESS,
            USER_STACK.get_sp(),
)
    
impl KernelStack {
...
    pub fn push_context(&self, cx: TrapContext) -> &'static mut TrapContext {
        let cx_ptr = (self.get_sp() - core::mem::size_of::<TrapContext>()) as *mut TrapContext;
        unsafe {
            *cx_ptr = cx;
        }
        unsafe { cx_ptr.as_mut().unwrap() }
    }
}    
```

它的工作流程是：

1. 构造一个代表当前用户程序的`TrapContext`
2. `push_context`会消费1中的对象（move进去），然后生成一个`* mut TrapContext`类型的`cx_ptr`指向1中的对象（**此时这个引用的地址位于内核栈，这一点非常重要**）
3. 2中的`cx_ptr`会传递给`__restore`，通过`a0`存引用的栈地址方式，因此`__restore`中的`mv sp, a0`就得到了解释：
   1. 如果`__restore`是被`run_next_app`调用的，则此时它`a0`指向了内核栈
   2. 如果`__restore`是`call trap_handler`后直接执行下来的，**则因为`trap_handler`中返回了`cx`，所以此时`a0`就是`cx`的地址。而这个返回的`cx`又是在`__alltraps`中通过`mv a0, sp`传递过去的，而此时的`sp`就是指向内核栈**，因此一切就自洽了。





## 加载并运行用户代码

按照一般的理解，OS加载并运行程序需要我们把编译好的程序放在某个路径下，然后运行这个程序。但我们目前的系统非常原始连文件系统都没有，因此只能将用户程序链接到OS中，运行时候再加载到特定的地方开始。





## 实现从U trap到S并返回的一系列准备和善后工作

回忆一下教材中引言部分内容：*在 RISC-V 的特权级规范文档中......中断和异常统称为陷入*，所以代码中也体现了这个概念，`trap_handler`中的模式匹配也是可以分为中断和异常两大类。









# 一些疑问

1. 因为Trap并不是普通的函数调用，因此调用的双方并没有遵循调用约定？
2. 内核中定义的栈和链接文件中的栈有什么区别
3. 如何禁止U模式私自trap到S模式然后做超越权限的事情，原理应该就是SBI接管了系统并初始化了中断向量表？

