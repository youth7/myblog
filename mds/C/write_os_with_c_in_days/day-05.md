完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day5



本章是让OS实现一个协作式的任务调度功能，读者一开始可能会觉得这和普通的函数用没什么区别，为何大费周章写一堆上下文切换的内容？如果仅仅看运行效果，那确实可以通过函数调用来模拟，但区别在于：

1. 教程的最终目标是实现一个抢占式的任务调度，而**上下文切换和任务调度**是该目标的前置技术，本章是让读者先熟悉相关技术。
2. 函数（任务）调用虽然可以模拟相关效果，但这需要caller显式调用callee，这要求函数之间相互了解对方，并精心安排调用关系（这会导致耦合非常大并且规模大了之后无法维护），其本质是让**任务之间自发实现**协作式的调度。而我们想要的效果是每个任务无需知道其它任务的存在，其本质是**调度函数实现协作式调度**（但依然需要任务主动让出CPU使用权）。

因此，本章的主要任务是：

1. 编写多个函数（任务），但不直接调用，而是让OS加载并执行
2. OS初始化（加载）步骤1中的函数
3. OS通过调度函数`scheudle()`来执行这些任务
4. `switch()`实现函数的切换和执行

> 这里说的*函数* 和*任务*是同一个东西，都是指用户编写的、被OS调度的代码，它们不能自发运行。





# 编写任务（用户函数）

需意留意，任务通过主动调用`yield()`来放弃CPU使用权以实现调度，`yield()`本质上是`schedule()`，只是换了个名称（见下面的 *调度函数* 小节）。



# 初始化并加载函数

这一步主要完成以下几个事情：

1. 开辟一块空间，作为各个任务的运行时栈
2. 开辟一块空间，用于存储各个任务上下文（即`context`结构体，存储RISCV中32个整数寄存器）
3. 加载各个函数

关于步骤2，因为各个任务不是通过函数调用的方式进行，因此我们需要精心安排它的上下文，使得它们能够正常运行，最重要的是：

* 正确设置`sp`寄存器，使得函数运行时有栈可用
* 正确设置`ra`寄存器，函数的入口（配合`switch()`中的`ret`指令使用）

```c
//将一个用户任务加载到任务栈中，并初始化其上下文信息
void load_one_task(void (*fn)(void)){
  top++;
  contexts[top].ra = (uint32_t)fn; // 将任务的地址放置到ra寄存器中
  contexts[top].sp = task_stacks[top] + STACK_SIZE -1;// 设置任务的stack地址，需要注意栈是从高地址往低地址增长，因此需要指向当前栈的底部（+ STACK_SIZE -1）
  printf("已经加载任务%d，地址是%p, stack是%p\n", top, contexts[top].ra, contexts[top].sp);
}
```





需要留意的是，这里的栈空间和`start.s`中的栈空间不是一回事，区别如下：

| 空间                        | 用途                                                    | 空间来源及位置                                               |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `start.S` 中的 `stacks`     | 启动阶段供 hart 使用；在调度开始前，进入 C 代码所需的栈 | 汇编用 `.skip` 预留。因为它前面仍处于 `.text` 段，按当前链接脚本会被放进输出的 `.text` 段 |
| `sched.c` 中的 `task_stack` | 为调度器创建的每个 task 提供独立栈                      | 未显式初始化的全局数组，通常放在 `.bss` 段                   |





# 调度函数

调度函数的触发时机有两处：

1. 系统启动时候调度第一个任务
2. 任务主动让出使用权的时候，调度下一个任务



调度的规则比较简单，通过对10求模来循环调度各个任务。

```c
//top指向任务队列中最后一个任务，current指向第一个任务
static uint32_t current = -1;
static uint32_t top = -1;

extern void switch_to(struct context * context_of_next_task);
//将一个用户任务加载到任务栈中，并初始化其上下文信息
void load_one_task(void (*fn)(void)){
  top++;
  contexts[top].ra = (uint32_t)fn; // 将任务的地址放置到ra寄存器中
  contexts[top].sp = task_stacks[top] + STACK_SIZE -1;// 设置任务的stack地址，需要注意栈是从高地址往低地址增长，因此需要指向当前栈的底部（+ STACK_SIZE -1）
  printf("已经加载任务%d，地址是%p, stack是%p\n", top, contexts[top].ra, contexts[top].sp);
}
```







# 上下文切换函数

这个是本章中的核心，它的作用是：

1. 保存当前运行任务的`context`到内存中
2. 将传入的下一个任务的`context`加载到各个寄存器
3. 通过`ret`实现跳转以驱动函数运行



用汇编实现这个函数有非常多需要注意的小地方：

