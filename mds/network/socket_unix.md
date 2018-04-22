# 基本模型

现实世界中两个人进行信息交流，这个过程称为一个通讯（communication）。通讯的双方称为端点（endpoint）。根据通讯环境的不同，端点可以选择不同的工具进行通讯，如果距离比较近可以直接谈话、手语（特种部队在禁言环境执行任务），如果距离远可以选择写信、打电话。在上述情况中，人们使用口、手、信件、手机实现了通讯，这些工具称为socket。

同理，在计算机中也有类似的概念：
* 在Unix中，一个通讯由两个端点组成，例如http服务器程序和http客户端程序就是两个端点。
* 端点想要通讯，必须借助某些工具，Unix中端点使用socket实现通讯。

# socket API
socket API是Unix上socket的对外接口，通过socket API可以灵活地操纵socket。Unix进程使用socket来进行通讯，这种通讯可以是本地的，也可以是远程的。本文主要介绍本地通讯，因为通讯双方是同一个系统内的不同进程，因此这种通讯方式也被视为IPC（Inter-Process Communication，进程间通信）的一种。

# 服务端socket API
实现一个服务端的步骤为：
* 创建一个socket
* 将这个socket绑定到某个地址
* 让这个socket转为被动模式
* 接受请求

下面将详细讲述这个几个步骤

## 创建一个socket
通过调用`socket()`函数，可以创建一个socket，这个函数的原型如下：
```C
#include <sys/types.h>
#include <sys/socket.h>
int socket(int domain, int type, int protocol);
```
其中各个参数的意义如下：
* `domain`：**代表通讯所在的域**，可以认为一种域代表一种socket，因此这个参数指明了socket的类型
    Unix中支持的`domain`的值和含义为：
    ```bash
    Name                Purpose                          Man page
    AF_UNIX, AF_LOCAL   Local communication              unix(7)
    AF_INET             IPv4 Internet protocols          ip(7)
    AF_INET6            IPv6 Internet protocols          ipv6(7)
    AF_IPX              IPX - Novell protocols
    AF_NETLINK          Kernel user interface device     netlink(7)
    AF_X25              ITU-T X.25 / ISO-8208 protocol   x25(7)
    AF_AX25             Amateur radio AX.25 protocol
    AF_ATMPVC           Access to raw ATM PVCs
    AF_APPLETALK        AppleTalk                        ddp(7)
    AF_PACKET           Low level packet interface       packet(7)
    AF_ALG              Interface to kernel crypto API
    ```
    可知Unix支持多种类型的socket，其中`AF_UNIX`（本地通讯）、`AF_INET`（IP4通讯）、`AF_INET6`（IP6通讯）最为常见的，`AF`是address family的缩写，`INET`是Internet的缩写。`domain`在某些情况下会影响`protocol`的值，详见`protocol`的解释。

* `type` ：**代表通讯数据的语意**  
    意味数据是通过什么方式发送的（例如流式数据还是数据报），Unix中支持的`type`的值和含义为：
    ```bash
    SOCK_STREAM     Provides sequenced, reliable, two-way, connection-based byte streams.  An out-of-band data transmission mechanism may be supported.

    SOCK_DGRAM      Supports datagrams (connectionless, unreliable messages of a fixed maximum length).

    SOCK_SEQPACKET  Provides a sequenced, reliable, two-way connection-based data transmission path for datagrams of fixed maximum length; a consumer is required  to  read  an  entire packet with each input system call.

    SOCK_RAW        Provides raw network protocol access.

    SOCK_RDM        Provides a reliable datagram layer that does not guarantee ordering.

    SOCK_PACKET     Obsolete and should not be used in new programs; see packet(7).
    ```
    其中`SOCK_STREAM`和`SOCK_DGRAM`分别用在TCP和UDP网络编程中。`SOCK_STREAM`提供面向连接的、可靠的、顺序的字节流，因为流式数据没有提供定界功能，因此需要自己去处理数据重组，即所谓的“粘包”。`SOCK_DGRAM`提供无连接的、不可靠的、最大长度是确定的数据报。一种类型的`domain`可以选择不同的`type`，例如我们选择`AF_INET`类型的socket进行通讯，可以选择流式数据还是数据报数据。

