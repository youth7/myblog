`stream.Writable`是node中非常重要的类，其中的`write()`更是重中之重，理解这个方法的工作流程使得我们碰到node中各种`Writable`对象的时候心里更有底

分析之前先上`write()`的流程图，这个图只保留了主干部分而省略了一些细节，我们从中要留意几个重要步骤的时机和条件，它们都用黄色部分标出
* 真正执行写操作
* 写请求（即用户调用`write()`或者`end()`发起一个写操作的请求）的缓存与执行
* 发射`drain`事件
* 运行用户的`callback`

![stream_write.jpeg](/imgs/stream_write.jpg)

# `writable()`

`writable()`定义在文件`lib/_stream_writable.js`中，对部分源码做出注释
```javascript
Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;//this._writableState是一个记录流内部状态的重要对象，我们稍后再分析它
  var ret = false;
  var isBuf = !state.objectMode && Stream._isUint8Array(chunk);//判断用户提供的数据类型是否为buffer
 
  if (isBuf && Object.getPrototypeOf(chunk) !== Buffer.prototype) {//转为node原生实现的buffer
    chunk = Stream._uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {//判断是否指定了编码类型
    cb = encoding;
    encoding = null;
  }

  if (isBuf)
    encoding = 'buffer';//如果用户写入的数据类型为buffer，则编码类型必须为"buffer"
  else if (!encoding)
    encoding = state.defaultEncoding;//如果没有编码类型，则设置为默认编码

  if (typeof cb !== 'function')//如果没有提供回调函数则使用默认的回调函数
    cb = nop;

  if (state.ending)
    writeAfterEnd(this, cb);//writeAfterEnd的逻辑非常简单，先发射错误事件然后异步执行回调
  else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;//等待执行的callback数量加1
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);//调用writeOrBuffer，由它决定是写入底层资源还是内部缓冲区
  }

  return ret;
};
```
`write()`首先对编码和用户传递过来的数据进行一些基本处理，然后观察自身状态。如果`state.ending`为真则抛出错误，否则进行下一步处理。从后面关于`writeState`的讨论我们可以知道`state.ending`为真的话意味着`end()`被调用但是尚未返回。正如文档上所说：
>在调用了 `stream.end()` 方法之后，再调用 `stream.write()` 方法将会导致错误。


需要注意的是，**写操作贯穿一系列的函数而不仅仅是当前函数，而其它函数也是由可能抛出错误的**。因此文档上说明：
>`writable.write()`方法向流中写入数据，并在数据处理完成后调用 `callback` 。如果有错误发生， `callback` **不一定**以这个错误作为第一个参数并被调用。要确保可靠地检测到写入错误，应该监听 `'error'` 事件。

# `writeOrBuffer()`

接下来看`writeOrBuffer()`，它的源码如下：
```JavaScript
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {//如果不是buffer类型，就根据编码解码
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;//处于对象模式的话则需要写入的数据长度为1，否则为chunk的长度

  state.length += len;//这个其实就是内部缓冲区的长度
  /**
  如果内部缓冲区的长度已经超过highWaterMark，则该次写操作会返回false，
  此时外部程序应该停止调用write()直到drain事件发生为止
  **/
  var ret = state.length < state.highWaterMark;
  if (!ret)
    state.needDrain = true;//说明缓冲区已经满，需要排空它

  if (state.writing || state.corked) {//如果处于写状态中或者调用了cork()，则把当前的写入请求先缓存起来，等到适当的时候再继续调用
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk,
      encoding,
      isBuf,
      callback: cb,
      next: null
    };
    if (last) {//如果链表不为空
      last.next = state.lastBufferedRequest;
    } else {//如果链表为空，则将这个写请求设为链表头部
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;//更新链表的长度
  } else {//否则开始写入
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }
  return ret;
}

```
`writeOrBuffer()`如其所名，根据当前的状态缓存写操作的请求或者直接进行写操作，如果有写操作正在执行或者调用了`cork()`，则把当前写请求缓存起来以供后用，否则调用`doWrite()`进行真正的写入。缓存起来的写操作在两种情况下可以得到执行：
* 调用`uncork()`的时候
* 调用`onWrite()的时候`，`onWrite()`作为回调函数传递给了需要用户实现的`_write()`和`_writev()`，因此当实现`Writable`流重写这两个方法的时候，当操作完成之后，无论成功失败，**务必记得调用`onWrite()`**。我看了一下`fs.write()`，确实在写入完成之后有调用它们。  

