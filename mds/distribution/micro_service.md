# 1 微服务架构的模式语言

# 2 拆分策略

# 3 进程通讯

## 同步通讯

### 消息格式：

**基于文本的消息**：

优点：

* 自描述的，可读性高
* 当消息需要修改的时候，兼容性好，
* 需要额外的schema来定义消息的结构（无论是xml还是json都需要）

缺点：

* 冗长，效率低



**基于二进制的消息**：

必须采用API优先的方式进行设计，有两种对消息中的字段进行标记的方法

* tagged fields，例如Protocol Buffers
* 固定格式，例如Avro





###  REST 和 gRPC

* REST优缺点

* gRPC优缺点



**两个经典问题：**

Why is gRPC better than any binary blob over HTTP/2?

>  This is largely what gRPC is on the wire. However gRPC is also a set  of libraries that will provide higher-level features consistently across platforms that common HTTP libraries typically do not. Examples of such features include:
> - interaction with flow-control at the application layer
> - cascading call-cancellation
> - load balancing & failover



Why is gRPC better/worse than REST?

> gRPC largely follows HTTP semantics over HTTP/2 but we explicitly allow  for full-duplex streaming. We diverge from typical REST conventions as  we use static paths for performance reasons during call dispatch as  parsing call parameters from paths, query parameters and payload body  adds latency and complexity. We have also formalized a set of errors  that we believe are more directly applicable to API use cases than the  HTTP status codes.



https://grpc.io/docs/what-is-grpc/faq/



### 服务发现

* 应用层服务发现

  包含两个模式：客户端发现 + 服务自注册（弊端是不同类型的客户端需要自己编写相同逻辑的代码，例如java和go客户端都要编写类似的代码去访问同一个后端服务）

* 平台服务层发现模式

  包含两个模式：服务端发现 + 第三方（平台）注册（弊端是依赖于部署平台，例如k8s）



## 异步通讯

异步通讯的基本元素，服务通过向通道写入/读取消息进行通讯，而不是俩俩之间直接通讯

* 通道（包括点对点的通道，发布-订阅的通道（其实我觉得没必要过于强调这个））
* 消息（类型为：命令、事件、文档）

有无代理的架构和基于代理的架构两种工作方式，绝大多数情况下我们都是使用后者。



### 重复消息的处理原则

* 编写幂等消息处理器
* 客户端自己查重并保证顺序

### 事务性消息

在某些时候，数据库更新与消息的发送必须是原子操作，这种场景的解决方案有：

* 使用分布式事务控制器（并不是所有的消息中间件都支持分布式事务）
* 如果使用关系型数据库的话，可以使用**事务性发件箱模式**来处理这个问题。
  * ·轮询outbox表（记录了需要发送的消息的表）
  * 拖尾事务日志，即发送数据库日志，例如mongodb的change stream。

### 使用异步消息提高可用性

只要服务使用同步协议进行通讯，就可能降低应用程序的可用性

消除同步消息的一些方法：

* 所有服务之间改为异步通讯：弊端是一些外部的第三方服务可能只提供同步通讯的接口。
* 复制数据：把另外一个微服务的数据库的数据同步过来，这样就不需要调用它们的服务了，然而这无法解决使用它们数据时需要同时更新它们数据的问题；同时因为数据巨大使得复制对方的数据成为不可能。
* 先本地返回响应，再异步完成后续的处理：这个本地返回的响应只是说明了请求的操作只是完成了一小部分，因为client想要知道这个操作是否彻底完成了，需要不断轮询，又或者服务主动给client推消息。但是无论哪一种都增加client实现的复杂性





# 4 事务管理

其实关于这个章节的内容主要可以归纳为两部分内容：

* 分布式事务的类型（https://segmentfault.com/a/1190000040321750）
  * XA、2PC事务：
  * TCC事务
  * Saga事务
  
  整体来看分为刚性事务和补偿性事务两种，刚性事务依赖于RM的事务机制。补偿事务将长事务分解为多个本地事务，然后通过类似Saga的机制执行。从这个角度来看，TCC确实可以形容成应用层的2PC。
* 事务并发控制的方法（https://draveness.me/database-concurrency-control/）
  * 锁
  * 时间戳
  * 基于有效性（CAS？）
  * mvcc

### 传统的分布式事务

传统的分布式事务不适合分布式系统，原因是：

* 同步通讯降低了系统的并发能力，而XA事务就是基于同步通讯的
* 不是所有的微服务组件都支持XA协议

### Saga事务

Saga事务的优点是提高了系统的效率，弊端是没有隔离性，需要通过某种并发控制机制去做并发控制，例如：

* 语义锁
* 交互式更新
* 悲观视图
* 重复值
* 版本文件
* 业务风险评级

### 一些其它问题

2pc 和 tcc的不同之处：

* [分布式柔性事务的TCC方案（包含了对tcc vs 2pc）](https://zhuanlan.zhihu.com/p/148747139)

  > 1、2PC的操作对象在于资源层，对于开发人员无感知；而TCC的操作在于业务层，具有较高开发成本。

  > 2、2PC是一个整体的长事务，也是刚性事务；而TCC是一组的本地短事务，是柔性事务。

  > 3、2PC的Prepare(表决阶段)进行了操作表决；而TCC的try并没有表决准备，直接兼备资源操作与准备能力

  > 4、2PC是全局锁定资源，所有参与者阻塞 交互等待TM通知；而TCC的资源锁定在于Try操作，业务方可以灵活选择业务资源的锁定粒度

* [TCC事务机制简介（非常重要）](https://www.bytesoft.org/tcc-intro/)

  * > TCC事务机制相对于传统事务机制（X/Open XA Two-Phase-Commit），**其特征在于它不依赖资源管理器(RM)对XA的支持**，而是通过对（由业务系统提供的）业务逻辑的调度来实现分布式事务。 

  





# 5 逻辑设计

# 6 事件溯源

# 7 实现查询

