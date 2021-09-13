# 关于几种缓存模式的简介
常见的缓存数据访问策略有 5 种：

- Cache-aside/Lazy loading：预留缓存
- Read-through/Write-through：直写式
- Write-behind/Write-back：回写式
- Write-around：绕写式
- Refresh-ahead：刷新式



## Cache Aside/Lazy loading

* 预留缓存模式下，缓存与数据库之间没有直接关系（缓存位于一旁，所以叫 Cache-aside），**由应用程序将需要的数据从数据库中读出并填充到缓存中**

* 数据请求优先走缓存，未命中缓存时才查库，并把结果缓存起来，所以缓存是按需的（Lazy loading），只有实际访问过的数据才会被缓存起来

### 缓存读取
* 缓存命中，直接返回缓存数据；
* 缓存未命中，从数据库加载数据，更新缓存；
### 缓存更新

* 先更新数据库，然后**删除**缓存（原因？）

> 为什么不是写完数据库后更新缓存？你可以看一下Quora上的这个问答《[Why  does Facebook use delete to remove the key-value pair in Memcached  instead of updating the Memcached during write request to the backend?](https://www.quora.com/Why-does-Facebook-use-delete-to-remove-the-key-value-pair-in-Memcached-instead-of-updating-the-Memcached-during-write-request-to-the-backend)》，主要是怕两个并发的写操作导致脏数据。可以想象两个写操作交织一起的情况，其中早来的写操作完全包裹住晚来的写操作，从而导致覆盖晚来的写操作的更新，但是用delete就能避免这种问题。如下图：

![](http://assets.processon.com/chart_image/5ceb8fa0e4b078e7ea8f78aa.png)

### 可能引发的数据不一致
在读写并发的时候，读请求穿插在写请求的不同阶段，使得有两种不一致的情况，注意没有写写冲突，因为不会直接设置缓存
* 读写冲突，读到旧数据，并设置旧数据为缓存

  ![](https://img-blog.csdnimg.cn/2020062411251064.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3lhbmdndW9zYg==,size_16,color_FFFFFF,t_70#pic_center)

* 读写冲突，读到旧数据，并设置旧数据为缓存

  ![在这里插入图片描述](https://img-blog.csdnimg.cn/20200624112601521.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3lhbmdndW9zYg==,size_16,color_FFFFFF,t_70#pic_center) 

### 总结

* 优点：是较为稳健的方式，只有极低的几率造成严重的数据不一致。
* 缺点：编程模型不够简单，需要dev手动控制整个流程，dev面向的是两个不同的数据源。







## Read/Write Through

一种缓存方案必然伴随这读和写两种情况，因此把这两个结合起来作为一种模式。

### 缓存读取

- 缓存命中，直接返回缓存数据；
- 缓存未命中，从数据库加载数据，更新缓存，这一过程是同步的（注意这一步不是调用者发起的，而是缓存系统自动完成的，dev完全感受不到后面有db的存在）

### 缓存更新

* 先更新数据库，然后**更新**缓存；

### 可能引发的数据不一致

在读写并发的时候，读请求穿插在写请求的不同阶段，使得有两种不一致的情况

* 读写冲突，新数据被覆盖

  ![在这里插入图片描述](https://img-blog.csdnimg.cn/20200624141144511.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3lhbmdndW9zYg==,size_16,color_FFFFFF,t_70#pic_center)

* 写写冲突，新数据被覆盖

  ![在这里插入图片描述](https://img-blog.csdnimg.cn/20200624141514422.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3lhbmdndW9zYg==,size_16,color_FFFFFF,t_70#pic_center)

  

### 总结

* 优点：模型简单，dev只需面对单一的数据源
* 缺点：不一致的概率优点高？



## Write Behind Caching

### 缓存读取

同read through

### 缓存更新

同read through，**但是更新db的那一步是异步的**

### 可能引发的数据不一致

因为异步的原因，数据一致性的问题会被放大和诺

### 总结

优点：写操作快速无比

缺点：不一致的缺点放大，且实现复杂

## Refresh-ahead

略

## Write-around

略


# 一些常见的缓存问题
## 雪崩

当某一时刻发生**大规模的缓存失效**的情况，会有大量的请求进来直接打到DB上面。

解决方案：

* 在批量往cache存数据的时候，把每个Key的失效时间都加个随机值，这样可以保证数据不会在同一时间大面积失效



## 穿透

用户不断发起请求**缓存和数据库中都没有**的数据

解决方案：

* 接口层增加校验：不是所有数据都一定能在这里校验
* 当db和cache中都不存在该key时，在cache中设置该key为null，同时附上过期时间，这种方案可能会造成一段时间内的数据不一致
* bloom filter：
* 限制访问IP（黑名单）：不是原生方案，治标不治本



## 击穿

缓存击穿是指一个Key非常热点，在不停的扛着大并发，大并发集中对这一个点进行访问，当这个Key在失效的瞬间，持续的大并发就穿破缓存，直接请求数据库。

解决方案：

* 设置热点数据永不过期，或者动态延长热点数据的过期时间

# 总结
* 所有的异常情况，都是源于并发读写的时候，缓存的更新+数据库的更新不是一个原子操作，使得在更新过程中的中间状态被其它操作观察/修改了。可以对比数据库并发读写时候出现的几种异常情况：https://en.wikipedia.org/wiki/Isolation_(database_systems)
* 所有的方案都是一种取舍，在一致性、效率之间做权衡。
	* 如果想要获得较强的一致性，则可以使用分布式事务进行控制，代价是降低吞吐率
	* 如果想要提高效率，则需要容忍可能发生的数据不一致的情况
# 参考
[https://coolshell.cn/articles/17416.html](https://coolshell.cn/articles/17416.html)  
[https://blog.csdn.net/yangguosb/article/details/106940229](https://blog.csdn.net/yangguosb/article/details/106940229)  
[https://segmentfault.com/a/1190000037509415](https://segmentfault.com/a/1190000037509415)  
http://www.ayqy.net/blog/caching/