至于`uncork()`和`onWrite()`的调用时机我们下面再分析。

# `doWrite()`
```JavaScript
function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;//需要写入的数据长度
  state.writecb = cb;//用户提供的回调
  state.writing = true;//标记正在进行写入
  state.sync = true;//是否同步调用
  if (writev)//_writev是批量写入数据，如果有就优先调用之
    stream._writev(chunk, state.onwrite);
  else//否则调用默认的版本
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}
```
`doWrite()`调用`stream._writev`和`stream._write`真正执行写操作，这两个函数都是实现者负责提供的。`doWrite()`中设置了`state.writing = true`，这意味着后续的请求都会缓存起来。同时还设置了`state.sync=true`，意味着同步调用，这个设置项很有意思，在源码中的其它地方我们看到这样的注释：
>   defer the callback if we are being called synchronously to avoid piling up things on the stack

说明如果在同步模式下，用户的回调是需要异步执行，这是为了防止在栈上保存过多的信息。而异步情况下则没有这个限制，关于这样缘由不是十分清楚。

# 关于`_writableState`
`_writableState`是一个记录流内部状态的对象，在各个地方都会用到，在研究`onWrite()`等函数前需要先理解这个对象各个属性代表的意思
```
function WritableState(options, stream) {
  options = options || {};
  /*
  Duplex streams可以进行读和写，但是它内部共享一个option。
  在一些情况下要求读和写都需要设置option.XXXX属性的值。此时可以使用
  option.readableXXX 和 option.writableXXX来实现
  */
  var isDuplex = stream instanceof Stream.Duplex;

  this.objectMode = !!options.objectMode;

  if (isDuplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex);  
  this.finalCalled = false;//_final()是否已经被调用  
  this.needDrain = false;// 是否需要发射drain事件 
  this.ending = false; // end()正在被调用 
  this.ended = false; // end()调用完毕返回 
  this.finished = false; //是否已经发射finish事件  
  this.destroyed = false;// 流是否已经被销毁
  /*
  字符串在传递给_write()时候是否先解码为buffer，一些node内部的流能通过这个属性在程序的底层进行优化
  */
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;
  this.defaultEncoding = options.defaultEncoding || 'utf8';//默认编码
  /**
  缓冲区的长度，
  流的内部其实并没有维护一个真正的缓冲区，只是用了一个变量记录等待写入底层文件或者socket的数据的数量
  **/
  this.length = 0; 
  this.writing = false;//是否正在进行写操作
  this.corked = 0;//如果这个值为true，则所有的写操作请求都会被缓存直至调用了uncork()
  /*是否异步调用用户提供的callback，这个值为true的时候意味着需要异步调用用户的callback
  */
  this.sync = true;  
  this.bufferProcessing = false;//是否正在处理之前被缓冲下来的写请求  
  this.onwrite = onwrite.bind(undefined, stream);// 内部的回调，传递给 _write(chunk,cb)的回调函数
  
  this.writecb = null;// 用户的回调，传递给write(chunk,encoding,cb)  
  this.writelen = 0;// 调用_write()时候需要写入的数据的长度
  this.bufferedRequest = null;//被缓存的写请求的链表的表头
  this.lastBufferedRequest = null;//上一个被缓存的写请求
  this.pendingcb = 0;//等待被执行的用户回调函数数量，在发射finish事件的时候必须为0
  this.prefinished = false;//与同步的Transform streams相关，如果等待被执行的函数只剩下传递给_write的回调，则发射之  
  this.errorEmitted = false;//如果error事件已经发射，不应该再抛出错误  
  this.bufferedRequestCount = 0;// 链表长度
  //初始化第一个CorkedRequest，总是有一个CorkedRequest可以使用，并且内部最多维护两个CorkedRequest
  var corkReq = { next: null, entry: null, finish: undefined };
  corkReq.finish = onCorkedFinish.bind(undefined, corkReq, this);
  this.corkedRequestsFree = corkReq;
}
```
从上面可以看到，**文档中所谓的`writable`流内部有一个缓冲区其实是并不存在的，流内部只是维护了一个变量，用来记录即将写入的数据的数量，如果这个数量小于`writableHighWaterMark`，则缓存这个写请求**。因此文档中说了即使超出缓冲区大小也依然可以写是可以理解的。了解了这些状态的意义之后我们可以来看传递给`_write()`的`state.onwrite`是如何利用`_writableState`的状态进行操作

