# 使用UART打印出`hello wordld`

> 关于UART的一些基础知识，可以看[这里](./UART.MD)

要打印出hello word必须先初始化UART设备，需要注意QEMU模拟**一对**UART设备，即发送端和接收端都是模拟出来的，千万不要误以为是QEMU上模拟的UART和真机上的UART硬件通讯（虽然这理论上可以实现）。



初始化UART需要做：

* 屏蔽中断

* 设置波特率（在真实的硬件环境中这一步非常重要，然而在QEMU中这只是一个形式）
* 设置字长
* 设置停止位长度
* 设置奇偶校验
* 设置break control





