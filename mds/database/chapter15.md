# 并发控制机制
并发控制的目的是为了保证事务的隔离性，从而实现一致性。常用的并发控制机制有：
* 基于锁的协议
* 基于时间戳的协议
* 基于有效性检查的协议
* 多版本并发控制（MVCC）
* 快照隔离

在理解这些机制时候，都可以用1个简单的并发场景来检验：    
$T_1$和$T_2$并发对数据$Q$进行读取、修改、写入。此时有多种调度的可能（如下图），数据库通过采用我们介绍的并发控制机制，可以保证只生成串行化的调度，从而保持一致性。  
![db_c15_2.jpg](/imgs/db_c15_2.jpg) -->

> 注意：并发控制所有机制，最终的目的都是实现**在一个事务内，它所访问的所有数据都是一致的，即数据都是基于某一个一致的状态而来。如果达到了这个要求，则从宏观上来看事务是串行的**。


## 锁
基于锁的协议思路是：独占数据，期间**不允许其它事务访问数据**（注意这个是区分基于锁的协议与其它协议的一个重点），这属于一种系统强行串行并发访问同一数据的所有操作。  

有两种基于锁的协议，分别是二阶段封锁协议和基于图的封锁协议。

### 二阶段封锁协议
如果事务对资源的封锁不适当，就不能保证一致性，例如以下的例子，因为$T_1$过早地释放了锁，使得事务出现了不一致。例如：  
![db_c15_1.jpg](/imgs/db_c15_1.jpg)

二阶段锁协议是一种通用的封锁方式，它规定事务对资源的封锁/解锁分为两个阶段  

* 增长阶段：只能申请锁不能释放锁
* 缩减阶段：只能释放锁不能申请锁  

从这个做法可以看到，一旦进入缩减阶段，就意味着事务对所有的数据都已经使用完毕（因为不能再申请锁了，若再申请就违反了二阶段协议），从而保证事务过程中所需的数据不会被提前释放，这种做法在基于锁的多线程并发编程中或许也适用。

### 严格二阶段封锁协议
二阶段封锁协议的一个变种，它在原协议的基础上增加了约束：事务提交前**不可释放排他锁**，这个约束避免了级联回滚。

### 强二阶段封锁协议
二阶段封锁协议的又一个变种：它在原协议的基础上增加了约束：事务提交前**不可释放锁**。

注意二阶段锁协议不能保证没有死锁。

### 基于图的封锁协议（略）
### 避免死锁（略）
### 死锁的检测和恢复（略）
## 多粒度（略）


---

## 时间戳

时间戳的思路是：**不锁定数据，如果在我开启之后没有其它事务读/写过数据，则我对数据的读/写是安全的（所有数据都属于同一状态），不会影响其它事务。若有，则当前事务的操作是不安全的，需要回滚。**  这种方式系统没有强行串行对数据的并发访问，而是筛选出不符合串行化要求的操作，并终止它们。

* 每个事务开启的时候都有一个时间戳，记为$TS(T_n)$
* 每个数据项Q都有两个时间戳，分别是读时间戳$R(Q)$和写时间戳$W(Q)$。
* 当事务先后开启，则事务的时间戳决定了事务的串行化顺序，系统必须保证这个串行化的顺序。

具体如下操作  

* 当$T_1$读的时候：
    * 如果$TS(T_1)<W(Q)$（说明有另外一个事务在$T_1$开启之后更新过数据Q），则回滚。否则读取$Q$并更新$R(Q)$=$TS(T_1)$。注意：Read操作不检查$R(Q)$，说明允许多个事务同时读取同一个数据。
* 当$T_1$写的时候：
    * 如果$TS(T_1)<R(Q)$（说明有另外一个事务在$T_1$开启之后读取过数据，若$T_1$继续写入，**会导致之前的事务读取了一个无效的数据**），则回滚。
    * 如果$TS(T_1)<W(Q)$（说明有另外一个事务在$T_1$开启之后更新过数据，若$T_1$继续写入，**会覆盖之前事务的结果**），则回滚。因为该协议没有对Q进行加锁。
    * 如果上述两种情况都不发生，则写入$Q$并令$W(Q)$ = $TS(T_1)$




### Thomas写规则  

在原始时间戳协议中，如果某条指令导致回滚，但是此时如果满足某些条件的话可以不回滚，只需要忽略指令，略。

---
## 基于有效性检查的协议

有效性检查的思路是: 认为并发事务的大多数操作都是不冲突的Read操作，因此无需对数据上锁，只需在写入数据的时候进行有效性检查即可，如果通过检查即意味着数据在此期间没有被修改过，可以直接提交，否则回滚。

