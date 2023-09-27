自己写的一个小例子，没有处理太多细节，只用来体现了`CO`的核心原理，本质上是一个协程，重点有：

1. `status.value`是一个`Promise`，因为是通过`yield`出来的。
2. `drive`在`then`那里的**递归调用**是重中之重
3. 内外通过传参来传递信息

```JavaScript
const asynFunc = function (msg) {//用promise封装一个异步操作
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(msg), 1000);
    });
}

const generator = function* () {//主任务
    console.log("generator内部，开始任务🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀");
    for(let i = 2023; i<2028; i ++){
        console.log(`generator内部，传递到外部的值是${i}`);
        let valueFromOutside = yield asynFunc(i++)
        console.log(`generator内部，从外部接收的值是${valueFromOutside}`);

    }
    console.log("generator内部，任务完成🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀");
}

const co = function (generator) {//co的具体实现
    const coroutine = generator();//初始化任务
    //驱动generator的函数，它是必须的，因为它是递归的
    const drive = function (valueFromOutside) {
        const status = coroutine.next(valueFromOutside);//推动generator前进，valueFromOutside是返回给generator的值
        if (status.done) {//如果generator里面的任务已经执行完毕
            return console.log("退出程序");
        }
        //status.value是generator里yield出来的的promise
        status.value
            .then(valueFromInside => {//value是promise里面resolve过来的msg，最初的值其实也是generator内部传递过来的的
                const valueToInside = new Date().getSeconds();
                console.log(" ".repeat(50) + "generator外部，内部传递出来的值是", valueFromInside, "即将返回给内部的值是", valueToInside);
                drive(valueToInside);
            })
            .catch(console.error);
    };
    drive();
};

co(generator);
```
运行结果如下

```
generator内部，开始任务🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀
generator内部，传递到外部的值是2023
                                                  generator外部，内部传递出来的值是 2023 即将返回给内部的值是 15
generator内部，从外部接收的值是15
generator内部，传递到外部的值是2025
                                                  generator外部，内部传递出来的值是 2025 即将返回给内部的值是 16
generator内部，从外部接收的值是16
generator内部，传递到外部的值是2027
                                                  generator外部，内部传递出来的值是 2027 即将返回给内部的值是 17
generator内部，从外部接收的值是17
generator内部，任务完成🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀
退出程序
```