# `onwrite()`
`onwrite()`的主要功能是真实的写操作完成之后用来收尾，包括执行缓冲区中的写请求和更新流内部的状态。例如在`fs.write()`中可以看到`onwrite()`就是作为回调在执行的
```javascript
WriteStream.prototype._write = function(data, encoding, cb) {
  //省略...
  fs.write(this.fd, data, 0, data.length, this.pos, (er, bytes) => {
    if (er) {
      if (this.autoClose) {
        this.destroy();
      }
      return cb(er);
    }
    this.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined)
    this.pos += data.length;
};
```

```JavaScript
function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;//用户的callback，见上面_writeState的解释

  onwriteStateUpdate(state);//更新流内部的状态，更新之后意味着当前的写操作已经完成

  if (er)//如果_write操作发生任何错误则抛出异常，注意这个异常可能不是最原始的异常，见上面所描述
    onwriteError(stream, state, sync, er, cb);
  else {
    // 检查是否可以结束这个写操作了
    var finished = needFinish(state);

    if (!finished &&//不能处于finished状态
        !state.corked &&//不能处于corked状态
        !state.bufferProcessing &&//没有缓存的写操作正在被执行
        state.bufferedRequest) {//缓冲区不能为空
      clearBuffer(stream, state);
    }

    if (sync) {//如果是同步调用，则需要异步调用用户的callback，以防止往栈上堆积东西
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}
```
其中`onwriteStateUpdate()`对流的各种状态进行了更新，包括以下几项：
```JavaScript
function onwriteStateUpdate(state) {
  state.writing = false;//意味当前的写操作已经结束
  state.writecb = null;//清空用户提供的callback
  state.length -= state.writelen;//修改缓冲区长度
  state.writelen = 0;
}
```
可以看出`onwriteStateUpdate()`后意味着**当前这个写操作已经完成**。而`needFinish(state)`的判断标准如下：
```javascript
function needFinish(state) {
  return (state.ending &&//调用了end
          state.length === 0 &&//缓冲区为空
          state.bufferedRequest === null &&//没有缓存的写操作
          !state.finished &&//finished的状态还不是true
          !state.writing);//不是正处于写操作中
}
```
它意味着**当前写操作已经完成，并且缓冲区中的写操作也已经全部完成**。


总结起来就是**当`onwrite()`执行了真正的写入操作后，再去执行缓冲区中积压着的其它写请求**。综上所述可以推论
* 如果一次写操作没有完成，则剩下的写操作都会被缓存起来
* 一旦有一项写操作完成，则会取出缓冲区中剩余的写操作并执行它们。

# `afterWrite()`
`afterWrite()`是主干流程上最后一个重要的步骤了，它负责发射`drain`事件，通知调用者可以继续写入并且调用用户提供的`callback`
```JavaScript
function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);//如果不是处于finished状态，就发射drain事件
  state.pendingcb--;
  cb();//执行用户的callback
  finishMaybe(stream, state);//其它处理细节
}

function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    //如果缓冲区曾经超过警戒线，但是现在已经为空，就可以发射drain事件
    state.needDrain = false;
    stream.emit('drain');
  }
}
```