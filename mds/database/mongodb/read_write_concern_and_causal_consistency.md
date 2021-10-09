# write concern

https://docs.mongodb.com/manual/reference/read-concern/#readconcern-support

`write concern`的意义：当client向单一的mongod、复制集、分片集写入数据的时候，控制mongodb对client写操作的响应级别（` level of acknowledgment`）。例如写操作写入多少个节点算成功，是否写入磁盘日志，超时时间）

有一个问题：

对于一个节点，当w为majority的时候，何时将自己最新写入的数据设为majority，需要分单例、复制集、分片集3种情况讨论。

写操作的响应有两种类型

* primary响应client
* secondary响应primary

现在有点疑问的是第二个，从read concern的时序图来看，只有过半数的secondary响应primary后，primary才会响应client。而secondary响应primary的时候是什么状态貌似有点模糊。从上下文推断，此时需要搞清楚两个相互独立的**知识点**

* secondary响应primary时候的状态，应该是由write concern来确定的。对于单个secondary来说，即根据j的属性确定的，即是否日志落盘。
* 日志落盘之后确定了这个写操作的数据即使奔溃了也不会丢失。然而此时secondary根据mvcc，是有多个版本的数据的，包括local、available、majority，最新的数据可能处于local状态，而处于majority状态的数据可能是上一次写的结果。可以对比不同的read concern下的时序图中secondary节点对write0的可见性来确定这一点。同时需要留意，无论哪种read concern，都需要等到t6之后才使得整个集群的所有节点都能看到write0。

# read concern

`read concern`的意义：在分布式环境下，给用户自己去权衡一致性和可用性（例如，是牺牲可用性去获取强一致性还是降低一致性去加强可用性）。

https://docs.mongodb.com/manual/reference/write-concern/#write-concern-specification



# causal consistency（因果一致性）

https://docs.mongodb.com/manual/core/read-isolation-consistency-recency/#std-label-causal-consistency

* 什么是因果一致性session
  * 里面所有**相关的读写操作（下面简称关联操作）**（意味着不是session中的所有操作）的属性都是majority
  * 单线程
* 因果一致性session的工作步骤
  * client开启一个session，session属性如上描述
  * 因为步骤1的原因，client记录了当前这个session发起的关联操作的信息
  * 对于这些关联操作，mongodb返回它们的操作时间以及集群的时间，client会跟踪这些信息。
* 它能提供的四种因果一致性
  * Read your writes
  * Monotonic reads
  * Monotonic writes
  * Writes follow reads
* 跟当前session相关的其它session也能使用这两个时间字段
  * 这意味着对数据库的读写操作能够在不同的session之间实现因果一致性，这是session通过对自身操作的时间字段修改实现的。简单来说，通过修改时间字段，一系列对数据的操作能够实现因果一致性，这在官方的items例子中表现得非常直白。
* 因果一致性session的Read Preference
  * These guarantees hold across all members of the MongoDB deployment。即无论读集群中的谁，都具备因果一致性。
* 因果一致性session的隔离等级
  * 因果一致性session是不会跟别的session隔离出来的，也就是说因果一致性session能够观察到其它session的写操作结果。







# 它们之间的关系

https://docs.mongodb.com/manual/core/causal-consistency-read-write-concerns/





https://www.jianshu.com/p/21565744ada6