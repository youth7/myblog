


`require()`是nodejs中使用频率最高的函数，但是对它的认识一直都是一知半解，最近看了一下的源码才知道其主要工作流程，现在做一下总结。先说结论：
* native模块（也叫做核心模块，即位于lib目录下的js文件）的`require()`是位于bootstrap_node.js中的`NativeModule.require()`
* 而用户自己编写的程序中的`require()`则是位于lib/module.js中的`Module._load()`

其实后者在某些情况下回依赖前者，两者并不是完全独立，本文基于node 9.5.0进行讨论。

# 一个nodejs程序的启动过程
先写一个测试程序`test.js`如下：
```javascript
"use strict";
console.log("nodejs");
```
然后使用`node --inspect-brk test.js`启动，则程序进入调试模式并停在第一行，在chrome的调试界面中我们可以清楚看到程序的调用栈。启动过程中node使用了哪些函数，这些函数的所在位置都可以在chrome的调试面板中清楚看到。  

仔细观察我们得知node依次运行`bootstrap_node.js`和`module.js`里面的若干函数进行初始化工作，然后才运行用户的代码。
![node_app_stack](/imgs/node_app_stack.jpg)


# bootstrap_node.js

native模块中的`require`定义在`bootstrap_node.js`中，`bootstrap_node.js`是node启动过程中在js层面的第一个文件，它执行了很多初始化工作（我们这里不一一细说，有兴趣可以参考[《通过源码解析 Node.js 启动时第一个执行的 js 文件：bootstrap_node.js》 ](https://cnodejs.org/topic/5720ffd2fa48138c41110eb1)）。  
`bootstrap_node.js`的结构很简单，里面只有一个立即运行的匿名函数，这个匿名函数运行了`startup()`来真正执行初始化。

```javascript
'use strict';
(function(process) {
 //...省略其它代码
  startup();
});
```
值得注意的是这个匿名函数有一个`process`变量，这个变量非常重要，它上面有很多属性都是C++那边暴露过来的，是JS和C++交互的一个重要渠道，`process`是从node.cc中传递过来的。具体过程可以参考[《node源码粗读（4）：process对象底层实现》 ](https://github.com/xtx1130/blog/issues/12)，因为我们这里专注js层面的分析，C++层面我们不详细讨论。



# native模块中的`require`
我们以加载lib/module.js为例，探讨一下native模块中`require()`
是怎么来的（注意，此时用户自己编写的模块中的require尚未初始化）。  
通过查找我们发现`bootstrap_node.js`是通过`const Module = NativeModule.require('module')`来加载module模块，`NativeModule.require()`的核心代码如下：

```javascript
NativeModule.require = function(id) {
    if (id === 'native_module') {//返回NativeModule自己
      return NativeModule;
    }

    const cached = NativeModule.getCached(id);
    if (cached && (cached.loaded || cached.loading)) {//如果已经缓存则返回缓存的模块
      return cached.exports;
    }

    if (!NativeModule.exists(id)) {//如果系统中并不存在这个id代表的native模块则抛出异常
      const err = new Error(`No such built-in module: ${id}`);
      err.code = 'ERR_UNKNOWN_BUILTIN_MODULE';
      err.name = 'Error [ERR_UNKNOWN_BUILTIN_MODULE]';
      throw err;
    }
    //否则编译并缓存该模块
    moduleLoadList.push(`NativeModule ${id}`);
    const nativeModule = new NativeModule(id);//初始化一个新的模块对象
    nativeModule.cache();//缓存模块
    nativeModule.compile();//编译模块
    return nativeModule.exports;
}
```
非常浅显无需多言，关键在于`nativeModule.compile()`

```javascript
  NativeModule.prototype.compile = function() {
    /**
    这个方法会从NativeModule._source中取出模块的源码，
    而NativeModule._source是从c++那边传递过来的，它存储着已经加载到内存中的native模块的源码。
    至于C++那边是怎么将native源码传递过来我们不详细说明，关键之处是process.binding()。
    网上有很多相关资料或者参考朴灵的《深入浅出nodejs》的章节2.3.3。
    **/
    let source = NativeModule.getSource(this.id);
    source = NativeModule.wrap(source); //把源码包裹起来生成一个匿名函数的源码
    //省略...
    //根据匿名函数源码生成匿名函数对象
    const fn = runInThisContext(source, {
      filename: this.filename,
      lineOffset: 0,
      displayErrors: true
    }); 
    //生成传递进去的require函数，native模块中的require就在这里！
    const requireFn = this.id.startsWith('internal/deps/') ?
      NativeModule.requireForDeps :
      NativeModule.require;
    //将require传递进去，运行这个函数，module模块就完成了加载  
    fn(this.exports, requireFn, this, internalBinding, process); 
  };
```

可以看到，native模块最终会被包裹为一个匿名函数然后执行，包裹的内容可以从下面函数得知
```javascript
  NativeModule.wrap = function(script) {
    return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
  };

  NativeModule.wrapper = [
    '(function (exports, require, module, internalBinding, process) {',
    '\n});'
  ];

```
因此native模块的源码会被包裹成这样一个函数执行
```javascript
(function (exports, require, module, internalBinding, process) {
	//native模块的代码
})

```
第2个参数`require`就是上面`NativeModule.prototype.compile`函数中的`requireFn`，**对于native模块来说`requireFn`就是`NativeModule.require`**。即`NativeModule.require`在加载`module`模块的时候，将自己作为参数传了进去，这样`module`模块就可以用相同的方式去加载其它native模块。这意味着其它native模块中的`require`也是`NativeModule.require`（被module加载的时候传递进去），从而所有native模块的加载方式都是一致的。

# 用户模块中的`require`
`bootstrap_node.js`中通过以下代码加载用户模块
```javascript
const Module = NativeModule.require('module');//先加载模块module，它是一个native模块
//省略...
Module.runMain();//然后再运行用户的代码，由此可知用户代码是通过module模块加载的，和native有些不同
```
再看`Module.runMain()`
```javascript
Module.runMain = function() {
  Module._load(process.argv[1], null, true);//process.argv[1]是命令行中传过来，是用户代码的文件名，例如我们这里就是test.js
  /**这里发现一个意外惊喜，原来process.nextTick()的callback在用户代码之后马上执行，是优于eventLoop的。
  这是对我之前写的《不要混淆nodejs和浏览器中的event loop》的一个重要补充
  **/
  process._tickCallback();
};
```
`Module._load()`之后的调用关系如下，全部函数都是位于`module.js`
```javascript
Module._load()
↓ 
tryModuleLoad()
↓
module.load()
↓
/*
值得一提的是Module._extensions['.js']通过以下代码来读取源码
var content = fs.readFileSync(filename, 'utf8');
因此我们知道用户的模块加载是同步的，并且字符编码只能是utf8
*/
↓
module._compile()//最终运行用户代码的地方
```
看一下最为关键的`module._compile()`
```javascript
Module.prototype._compile = function(content, filename) {
  //将用户的代码包裹为一个匿名函数，这个包裹过程和上面Native.require()中的类似，这里不再重复	
  var wrapper = Module.wrap(content);
  //生成一个匿名函数
  var compiledWrapper = vm.runInThisContext(wrapper, {
    filename: filename,
    lineOffset: 0,
    displayErrors: true
  });
  //注意，这里生成了用户模块中的require！！
  var require = internalModule.makeRequireFunction(this);
  if (inspectorWrapper) {//在调试模式下运行用户代码 
    result = inspectorWrapper(compiledWrapper, this.exports, this.exports,require, this, filename, dirname);
  } else {//在普通模式下运行用户代码
    result = compiledWrapper.call(this.exports, this.exports, require, this,filename, dirname);
  }
};
```
可见用户代码中的`require()`是`internalModule.makeRequireFunction()`生成的，它位于lib/internal/module.js
```javascript
function makeRequireFunction(mod) {
  const Module = mod.constructor;

  function require(path) {
    try {
      exports.requireDepth += 1;
      return mod.require(path);
    } finally {
      exports.requireDepth -= 1;
    }
  }
  //省略...
  return require;
}
```
`mod.require()`是什么？我们回溯上去发现`mod`是`Module.prototype._compile()`中的`this`，因此`mod.require()`就是`Module.prototype.require()`
```javascript
Module.prototype.require = function(path) {
  assert(path, 'missing path');
  assert(typeof path === 'string', 'path must be a string');
  return Module._load(path, this, /* isMain */ false);//最终又变成了Module._load
};
```
咦？又调用了`Module._load()`，对照一下上面提及的调用流程，那岂不是无限递归吗？看看`Module._load()`
```javascript
Module._load = function(request, parent, isMain) {
  if (isMain && experimentalModules) {//实验模块的加载
  }
  var filename = Module._resolveFilename(request, parent, isMain);
  var cachedModule = Module._cache[filename];
  if (cachedModule) {//如果模块已经被缓存过，则直接返回
    updateChildren(parent, cachedModule, true);
    return cachedModule.exports;
  }
  //如果是已经加载过的非internal的native模块，则用NativeModule.require()加载
  if (NativeModule.nonInternalExists(filename)) {
    debug('load native module %s', request);
    return NativeModule.require(filename);
  }
  //否则从磁盘加载这个模块的源码然后运行之。
  var module = new Module(filename, parent);

  if (isMain) {
    process.mainModule = module;
    module.id = '.';
  }
  Module._cache[filename] = module;
  tryModuleLoad(module, filename);
  return module.exports;
};
```

由此可知`Module._load()`在加载第一个用户模块源码然后运行的时候，会间接地将自己作为参数传递进去作为`require`，这使得第一个用户模块也能用相同的方式去加载它用户模块，这意味着其它用户模块也有着和第一个用户模块一样的`require`（有点绕，请仔细体会），这样所有用户模块的加载方式都一致了，这和`NativeModule.require()`是类似的。
