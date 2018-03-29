


在以下几种种情况，nodejs需要新开子进程来进行相关操作
* 长时间耗费CPU的操作，这个大家都懂，防止进程卡在一处以致后续的请求得不到响应。
* 执行外部程序，如`tar`、`gcc`等
* 提高处理效率，某些任务可以分解成多个并行的小任务，然后再汇总一起。

nodejs中使用`child_process`模块来对子进程进行生成、管理和通讯。网上关于这一块的介绍也不少，但是其中的细节感觉还是语焉不详，这里我们主要讨论3个问题（基于Linux平台）：
* `spawn`、`exec`、`execFile`和`fork`的区别
* 底层如何生存子进程
* 父进程和子进程之间的IPC通讯究竟是怎样


# `spawn`、`exec`、`execFile`和`fork` 
它们之间的调用关系如下
```javascript
exec 
  │
execFile         fork
  │               │     
  └─────spawn─────┘          用户层面
          │
----------│------------------------
          │
          │                  nodejs内部
          │                   
     spawn(位于lib/internal/child_process.js)
```
从上图可易知：
* 在用户层面，其它3个函数最终都是调用`child_process.spawn`
* exec调用了execFile，因此它们的性态应该是一样的（缓存了IO）

接下来我们依次讨论一下这几个函数。

## spawn
spawn的用法文档上已经写得很清晰，我们这里讨论值得关注的地方
### 关于子进程的stdio(标准输入输出)
通过修改`options.stdio`，可以将子进程的stdio可以绑定到不同的地方。`options.stdio`可以接受两种类型的值：字符串或者数组

* 当`options.stdio`的值是字符串时，它有以下几种取值
	* `pipe` ： 相当于["pipe","pipe","pipe"]，子进程的stdio与父进程的stdio通过管道连接起来，
	* `ignore` ： 相当于["ignore","ignore","ignore"]，子进程的stdio绑定到`/dev/null`，丢弃数据的输入输出
	* `inherit` ： 继承于父进程的相关stdio、即等同于`[process.stdin, process.stdout, process.stderr]`或者`[0,1,2]`，此时父子进程的stdio都是绑定到同一个地方。


* 当`options.stdio`的值是数组的时候，前三个元素分别代表stdin stdout stderr。**如果数组的元素大于3，则会在父子进程之间建立 *额外的通讯通道***，它们的值可以是下面的其中之一

	* `pipe`：*额外的通讯通道* 通过管道通讯。管道的两端分别连接着父子进程，在父进程这边可以通过`subprocess.stdio[n]（n=0、1、2）`或者`subprocess.stdin, subprocess.stdout, subprocess.stderr`来引用管道的一端，而子进程则可以通过`process.stdin, process.stdout, process.stderr`来引用另外一端，详情可以见面的例子。
	* `ipc`：*额外的通讯通道* 通过ipc channel通讯
	* `ignore`：绑定到`/dev/null`，即丢弃数据的输入输出
	* `Stream`对象：*额外的通讯通道* 通过nodejs中`Stream` 对象通讯，对象底层的文件描述符代表一个文件例如socket，tty、本地文件等。
	* 正整数：和`Stream`相似。
	* `null`和`undefined`：对于前3个元素，它们会被设为`pipe`，对于剩下的元素会被设置`ignore`


以下的例子，它将stdio绑定到不同的地方
```javascript
"use strict";
const child_process = require("child_process");
const script = (function(data) {
  console.log(data);
}).toString();
child_process.spawn("node", ["-e", `( ${script}("inherit，这一般个会写到控制台") )`], {
  //子进程的stdio继承父进程的stdio，即控制台，因此会输出到控制台
  stdio: [process.stdin, process.stdout, process.stderr]
});

const fd = require("fs").openSync("./node.log", "w+");
child_process.spawn("node", ["-e", `( ${script}("整数fd，这一般个会写到某个文件") )`], {
  //stdio绑定到文件描述符fd，它代表文件node.log，因此会输出到该文件
  stdio: [process.stdin, fd, fd]
});

const writableStream = require("fs").createWriteStream("./node.log", {
  flags: "a",
  fd: fd
});
child_process.spawn("node", ["-e", `( ${script}("stream，这一般个会写到某个文件") )`], {
  //输出到流所代表的目的地，注意这个流必须要有文件描述符，否则会失败
  //这个例子中它会输出到文件node.log
  stdio: [process.stdin, writableStream, fd]
});
const script2 = (function(data) {
  console.log(data);
  process.stdout.end("hello");
}).toString();
const node = child_process.spawn("node", ["-e", `( ${script2}("pipe，只能通过父进程将它输出") )`], {
  //子进程的stdio绑定到父进程的
  stdio: ["pipe", "pipe", "pipe"]
});
node.stdout.on("data", function(data) {
  //注意此时子进程的输出全都通过管道传递到父进程，注意这种方式和"inherit"的区别
  console.log(String(data));
});
```
看文档时候我发现一个例子
```JavaScript
// Open an extra fd=4, to interact with programs presenting a
// startd-style interface.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```
从`stdio`的值来看父子进程之间建立了额外的ipc通道，父进程可以很容易引用这些额外的ipc通道，但是我找了很久都没有发现**子进程那边是如何使用这些额外的ipc通道**，希望有大牛能告之。