* `protocol`：**代表通讯所用的协议类型**  
    一般来说说一种`type`对应一种`protocal`，在这种情况下你只需将`protocol`设为0系统就会自动为你选择适当的协议。但是也有可能多种类型的`protocal`对应同一种`type`，此时`protocol`的值与`domain`有关，**即有多种协议可选的时候，要根据域来选择最适合的协议**。

## 将这个socket绑定到某个地址
当两个socket进行通讯的时候，必须有某种机制用来找到对方，这就需要将socket绑定到某个地址（address）上面。犹如两个人打电话，只有电话（socket）还是不够的，必须把电话和电话号码（address）绑定起来，才能相互找到对方。

Unix中通过函数`bind()`来实现绑定，它的原型如下：
```C
#include <sys/types.h>         
#include <sys/socket.h>
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
```

* `sockfd`：某个socket的描述符，不多解释
* `addr`：代表某种类型的地址，不同的`domain`有着相似但稍有区别的`addr`，但是各种类型的`addr`都有一个公共的父类`sockaddr`，它的结构如下
    ```C
    struct sockaddr {
        sa_family_t sa_family;
        char        sa_data[14];
    }    
    ```
    在编程的时候会将不同类型的`addr`都转型为`sockaddr`，这是为了欺骗编译器。本文只讨论`AF_UNIX`类型的socket，因此后面会详细讨论`addr_un`，它是域`AF_UNIX`专用的地址。
* `addrlen`：`addr`的实际长度

这个方法成功时候返回0，否则返回-1，常见的errno意义如下（Node.js中常见）：
* `EACCES`：地址被保护且用户非超级用户
* `EADDRINUSE`：有两种意思：
    * 指定的地址已经被使用了
    * 在Internet类型的socket中，当socket视图绑定到一个临时端口时候，这个错误意味着所有临时端口已经消耗殆尽
### 关于`sockaddr_un`
`sockaddr_un`比较复杂，我们只关注其中的重点部分。它是`AF_UNIX`类型socket专用的地址，结构如下：
```C
struct sockaddr_un {
    sa_family_t sun_family;               /* AF_UNIX */
    char        sun_path[108];            /* pathname */
};
```
* `sun_family`：值只能是`AF_UNIX.`，它指定了socket的地址族。
* `sun_path`：地址的具体标识。不同的地址通过`sun_path`来相互区分，比较常见的做法是将一个文件系统的路径赋值给`sun_path`


## 让这个socket转为被动模式
通过`listen()`函数，可以将一个socket转变为被动模式。socket有两种模式，分别是被动模式和主动模式。当socket处于被动模式时，它被用作接受请求（即成为一个服务端）。该函数的原型如下：

```C
#include <sys/types.h>         
#include <sys/socket.h>
int listen(int sockfd, int backlog);
```
* `sockfd`：服务端的socket的描述符，例如之前调用`socket()`之后的返回值
* `backlog`：当一个请求进来的时候，如果服务端正忙于前一个请求而无暇顾处理当前请求，当前请求就会被加入等待队列。`backlog`指定了等待队列的最大值。

## 接受请求
上面的初始化工作完成之后，服务端就可以调用`accept()`来接受请求，该函数从服务端socket的等待队列中取出请求并加以处理。它的原型如下：
```C
#include <sys/types.h>          
#include <sys/socket.h>
int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
```
* `sockfd`：服务端的socket的描述符，例如之前调用`socket()`之后的返回值
* `addr`：一个指向`sockaddr`类型结构体的指针，`addr`的详情由对端的socket决定
* `addrlen`：`addr`的长度，如果`addr`为NULL则`addrlen`也应该为NULL。

当socket为阻塞且等待队列为空，则`accept`会一直阻塞直到有请求到来。如果没有错误发生，`accept()`最终会返回一个非负整数，它是对端socket的文件描述符（服务端的socket可以配置为阻塞和非阻塞两种，本文只讨论阻塞的socket，非阻塞socket会另开专题讨论）。



## 一个例子
有了以上的基础，我们可以写一个小例子
```C
#include< stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
int main(void){
    int serverSocket = socket(AF_UNIX, SOCK_STREAM, 0);
    if(serverSocket==-1){
        perror("create socket fail");
    }
    struct sockaddr_un serverAddr = {
        sun_family : AF_UNIX,
        sun_path:"asdfasdf"
    };
    bind(serverSocket, (struct sockaddr *)&serverAddr, sizeof(struct sockaddr_un));
}
```


# 客户端的socket API