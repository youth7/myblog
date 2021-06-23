# Engine.IO协议

> 因为项目中没有发送二进制的需求，因此本文不考虑协议中传输二进制内容的部分

Engine.IO协议主要包括以下的内容

* URLs
* Encoding
 * packet
 * playload
* Transports（略）
 * websocket
 * jsonp
 * polling
 * xhr
* Transports upgrading（略）
* Timeouts（略）



> transport一词大量出现在文档中，结合上下文可以认为它是一个抽象概念，用来表示一个完整的通讯过程。一个通讯过程就是双发建立连接、发送若干数据、关闭连接的过程。

## URLs

一个Engine.io的url遵循以下格式：

`/engine.io/[?<query string>]`

* `engine.io`是固定的，只有一些基于该协议的上层协议能修改这个部分
* string query部分是可选的，可以传任意参数，但是有以下的保留字，它们是engine.io专用的
 * `transport`：指明transport的名称，默认的可选值为`polling`（轮询机制）, `websocket`
 * `j`：略过
 * `sid`：本次通讯过程的id
 * `b64`：如果客户端XHR2不支持，则b64=1表示客户端会用base64对二进制进行编码

## Encoding

Engine.io在发送数据前必须将数据进行编码以便传输，**可以认为就是这种协议的包结构**。要注意Engine.io是一种高层协议，它可以通过http（当transport=polling）或者websocket（当transport=websocket）协议传输，这就是所谓的 xxx over yyy了，例如之前经常听到的PPPoE（Point-to-Point Protocol Over Ethernet）

有两种不同的encodings 

* packet
* payload

## Packet

packet可以是utf8的字符串或者二进制内容，它的格式如下：

`<packet type id>[<data>]`

其中`packet type id`是一个占一个byte的整数，它的意义如下：

| | 含义 | 解释 |
| ---- | ------- | ------------------------------------------------------------ |
| 0 | open | |
| 1 | close | |
| 2 | ping | 健康检查，由client发出，数字后可以跟一些message，server用pong回复的时候必须重复这些message |
| 3 | pong | 健康检查，当client发出ping的时候用户端发出pong回应 |
| 4 | message | |
| 5 | upgrade | |
| 6 | noop | |

初学者的第一个疑问就是，**通讯双方是怎么确定一个packet的开始和结束呢**。这是任何基于tcp的上层协议都无法回避的问题。一般来说主要有两种方式：

* 定长

* 自定义分隔符

当Encoding.io使用websocket进行通讯的时候，**websocket的header中已经包含了这个包的长度，（即websocket协议的自动分帧功能是关键）**，因此正确解析出一个包是没有问题的。

> 关于`packet type id`的例子请参考官方文档，这里不再重复

## payload

一个payload就是一系列的packet，payload的格式如下：

* 当客户端不支持XHR2且发送的是文本时：（这种包在wireshark中能够比较容易捕捉到）

 * `<length1>:<packet1>[<length2>:<packet2>[...]] `
 
 > 如果客户端需要发送二进制数据，此时会将二进制数据用base64编码为字符串
 
* 当客户端支持XHR2

 * 这里文档描述得不是十分清晰

### 什么时候使用payload，它有什么作用？

当底层transport不支持分帧的时候才使用payload，例如使用polling机制的http协议（http协议本身是不支持分帧）另外文档中说明，当底层使用websocket协议通讯的时候是无需使用payload的，因为websocket已经是一个高效轻量的分帧协议。

为什么不直接发一个巨大无比的packet而需要分多个帧呢？可能是因为Encoding.io是会在通讯期间不断来回发送ping pong来确定通讯过程是否健康。发送一个巨大的packet很有可能会导致巨大的通讯延迟，从而使得ping pong检测超时使得连接中断，将一个大packet拆分成多个payload，可以在发送多个payload中间插入ping pong来保持检测。（从某种角度来看，polling似乎在http层面模拟websocket的效果，）

在实际的测试中发现初始化连接的时候会通过http发送一个payload，例子如下：

`96:0{"sid":"DVhduNd0FvQ5-cnIAAAC","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":5000}`

这是一段典型的基于engine.io协议的socket.io协议，要完整解读它需要下面介绍的socket.io协议



# Socket.io协议

socket.io协议是包裹在engine.io协议之上的，以engine.io的packet为例子的话，socket.io协议就是组成data的部分。

## socket.io包的类型

每个socket.io的包都有对应的类型，每种类型用一个整数表示：

- `Packet#CONNECT` (`0`)
- `Packet#DISCONNECT` (`1`)
- `Packet#EVENT` (`2`)
- `Packet#ACK` (`3`)
- `Packet#ERROR` (`4`)
- `Packet#BINARY_EVENT` (`5`)
- `Packet#BINARY_ACK` (`6`)



## socket.io对字符串的编码

分析文件/socket.io-parser/index.js中的`encodeAsString`函数

```js
function encodeAsString(obj) {

    // first is type
    var str = '' + obj.type;

    // attachments if we have them
    if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
        str += obj.attachments + '-';
    }

    // if we have a namespace other than `/`
    // we append it followed by a comma `,`
    if (obj.nsp && '/' !== obj.nsp) {
        str += obj.nsp + ',';
    }

    // immediately followed by the id
    if (null != obj.id) {
        str += obj.id;
    }

    // json data
    if (null != obj.data) {
        var payload = tryStringify(obj.data);
        if (payload !== false) {
            str += payload;
        } else {
            return ERROR_PACKET;
        }
    }

    debug('encoded %j as %s', obj, str);
    return str;
}
```

从上可知，一个序列化过后的socket.io的包结构是这样的：

`<type>[二进制attachments-][非/的namespace,][id][json数据]`，而这部分会嵌入到engine.io的协议中

**这个结构非常重要，它就是socket.io的包结构**

## 例子

![image-20200401151029307](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20200401151029307.png)







通过wireshark抓到一个socket.io的包，它的内容是`42["message","hello"]`，这是典型的engine.io over websocket。从上面的介绍的engine.io协议可知，第一个字符4表示这个packet的类型是message，data部分内容是`2["message","hello"]`，而这部分是socket.io协议的全部内容。首字符2表示这是一个event包，后面的内容则是通讯的全部数据。