### detached和守护进程
生成子进程的时候如果传递了`detached=true`，则效果是使得子进程成为新的session和group的leader，效果和[SETSID(2)](http://man7.org/linux/man-pages/man2/setsid.2.html)是类似的。但也是仅此而已了，它和守护进程并没有明显的关联，文档中特别指出
>Note that child processes may continue running after the parent exits regardless of whether they are detached or not

说明子进程是可以继续运行下去的，**无论`detached=true`是否被设置**，例如
```JavaScript
"use strict";
const child_process = require("child_process");
child_process.spawn("ping", ["localhost"]);
setTimeout(function() {console.log("hello");}, 3000);
process.exit();
```
将上述代码保存到文件`test.js`，然后从命令行运行`node test.js`，则有以下输出
```bash
[chris@localhost node]$ node test.js 
[chris@localhost node]$ ps -ef | grep -E 'ping|node'
root       621     1  0 Mar03 ?        00:00:00 /usr/sbin/mcelog --ignorenodev --daemon --foreground
chris     6364     1  0 04:01 pts/0    00:00:00 ping localhost
chris     6366  5514  0 04:01 pts/0    00:00:00 grep --color=auto -E ping|node

```
父进程启动`ping`后就立即使用`process.exit()`强行退出，这使得`ping`成为孤儿进程并被`init`进程（进程id为1）收养，从而使得`ping`能够继续在后台运行，注意此时并没有设置`detached=true`，此时即使你退出终端`ping`命令依然在后台继续进程（有点像守护进程？）。  
不过这种方法是有缺陷的，因为是强行退出的，父进程event loop中的内容尚未执行完退出了，我们需要一种优雅安全的退出方法。  

首先删掉`process.exit()`并设置`detached=true`（**如果不设置的话子进程在父进程结束后也会跟着结束**）
```JavaScript
"use strict";
const child_process = require("child_process");
child_process.spawn("ping", ["localhost"], {detached:true});
setTimeout(function() {console.log("hello");}, 3000);
```
此时`setTimeout`的回调可以得到执行，但是父进程会等待子进程退出，用`ctrl+c
`结束父进程后子进程依然存活，并且被`init`进程收养。因为文档中说明：
>By default, the parent will wait for the detached child to exit. To prevent the parent from waiting for a given subprocess, use the subprocess.unref() method

默认情况下父进程会等待已经分离的子进程，可以调用`subprocess.unref()`来取消等待。于是按照要求加上相关代码
```JavaScript
"use strict";
const child_process = require("child_process");
const ping = child_process.spawn("ping", ["localhost"],{detached : true});
ping.unref();
setTimeout(function() {console.log("hello");}, 3000);
```
还是不行，父进程依然会等待子进程，再次查阅文档，原来还漏看了一句
>unless there is an established IPC channel between the child and parent.

如果父子进程之间建立了的ipc，父进程还是会等待。根据我们上面的总结，推论将`stdio`设置为`ignore`、描述符、`Stream`对象应该可以让父进程不再等待。
```javascript
"use strict";
const fd = require("fs").openSync("./node.log", "w+");
const writableStream = require("fs").createWriteStream("./node.log", {
	flags: "a",
	fd: fd
});
const child_process = require("child_process");
const ping = child_process.spawn("ping", ["localhost"], {
	detached: true,
	stdio: ["ignore", fd, writableStream]
});
ping.unref();
setTimeout(function() {
	console.log("hello");
}, 3000);
```
这次可以了，父进程在运行完自己的代码之后顺利退出，而子进程则继续在后台运行，同时被`init`进程收养

总结：要想让程序成为守护进程，必须要做到
* 子进程必须要和父进程分离，即设置`detached=true`
* 子进程要调用`unref()`
* 子进程的io不能跟父进程有联系

## `exec`和`execFile`
先来看看`exec`的源码
```javascript
function normalizeExecArgs(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  // Make a shallow copy so we don't clobber the user's options object.
  options = Object.assign({}, options);
  //如果指定了shell，则把它传递下去，否则将它设为true
  options.shell = typeof options.shell === 'string' ? options.shell : true;

  return {
    file: command,
    options: options,
    callback: callback
  };
}

exports.exec = function(command /*, options, callback*/) {
  var opts = normalizeExecArgs.apply(null, arguments);
  //其实就是简单调用execFIle
  return exports.execFile(opts.file,
                          opts.options,
                          opts.callback);
};
```
原来就是调用`execFile`，那么无需多言直接看`execFile`就可以了，值得一提的是文档中说`exec`会开启一个shell来执行命令，在代码中的体现是把`options.shell`设置为`true`，后续的函数根据这个来属性来决定是否开启一个shell执行命令。  

再来看看`exec`的源码的关键部分
```JavaScript
exports.execFile = function(file /*, args, options, callback*/) {
 //......	
 //直接调用spawn，但是传入了一些选项
  var child = spawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    uid: options.uid,
    shell: options.shell,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments
  });

  //......
  //调用完spawn之后会缓存子进程的stdout和stderr
  if (child.stdout) {
    if (encoding)
      child.stdout.setEncoding(encoding);//如果不是buffer类型，则是指编码

    child.stdout.on('data', function onChildStdout(chunk) {
    	//如果是buffer类型，则加上收到的字节数，否则，加上收到的字符串
      stdoutLen += encoding ? Buffer.byteLength(chunk, encoding) : chunk.length;

      if (stdoutLen > options.maxBuffer) {//判断是否超出内部的buffer，如果你的子进程的输出很大，请注意调整这个参数
        ex = new errors.RangeError('ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
                                   'stdout');
        kill();
      } else if (encoding) {
        _stdout += chunk;//缓存字符串
      } else {
        _stdout.push(chunk);//缓存buffer
      }
    });
  }
  //......
  //监听子进程io流的关闭和子进程的错误，用户提供的callback会在这里被调用
  //上面被缓存的输出会当做参数传递过去
  child.addListener('close', exithandler);
  child.addListener('error', errorhandler);

  return child;
};
```

从上述代码可以清晰看到`execFile`就是调用了`spawn`并且将子进程的输出**缓存起来然后通过回调一次过返回给用户**。`spawn`中是通过监听stdio上面的事件来获取子进程的输出（并且输出还不是一次返回），这有些繁琐。  
**`execFile`对其适当地封装使之变成了我们熟悉的回调方式，这应该就是`execFile`的优点**。  
值得注意的是里面作为缓存的buffer是有默认大小的（默认为200 x 1024个字节），在项目中曾经试过因为子进程的输出太大导致抛出异常，因此`execFile`适合子进程的输出不是太大的情况，或者修改`maxBuffer`提供更大的缓存空间。

## `fork`
`fork`的相关源码如下：
```
exports.fork = function(modulePath /*, args, options*/) {
 //省略	
 var execArgv;
  if (typeof options.stdio === 'string') {
    options.stdio = stdioStringToArray(options.stdio);
  } else if (!Array.isArray(options.stdio)) {
  	/*
  		这里的注释说明第4个元素的值是ipc，说明在父子进程之间除了stdio之外还有ipc通道可以进行通讯
  		详情可以见下面的stdioStringToArray函数
  	*/
    // Use a separate fd=3 for the IPC channel. Inherit stdin, stdout,
    // and stderr from the parent if silent isn't set.
    options.stdio = options.silent ? stdioStringToArray('pipe') :
      stdioStringToArray('inherit');
  } else if (options.stdio.indexOf('ipc') === -1) {
    throw new errors.Error('ERR_CHILD_PROCESS_IPC_REQUIRED','options.stdio');
  }
  //如果没有特地指定execPath则默认值为nodejs的启动路径的绝对值
  options.execPath = options.execPath || process.execPath;
  options.shell = false;
  return spawn(options.execPath, args, options);
}

function stdioStringToArray(option) {
  switch (option) {
    case 'ignore':
    case 'pipe':
    case 'inherit':
      return [option, option, option, 'ipc'];//第4个元素表示额外的ipc通道
    default:
      throw new errors.TypeError('ERR_INVALID_OPT_VALUE', 'stdio', option);
  }
}
```
`fork`也是相当简单，注意两个地方：
* 父子进程之间建立了额外的ipc通道 
* 调用`spawn`的时候传递的第一个参数默认是nodejs路径的绝对值  

这跟文档描述很契合，启动了一个独立nodejs子进程并且和它建立ipc通道

## 再看`spawn`
一开始我们就说明了，用户层面的`spawn`调用了nodejs内部的`spawn`来生成子进程，它们的源码如下：
```javascript
var spawn = exports.spawn = function(/*file, args, options*/) {
  var opts = normalizeSpawnArguments.apply(null, arguments);
  var options = opts.options;
  var child = new ChildProcess();//一个内部的child_process构造函数，位于lib/internal/child_process.js
  debug('spawn', opts.args, options);
  child.spawn({//调用js内部的spawn函数，位于lib/internal/child_process.js
    //注意file和detached，待会看下c++是怎么使用它们
    file: opts.file,
    args: opts.args,
    cwd: options.cwd,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments,
    detached: !!options.detached,
    envPairs: opts.envPairs,
    stdio: options.stdio,
    uid: options.uid,
    gid: options.gid
  });
  return child;
};
```
代码一目了然没什么好探讨的，可以说用户层面的`child_process`其实是内部`child_process`的一个封装，我们直接看内部的`spawn`
```JavaScript
ChildProcess.prototype.spawn = function(options) {
  //省略...
  var err = this._handle.spawn(options);
  //省略...
  // Add .send() method and start listening for IPC data
  if (ipc !== undefined) setupChannel(this, ipc);
  return err;
};

```
内部的`spawn`看似很长但是核心代码就两句，分别用于生成子进程和建立父子进程的通讯通道。其中`this._handle.spawn`其实是调用了`process_wrap.cc`的`spawn`，这属于C++层面的东西，我们下个章节会对它进行简要的分析。

# 子进程在底层如何生成
## `process_wrap.cc`的`spawn`
根据上面的分析，先来看`process_wrap.cc`的`spawn`关键代码
```JavaScript
  static void Spawn(const FunctionCallbackInfo<Value>& args) {
    //获取js传过来的第一个option参数
    Local<Object> js_options = args[0]->ToObject(env->context()).ToLocalChecked();

   //提取option里面的参数，例如file和detached
    // options.file
    Local<Value> file_v = js_options->Get(context, env->file_string()).ToLocalChecked();
    CHECK(file_v->IsString());
    node::Utf8Value file(env->isolate(), file_v);
    options.file = *file;

    // options.detached
    Local<Value> detached_v = js_options->Get(context, env->detached_string()).ToLocalChecked();

    if (detached_v->IsTrue()) {
      options.flags |= UV_PROCESS_DETACHED;
    }
    //调用uv_spawn生成子进程，并将父进程的event_loop传递过去
    int err = uv_spawn(env->event_loop(), &wrap->process_, &options);
    //省略
  }
```
它的主逻辑也很简单，仅仅看注释就很清楚，先是提取js传递过来的参数，然后调用`process.cc`中的 `uv_spawn`。

## `process.cc`中的 `uv_spawn`
终于来到了真正做事的地方：`uv_spawn`，它也是相当长，我们摘取核心部分来看看
```C
int uv_spawn(uv_loop_t* loop,
             uv_process_t* process,
             const uv_process_options_t* options) {
  //省略一堆设置stdio的初始化工作代码
  err = uv__make_pipe(signal_pipe, 0);//建立父子进程之间的通讯通道，这个东西似乎是node内部使用的
  pid = fork();//用fork生成一个子进程

  if (pid == 0) {//如果是子进程，则执行uv__process_child_init然后退出
    uv__process_child_init(options, stdio_count, pipes, signal_pipe[1]);
    abort();
  }
  //省略...
  err = waitpid(pid, &status, 0);//等待子进程返回
  //如果是父进程则继续往下执行，以下是一堆相关的收尾释放资源之类的操作
}


static void uv__process_child_init(const uv_process_options_t* options,
                                   int stdio_count,
                                   int (*pipes)[2],
                                   int error_fd) {
  //哈哈，终于找到了设置detached=true的作用了
  if (options->flags & UV_PROCESS_DETACHED)
    setsid();
  //省略一大堆代码
  //最终是调用execvp来执行任务，注意最终运行的命令就是js中传递过来的file
  execvp(options->file, options->args);
}
```
从上面代码可以看到主要做了两件事：
* `uv_spawn`调用了`fork`来生成子进程
* 子进程调用`execvp`来执行新任务

（其实跟我们的预料是一样的，linux就提供了这两个函数，关于这个两个函数的具体用法大家请自行搜索，网上的介绍极其丰富，缺乏系统编程的知识真是不好读源码）


从注释可以看到js层面传递过去`detached=true`和`file`最终是如何被使用的。选取C++层面源码的时候我跳过了很多关于stdio的地方，这些细节我们都放在IPC再讨论（好吧，其实是好多没看明白，囧rz）


# IPC通讯

本来想讨论一下父子进程之间的IPC包括stdio细节的，但是发现IPC足够写n篇文章了，以后再独立开吧。
