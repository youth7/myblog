讨论了以下问题：

* 为何rust代码中是extern为函数，而不是extern为静态变量
* 为何`stext`这种符号没有size（因为它只代表一个地址的符号，当源码中碰到这个符号，就立马替换为对应的地址）

![](../../../imgs/rcore-stext-1.jpg)

![](../../../imgs/rcore-stext-2.jpg)

![](../../../imgs/rcore-stext-3.jpg)

![](../../../imgs/rcore-stext-4.jpg)