类似于CPU的CAS指令，它预期大部分时间事务不会发生冲突，通过检查来确定。
在这个协议中，事务分为三个阶段：

* 读阶段，用时间戳$S(T_n)$标记该阶段开始时间，这个阶段内事务把数据库的数据读取到本地局部变量，然后对局部变量进行修改。  
* 检查阶段，用时间戳$V(T_n)$标记该阶段开始时间，这个阶段内事务将按照一定的规则对Write操作进行检测，通过监测进入下一阶段，否则回滚。
* 写阶段，用时间戳$F(T_n)$标记该阶段结束时间，这个阶段内事务将提交数据（只读事务将忽略这个阶段）

在检查阶段中，事务$T_1、T_2$（不妨假设$T_1$先于$T_2$进入）必须要满足以下两个条件之一，否则终止事务

* $T_1 T_2$按照这样的顺序进行：$F(T_1) < S(T_2)$  
    这个情况意味着事务的执行没有重叠，不存在并发问题。

* $T_1 T_2$按照这样的顺序进行：$S(T_2) < F(T_1) < V(T_2)$，且 **$T_1$写的数据和$T_2$读的数据没有交集**（为方便讨论以下简称这个为约束①）。  
    这个情况意味着事务并发执行，但是事务间处理的数据没有出现交集。可以分两步来解读这个条件  
    * $T_1$写的数据和$T_2$读的数据没有交集 ： 因为没有交集，保证了$T_2$后续处理的数据都不会受到$T_1$的影响，因此$T_2$的数据自然是一致的。
    * $S(T_2) < F(T_1) < V(T_2)$ ： $T_1$读的数据和$T_2$写的数据可能会有交集也可能没有交集，但是即使有交集也没有问题，因为$T_2$在$T_1$结束后才对公共数据进行修改，因此$T_1$在整个事务过程中的数据也是一致的。

仔细比较，这个协议跟时间戳协议似乎是等价的。满足有效性检查事务$T_1、T_2$，同时也满足时间戳协议，例如：
* 对于事务$T_1$，用时间戳协议检查的过程是：    
    读：条件$S(T_2) < F(T_1) < V(T_2)$，使得$T_1$的Read操作满足时间戳协议  
    写：约束①使得$T_1$的Write操作满足时间戳协议  
* 对于事务$T_2$，用时间戳协议检查的过程是：    
    读：约束①使得$T_2$的Read操作满足时间戳协议  
    写：约束①使得$T_2$在$V(T_2)$阶段的Write操作满足时间戳协议（即使$V(T_2)$会修改$T1$读取的数据，但是这没有关系，因为此时$T_1$已经结束了，在$T_1$的整个生命周期内，它所操作的数据都是一致的。）  
    

总结起来就是：**$T_2$结束的时候，$T_1$没有修改过它们之间共同访问的数据，且$T_2$修改的数据，不是它们之间的公共数据**


## 多版本并发控制（MVCC）
MVCC的思路是：**不直接修改数据$Q$的原始值，而是增加一个新的版本，这样就保证了所有事务对数据$Q$的读取都是没有问题的**。  

它和时间戳协议有一些相似的地方：

* 每个事务开启的时候都有一个时间戳，记为$TS(T_n)$
* 每个数据项$Q$都有多个版本，分别为$Q_1 Q_2 ... Q_{n-1}$。 $Q_{n-1}$有两个时间戳，分别是读时间戳$R(Q_{n-1})$和写时间戳$W(Q_{n-1})$。
* 当事务$T_n$创建$Q$的新版本的$Q_n$的时候，会令$R(Q_n)=W(Q_n) = TS(T_n)$

具体操作如下：
* 当事务对$Q$进行读/写，选择$max\{W(Q_n)<=TS(T_n)\}$的那个版本，即写时间戳最为接近$TS(T_n)$的那个版本。
* 如果是Read操作，则更新$R(Q_n) = TS(T_n)$，并返回数据的值
* 如果是Write操作
    * 若$TS(T_n) < R(Q_n)$（表明有事务在我开启之后读取了数据，与时间戳协议类似），则回滚
    * 若$TS(T_n) = W(Q_n)$（表明上一次对数据的读写也是当前事务），覆盖$Q$的值
    * 若$TS(T_n) > W(Q_n)$ ，则创建一个新的版本$Q_{n+1}$
>$TS(T_n) < W(Q_n)$在这里没有讨论，因为根据第一步的规定，这是不可能出现的，请思考为什么

## 快照隔离
快照隔离的思路是：事务都工作在对应的快照上，但是有可能会造成不一致的状态（优先图上存在环，无法串行化）。  