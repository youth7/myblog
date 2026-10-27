完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day6



首先要理解trap，exception，interrupt三者的关系，RISCV官方手册非特权指令集手册 §1.6中如此写到：

> * We use the term **exception** to refer to an unusual condition occurring at run time associated with an instruction in the current RISC-V hart. 
>
> * We use the term **interrupt** to refer to an external asynchronous event that may cause a RISC-V hart to experience an unexpected transfer of control. 
>
> * We use the term **trap** to refer to the transfer of control to a trap handler caused by either an exception or an interrupt.

即trap是一个控制转移过程：当异常或者中断发生的时候，系统将控制权从当前的执行流转移到异常处理流（ECF）。





本章目标是实现trap，这要求我们：

1. 编写`trap_vector`
2. 安装`trap_vector`



# 安装`trap_vector`

`trap_vector`是一个异常或者中断发生（下面统称为异常）时，由硬件自动调用的第一个处理函数/procedure（下面统称为函数）。寄存器`mtvec`储存了它的地址，因此安装过程非常简单：将自定义的`trap_vector`的地址写入`mtvec`即可。



`trap_vector`不负责具体的异常处理，他只是保存上下文，然后调用由C语言编写的异常处理函数，



# 编写`trap_vector`

`trap_vector`的工作流程如下：

1. 保存整套寄存器（和上一章的`switch_to`类似）
2. 调用C语言编写的异常处理函数
3. 恢复整套寄存器并返回trap之前的状态

```assembly
.global trap_vector
# 函数地址按照4对齐，说明是direct模式
.align 4
trap_vector:
    # 保存当前函数的上下文到mscratch指向的地方
    # 从scheudle.c可知，每个函数的上下文都存在contexts的某个位置中，而mscratch指向了这个地方
    csrrw t6, mscratch, t6
    save_reg t6
    # 和switch_to一样，手动保存t6的值
    csrr t5, mscratch         
    sw t5, 120(t6)
 
    # 恢复mscratch的值
    csrw mscratch, t6

    # 调用中断/异常处理函数
    csrr a0, mepc
    csrr a1, mcause

    # trap_handler是用c编写的异常处理函数
    call trap_handler

    csrw	mepc, a0

    # 恢复寄存器，注意mscratch在trap_handler中没有被改变过（这是相互配合的结果）
    # 如果mscratch在trap_handler中被改变了，那么我们就必须提前将它存入到callee save的寄存器中，以便后面可以继续使用    
    csrr t6, mscratch
    restore_reg t6

    #返回原来的执行流
    mret
```



在编写过程中，需要留意不要踩到以下坑：

1. 安装`trap_vector`时填错地址，把`trap_handler`的地址填到`mtvec`。这样会造成异常处理函数已经成功安装的错觉，因为会`trap_handler`输出打印内容，但后续流程不符合预期。
2. 当异常不是在用户函数中产生，而是在`kernel.c`中产生。此时因为`mscratch`还是0（用户函数尚未运行），则运行到`save_reg t6`这行代码的时候会因为访问错误（访问的内存地址为0）而再次触发异常，此时再次进入`trap_vector`形成无限循环，但程序表面看起来卡死不动。这个问题的根本原因是没有为内核启动阶段准备一个异常发生时保存上下文的地方，解决的方法有：
   1. 在`entry.s`中开启一个地方，用于保存当前执行流程上下文（仅当`mscratch`为0时执行）
   2. `contexts[]`长度加1，用于保存当前执行流程上下文（仅当`mscratch`为0时执行）
   3. 让`kernel.c`不要出错，这是系统启动时候的元代码，没有任何保障。



# trap处理中涉及到寄存器列表以及功能

| 寄存器                                      | 用途                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `mtvec`（Machine Trap-Vector Base-Address） | 它保存发生异常时处理器需要跳转到的地址                       |
| `mepc`（Machine Exception Program Counter） | 当 trap 发生时，hart 会将发生 trap 所对应的指令的地址值（pc）保存在mepc 中 |
| `mcause`（Machine Cause）                   | 当 trap 发生时，hart 会设置该寄存器通知我们 trap 发生的原因  |
| `mtval`（Machine Trap Value）               |                                                              |
| `mstatus`（Machine Status）                 |                                                              |
| `mscratch`（Machine Scratch）               |                                                              |
| `mie`（Machine Interrupt Enable）           |                                                              |
| `mip`（Machine Interrupt Pending）          |                                                              |