1. 宏`save_reg`无需保存`t6`，以及`t6`需要手动保存的原因：`mscratch`无法直接用在`beqz`中
2. `t6`作为基寄存器的原因（宏`resore_reg`中，最后恢复的寄存器必定是基寄存器），以及为何`mv	t6, a0`及其重要（⚠️）
3. 约定使用`mscratch`指向当前任务的上下文存储空间地址

```assembly


.macro save_reg base
    sw ra, 0(\base)
    sw sp, 4(\base)
    sw gp, 8(\base)
    sw tp, 12(\base)

    sw t0, 16(\base) 
    sw t1, 20(\base) 
    sw t2, 24(\base) 
                 
    sw s0, 28(\base)
    sw s1, 32(\base)

    sw a0, 36(\base) 
    sw a1, 40(\base) 
    sw a2, 44(\base) 
    sw a3, 48(\base)
    sw a4, 52(\base) 
    sw a5, 56(\base) 
    sw a6, 60(\base) 
    sw a7, 64(\base) 
    
    sw s2, 68(\base) 
    sw s3, 72(\base) 
    sw s4, 76(\base) 
    sw s5, 80(\base) 
    sw s6, 84(\base) 
    sw s7, 88(\base) 
    sw s8, 92(\base) 
    sw s9, 96(\base) 
    sw s10, 100(\base)
    sw s11, 104(\base)

    sw t3, 108(\base) 
    sw t4, 112(\base) 
    sw t5, 116(\base) 
    # 无需保存a6，因为a6此时已经被修改过，真正的a6存储在mscratch中，需要后续用额外的手段保存
.endm



.macro resore_reg base
    lw ra, 0(\base)
    lw sp, 4(\base)
    lw gp, 8(\base)
    lw tp, 12(\base)

    lw t0, 16(\base) 
    lw t1, 20(\base) 
    lw t2, 24(\base) 
                 
    lw s0, 28(\base)
    lw s1, 32(\base)

    lw a0, 36(\base) 
    lw a1, 40(\base) 
    lw a2, 44(\base) 
    lw a3, 48(\base)
    lw a4, 52(\base) 
    lw a5, 56(\base) 
    lw a6, 60(\base) 
    lw a7, 64(\base) 
    
    lw s2, 68(\base) 
    lw s3, 72(\base) 
    lw s4, 76(\base) 
    lw s5, 80(\base) 
    lw s6, 84(\base) 
    lw s7, 88(\base) 
    lw s8, 92(\base) 
    lw s9, 96(\base) 
    lw s10, 100(\base)
    lw s11, 104(\base)

    lw t3, 108(\base) 
    lw t4, 112(\base) 
    lw t5, 116(\base)
    lw t6, 120(\base)
    # t6必须作为基寄存器，即最后一个保存的寄存器必定是基寄存器
.endm

# 注意上述宏展开运行时，全程都需要读取base这个寄存器的值，因此base的值全程不能被修改。
# 而base寄存器又必须是32个通用寄存器之一，因此base必须取t6，这样才能达到上述效果



.text
.global switch_to
.align 4
# 主要流程如下：
# mscratch指向当前运行的任务的上下文，它被初始化为0
# 先判断mscratch，以确定当前有无任务正在运行
# 如果mscratch=0，说明当前无任务运行，此时无需保存上下文，直接驱动第一个任务
# 如果mscratch≠0，说明当前有任务运行，此时需要先保存当前任务上下文到内存中，再驱动下一个任务 

# switch_to在C语言中的原型为：void switch_to(struct context *);
# next任务的地址存在寄存器a0中
switch_to:
    # 先判断mscratch的值，因为mscratch无法直接用在分支跳转指令中，因此我们先将它读取到寄存器t6
    # 选t6首先因为它是临时寄存器，同时它位于寄存器列表的最后一个，这对resore_reg来说至关重要！
    csrrw t6, mscratch, t6
    beqz t6, resotre_reg


save_all_reg:
    save_reg t6 # 此时t6指向当前任务的context
    
    # 因为t6被修改了（原来的值此时位于mscratch），因此我们调用save_reg时未保存它，现在手动将它写入到内存中
    csrr t5, mscratch         # 读取原始t8的值到t5中，准备保存
    sw t5, 120(t6)            # t6的偏移量是120

# 把next task的上下文加载到寄存器中
resotre_reg:
    # 设置mscratch为a0，则mscratch指向了next task
    csrw mscratch, a0
    mv	t6, a0  #这一步至关重要，不能直接resore_reg a0，否则a0被覆盖之后，后面依赖a0的指令全都出错
    resore_reg t6
    # ret展开后是：jalr x0, x1, 0，即跳转到x1(ra)寄存器的地址开始运行，并抛弃返回地址的值。
    ret

.end
```





