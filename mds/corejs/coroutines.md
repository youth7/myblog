自己写的一个小例子，没有处理太多细节，只用来体现了`CO`的核心原理，本质上是一个协程

```JavaScript
const asynFunc = function (msg) {//用promise封装一个异步操作
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(msg), 1000);
    });
}

const coroutine = function* () {//主任务
    let i = 1;
    console.log("generator内部，开始任务");
    console.log("generator内部，异步操作的返回值是", yield asynFunc(i++));//yield会往外面传递一个promise，这个promise又会在自己内部传递一些值
    console.log("generator内部，异步操作的返回值是", yield asynFunc(i++));
    console.log("generator内部，异步操作的返回值是", yield asynFunc(i++));
    console.log("generator内部，任务完成");
}

const co = function (generator) {//co的具体实现
    const coroutine = generator();//初始化任务
    //驱动generator的函数
    const drive = function (toInner) {
        const status = coroutine.next(toInner);//推动generator前进，toInner是返回给generator的值
        if (status.done) {//如果generator里面的任务已经执行完毕
            return console.log("退出程序");
        }
        //status.value是generator里yield出来的的promise
        status.value.then(value => {//value是promise里面resolve过来的msg，最初的值其实也是generator内部传递过来的的
            console.log("                                                             外部，generator内部传递出来的值是", value);
            drive(new Date().getSeconds());
        }).catch(console.error);
    };
    drive();
};

co(coroutine);
```
运行结果如下，已经标注了执行顺序帮助理解

![generator.jpg](/imgs/generator.jpg)
