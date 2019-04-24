前段时间在开发中碰到一个小问题，揭露了我工作多年依然是个菜鸟并且基础知识不够扎实的毛病，现记录下来跟大家分享。为方便重现问题的核心，文中用了最为简洁的代码来模拟当时的场景。

## 一个异常的行为
某天开发了一个REST接口让前端调用，它大概是这个样子：
```JS
//server.js的代码
"use strict";
const server = require("http").createServer();
server.listen(4000);
server.on("request", (req, res)=> {
    res.end("别搞node了，转AI吧");
});
```
写完后用Postman测试了一下  
![ip_address_issue.jpg](/imgs/ip_address_issue.jpg)  
输出一切正常，马上提交推送代码让前端对接。前端拉取代码在本地运行之后发现请求接口会报错，具体表现是：**按照上面截图的方式用Postman调用接口的话一切正常，用手写的程序调用报错**。例如用以下前端代码调用接口就报错
```JS
//前端代码
var request= new XMLHttpRequest();
request.onreadystatechange = function () {
    if (request.readyState === 4) {
        if (request.status === 200) {
            console.log(request.responseText)
        } else {
            console.error(request.status)
        }
    }
}
request.open("GET", "http://127.0.0.1:4000");
request.send();
```
这让我非常困惑。

## 调试过程
这个问题其实不难，仔细的同学可能已经发现代码中的一些问题了，然而由于本人不够细心，在错误的debug方向上越走越远浪费了好些时间。当时我不假思索写了下面的代码来重现问题
```JS
//client.js代码
"use strict";
const client = require("http").get("http://localhost:4000", res => {
    res.setEncoding("utf8");
    res.on("data", console.log);
});
client.on("error",e=>{
    console.error(error);
});
```
错误输出为
```bash
Error: Parse Error
    at Socket.socketOnData (VM75 _http_client.js:447)
    at Socket.emit (VM15 events.js:197)
    at addChunk (VM65 _stream_readable.js:288)
    at readableAddChunk (VM65 _stream_readable.js:269)
    at Socket.Readable.push (VM65 _stream_readable.js:224)
    at TCP.onStreamRead (VM74 stream_base_commons.js:150)
```
马上debug进去看看是怎么回事  
![ip_address_issue2.jpg](/imgs/ip_address_issue2.jpg)  

447行的`var ret = parser.execute(d);`报错，那很明显是服务端发送的数据有问题了，从截图上看`d`为字符串`HEART`。这明显不是我的服务端的输出，难不成有另外一个服务跑在4000端口？但如果这样的话会端口冲突，服务端启动会失败更不要说对外服务了，但是Postman请求服务却又是正常的。当时的情况总结就是：
* server.js启动了服务端
* Postman可以正常访问服务端
* client.js不可以正常访问服务端

上面的情况似乎是矛盾的，我尝试着将server.js停掉，**然后惊奇地发现Postman不能正常访问服务了，但是client.js依然能够接收数据（`HEART`字符串）然后报错。这表明确实有另外一个服务跑在4000端口**。于是用下面的命令查看是谁
```bash
PS C:\Users\hehe> netstat -aon|findstr "4000"
TCP    127.0.0.1:4000         0.0.0.0:0              LISTENING       4836

PS C:\Users\hehe> tasklist|findstr "4836"
FoxitProtect.exe              4836 Services                   0      6,472 K
```


原来是Foxit阅读器的服务占用4000端口造成冲突，改掉server.js监听的端口之后一切正常。  
问题依然解决了，但是我在这个过程中究竟犯了什么错误，为什么会犯这样的错误？为何会出现Postman可以访问但是client.js不能访问的现象？


## 问题所在
我犯的错误有以下几个
* 在server.js中调用`server.listen(4000)`
* 在Postman中基于localhost这个域名去访问服务
* 在client.js中基于127.0.0.1去访问服务

来看看`server.listen([port[, host[, backlog]]][, callback])`的文档
> If host is omitted, the server will accept connections on the unspecified IPv6 address (::) when IPv6 is available, or the unspecified IPv4 address (0.0.0.0) otherwise.  

**也就是说如果不制定参数`host`的话，就会使用IPv6的地址(::)或者IPv4的地址(0.0.0.0)**，于是我重新将server.js启动，然后执行命令
```bash
 C:\Users\hehe> netstat -aon|findstr "4000"
  TCP    0.0.0.0:4000           0.0.0.0:0              LISTENING       13176
  TCP    127.0.0.1:4000         0.0.0.0:0              LISTENING       4836
```
server.js在0.0.0.0上监听4000端口，它和127.0.0.1上监听相同端口的服务是不会冲突的。至此我终于发现了自己知识的盲点，就是我对以下四者的关系混淆不清（工作多年还不清楚这个问题真是令人惭愧，脸红中......）
* localhost（注意这是一个域名）
* 127.0.0.1
* 0.0.0.0
* 本机的真实ip，例如192.168.1.64

关于它们的详细区别请看这里
* [What is the difference between 0.0.0.0, 127.0.0.1 and localhost?](https://stackoverflow.com/questions/20778771/what-is-the-difference-between-0-0-0-0-127-0-0-1-and-localhost)
* [localhost、127.0.0.1 和 本机IP 三者的区别](https://www.zhihu.com/question/23940717)

此外必须注意到文档中还提及
>All net.Socket are set to SO_REUSEADDR   

关于`SO_REUSEADDR`的讨论请看
* [Socket options SO_REUSEADDR and SO_REUSEPORT, how do they differ? Do they mean the same across all major operating systems?](https://stackoverflow.com/questions/14388706/socket-options-so-reuseaddr-and-so-reuseport-how-do-they-differ-do-they-mean-t)  
* [SO_REUSEADDR与SO_REUSEPORT平台差异性与测试](https://www.cnblogs.com/xybaby/p/7341579.html)    

总之这又是一个隐蔽的坑，在不同的操作系统上`SO_REUSEADDR`具有不同的意义。而在windows上正是因为开启了`SO_REUSEADDR`才使得0.0.0.0:4000和127.0.0.1:4000不会冲突