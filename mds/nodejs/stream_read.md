


学习`Readable`流的时候一直对`readable`和`data`的关系不是很清楚，经过搜索和阅读源码后算是理清一点点，现在总结如下。  

（[streamify-your-node-program
](https://github.com/zoubin/streamify-your-node-program)：这是目前为止我看到的最为全面细致的关于流的教程，强烈建议先阅读。）
# 预备知识



`read()`是`Readable`流的基石，无论流处于什么模式，只要是涉及读取数据最终都会转到`read()`上面来，它的主要功能是：
* 读取缓冲区数据并返回给消费者，并按需发射各种事件
* 按需调用`_read()`，`_read()`会从底层汲取数据，并填充缓冲区

它的流程大致如下：

![stream_read.jpg](/imgs/stream_read.jpg)

**务必记住`read()`是同步的，因此它并不是直接从底层数据那里读取数据，而是从缓冲区读取数据，而缓冲区的数据则是由`_read()`负责补充**，`_read()`可以是同步或者异步。  nodejs内部的实现经常会调用`read(0)`，因为参数是0所以不会破坏缓冲区中的数据和状态，但可以触发`_read()`来从底层汲取数据并填充缓冲区。  
`_read()`是流实现者需要重写的函数，它从底层汲取数据并填充缓冲区（flowing模式不会填充而是直接发送给消费者），它的大致流程如下：

![stream__read.jpg](/imgs/stream__read.jpg)

注意在`addChunk()`后会根据情况发射`readable`或者`data`事件，然后调用`read()`➞`_read(0)`➞...➞`addChunk()`从而形成一个循环，**因此一旦调用了`_read()`流就会默默在底层读取数据，直到数据都消耗完为止**。

# `readable`事件

文档上关于`readable`事件的描述如下
>事实上， 'readable' 事件表明流有了新的动态：要么是有了新的数据，要么是到了流的尾部。 对于前者， stream.read() 将返回可用的数据。而对于后者， stream.read() 将返回 null。

由此我们可以知道`readable`事件意味着：
* 流有了新的数据（**注意，这里只说明有了新数据，至于新数据如何读取是调用者自己的事情**）
* 流到达了尾部

你可以将下面的代码保存为test.js，修改`size`的值并运行，观察结果有何异同
```javascript
"use strict";
const size = 1; //将size设为1或undefined
const rs = require("fs").createReadStream("./test.js");
rs.on("readable", () => {
	console.log(rs.read(size));
});
```

总之，`readable`**只是负责通知用户流有了新的动态，事件发生的时候是否读取数据，如何读取数据则是调用者的事情**（如果一直不读取事件，则数据会存在于缓冲区中） 。 例如可以给`readable`注册一个回调函数，该回调函数调用无参的`read()`，它会读取并清空缓冲区的全部数据，这样就使得每次`readable`发生的时候都可以读取到最新的数据。   



## `readable`的触发时机

`readable`在以下几种情况会被触发：
* 在`onEofChunk`中，且`_read()`从底层汲取的数据为空。这个场景意味着**流中的数据已经全部消耗完**
* 在`addChunk()`中，且`_read()`从底层汲取的数据不为空且处于pause模式，这个场景意味着**流中有新数据**
* 在`read(n)`中，且n为0是的某些情况下（在测试过程中我一直无法触发这分支，不知道是对应哪种情况）。
* 通过`on()`为`readable`添加监听器，如果此时缓冲区有数据则会触发，这个场景意味着流中已经有数据可供`read()`直接调用。


# `data`事件
而`data`事件的意义则明确很多，文档上关于`readable`事件的描述如下（为了更加精确这里我们引用原文）
> The 'data' event is emitted whenever the stream is relinquishing ownership of a chunk of data to a consumer. 

与`readable`不同的是，`data`事件代表的意义清晰单一：流将数据交付给消费者时触发。并且会将对应的数据通过回调传递给用户。

## `data`的触发时机
从源码来看，有两个地方会触发`data`事件
* 在`read()`中，如果缓冲区此时有数据可以返回给调用者，这种情况只会在调用`pipe()`时候发生，如果`readable()`被暂停过并重新启动，此时缓冲区内残留的数据会通过`read()`读出然后借助`data`事件传递出去。
* 在`addChunk()`，此时`_read()`从底层汲取的数据不为空，且满足以下条件
	* 处于flowing模式
	* 缓冲区为空
	* 处于异步调用模式  

	在这种情况下，**数据直接就交付给消费者了，并没有在缓冲区缓存**

而文档中的说法是：
>当流转换到 flowing 模式时会触发该事件。调用**readable.pipe()， readable.resume() 方法，或为 'data' 事件添加回调可以将流转换到 flowing 模式**。 'data' 事件也会在调用 readable.read() 方法并有数据返回时触发。

似乎文档跟源码不太一致？其实调用`readable.pipe()`、`readable.resume()`或为 `data` 事件添加回调，**最终都会依次调用`read()` ➞ `_read()` ➞ `addChunk()`然后最终发射`data`事件**。

**结合`_read()`的流程图，可以知道通过`on()`为`readable`和`data`事件添加监听器后，程序就开始循环汲取底层数据直至消耗完为止**

# 同时监听`readable`和`data`会怎样？
```JavaScript
"use strict";
const rs = require("fs").createReadStream("./test.js");
rs.on("readable",()=>console.log("readable触发"));
rs.on("data",console.log);
```
程序输出如下:
```bash
node test.js
data触发 <Buffer 22 75 73 65 20 73 74 72 69 63 74 22 3b 0a 63 6f 6e 73 74 20 72 73 20 3d 20 72 65 71 75 69 72 65 28 22 66 73 22 29 2e 63 72 65 61 74 65 52 65 61 64 53 ... >
readable触发 null
```
似乎`readable`永远得不到数据？从上面的流程图我们知道，在`addChunk()`中当有新数据到来的时候，`redable`和`data`都有可能触发，那究竟触发哪个？看看`addChunk()`的源码
```javascript
function addChunk(stream, state, chunk, addToFront) {
  //处于flowing模式，且缓冲区为空，且为异步调用时候，触发data事件	
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    state.length += state.objectMode ? 1 : chunk.length;//更新缓冲区已有数据数量
    if (addToFront)
      state.buffer.unshift(chunk);//插入缓冲区头部
    else
      state.buffer.push(chunk);//插入缓冲区尾部

    if (state.needReadable)
      emitReadable(stream);//触发readable事件
  }
  maybeReadMore(stream, state);
}
```
由于为`data`事件添加回调会使得流进入flowing模式，**因此我们的例子中，有新数据时只会发射`data`事件，而`readable`事件则流结束的时候发射一次**。



# `pipe`的背压（back pressure）平衡机制
假设现在有一对`Readable`和`Writable`，要求编程实现从`Readable`里面读取数据然后写到`Writable`中。那么你面临的问题很有可能就是如果两者对数据的产生/消费速度不一致，那么需要手动协调两者速度使得任务可以完成。思路可能这样：
* 0、`Readable`进入flowing模式，然后进入步骤2
* 1，监听`data`事件，一旦有数据到达则进入步骤2，如果捕捉到`end`事件就结束任务
* 2，将数据写入到`Writable`，如果返回`true`进入步骤1，否则进入步骤3
* 3，`Readable`进入pause模式，并等待`Writable`发射`drain`事件
* 4，如果`Writable`发射了`drain`事件，则返回步骤1

而事实上`pipe()`的过程和上述很相似，它的源码如下：

```JavaScript
Readable.prototype.pipe = function(dest, pipeOpts) {
 //省略...
 var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);//当写操作返回false的时候，正常情况下必然会在稍后触发一个drain事件
  src.on('data', ondata);
  function ondata(chunk) {
    var ret = dest.write(chunk);
    if (ret === false) {//如果写操作的返回值为false，则暂停readable流
      if (((state.pipesCount === 1 && state.pipes === dest) ||
           (state.pipesCount > 1 && state.pipes.indexOf(dest) !== -1)) &&
          !cleanedUp) {
        state.awaitDrain++;
      }
      src.pause();
    }
  }
  //省略...
  return dest;
};


function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;//将流重新设为flowing模式
      flow(src);//将缓冲区中残留的数据读取并重新触发data事件
    }
  };
}
```

可以看到：
* 当向`dest`写入数据返回`false`时，马上调用`src.pause()`暂停流。**`src.pause()`将暂停事件流，但不会暂停数据生成，也就是说`src`此时依然汲取底层数据填充缓冲区，只是暂停发射`data`事件，等到缓冲区的数据量超过警戒线才会停止汲取**。  
* 因为写入数据返回`false`，因此在稍后的某个时候`dest`必然会发射`drain`事件。
* 当`drain`事件发生后，`src`再次进入flowing模式自动产生数据，同时将缓冲区中的残留数据写入`dest`

关于`pipe()`还可以参考这篇文章
[通过源码解析 Node.js 中导流（pipe）的实现 ](https://cnodejs.org/topic/56ba030271204e03637a3870)