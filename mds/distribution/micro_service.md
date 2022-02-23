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

服务的注册和发现可以参考腾讯技术功能的：[深入了解服务注册与发现](https://zhuanlan.zhihu.com/p/161277955)

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
  * 刚性事务：由XA、2PC、3PC为代表的事务
  * 补偿性事务：例如Saga、TCC
  
  整体来看分为刚性事务和补偿性事务两种，刚性事务依赖于RM的事务机制，作用于**数据层**。
  
  而补偿事务将长事务分解为多个本地事务，然后通过类似Saga的补偿机制执行。补偿事务是**应用层的事务**，优点是在`long-run`的事务中能够提高吞吐，这是通过牺牲隔离性换来的。
  
* 事务并发控制的方法（https://draveness.me/database-concurrency-control/）
  * 锁
  * 时间戳
  * 基于有效性检查（CAS？）
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

## API组合器

优点：

缺点：

	* 增加额外的开销。与单体应用相比，它需要调用多个服务提供的API
	* 可用性降低的风险。因为依赖多个其它服务
	* 缺乏事务的一致性（**重点**）
	* 无法支持需要*大规模的数据内存连接的查询



## CQRS

# 8 外部API设计

## 谁在使用API

* 基于原生的移动端
* web应用程序（内网）
* 浏览器
* 其它第三方应用程序

## 模式

### client直接请求服务的API

这个的弊端是：

* 用户体验差：如果client需要依次请求多个API，会因为巨大的延迟而导致糟糕的用户体验（在移动网络下尤其明显）
* 缺乏封装：client的编写依赖于服务端，client需要了解服务端的业务流程，同时一旦服务端有了不兼容的修改（例如微服务拆分）时，client必须同时修改。
* 服务端可能使用对client不友好的通讯机制：例如服务端使用gRPC或者AMQP等非HTTP协议时候，client不好对接，甚至服务端的API都无法穿透防火墙。



### API Gateway模式

**主要职责**：

* **请求路由（非常重要）**：
* **API组合（非常重要）**：
* 协议转换
* 为不同类型的客户端提供专用的API
* **实现边缘功能，包括**：
  * 身份验证、授权
  * 速率限制
  * 缓存 
  * 指标收集
  * 请求日志

**注意：网关代理的是南北流量，网格代理的是东西流量，两者是不同的！严格来说它们是两种不同职责的模块，但是目前的趋势是Gateway和Service Mesh都相互集成对方的功能，例如Kong官网号称的下一代网关就集成Service Mesh（[What is the Purpose of an API Gateway? - konghq.com](https://konghq.com/learning-center/api-gateway/)）**

可以参考一下：

* [《万字长文梳理：从0开始，步入Service Mesh微服务架构的世界》](https://mp.weixin.qq.com/s?__biz=Mzg4MjYzMjI1MA==&mid=2247517557&idx=1&sn=e8d578e356706828228ff68e1be63bc5&source=41#wechat_redirect) 
* [《为什么在使用了 Kubernetes 后你可能还需要 Istio》](https://jimmysong.io/blog/why-do-you-need-istio-when-you-already-have-kubernetes/)
* [服务网格与 API 网关的关系](https://jimmysong.io/kubernetes-handbook/usecases/service-mesh-vs-api-gateway.html)

## API Gateway的架构

API Gateway可以分为两层：

* API层：为各种不同类型的客户端提供专用API
* 公共层：



## API Gateway的所有者

* BFF
* 客户端开发针对自身的API并集成到API Gateway项目中，API Gateway的拥有者负责运维它。



## API Gateway的优缺点

