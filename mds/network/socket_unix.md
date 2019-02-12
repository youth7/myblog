Node.js的`net`模块有这样的描述：
>The net module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

可知在Linux中Node.js是使用Unix domain sockets来实现IPC。一直好奇Unix domain sockets长什么样子，经过一番搜索学习终于得知它的大概模样，现分享如下。

# 基本模型

现实世界中两个人进行信息交流，这个过程称为一个通讯（communication）。通讯的双方称为端点（endpoint）。根据通讯环境的不同，端点可以选择不同的工具进行通讯，如果距离比较近可以直接谈话、手语（特种部队在禁言环境执行任务），如果距离远可以选择写信、打电话。在上述情况中，人们使用一些工具（例如口、手、信件、手机）实现了通讯，这些工具称为socket。

同理，在计算机中也有类似的概念：
* 在Unix中，一个通讯由两个端点组成，例如http服务器程序和http客户端程序就是两个端点。
* 端点想要通讯，必须借助某些工具，Unix中端点使用socket实现通讯。

# socket
socket是一套API，用于为进程提供通讯服务，包括本地通讯（IPC）和远程通讯，本文只讨论IPC。Linux上的IPC有多种方式（例如管道、FIFO、共享内存变量、消息队列、Unix domain socket等），Unix domain socket虽说是IPC的一种，但代码写起来却和网络编程差不多。

# 服务端socket API
实现一个服务端的步骤为：
* 创建一个socket
* 将这个socket绑定到某个地址
* 让这个socket转为被动模式
* 接受请求

下面将详细讲述这几个步骤

## 创建一个socket
通过调用`socket()`函数，可以创建一个socket，这个函数的原型如下：
```C
#include <sys/types.h>
#include <sys/socket.h>
int socket(int domain, int type, int protocol);
```
其中各个参数的意义如下：
* `domain`：**代表通讯所在的域**，表示这个通讯是在哪个“空间”中进行
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
    Unix支持多种类型的通讯域，其中`AF_UNIX`（本地通讯）、`AF_INET`（IP4通讯）、`AF_INET6`（IP6通讯）最为常见的，`AF`是address family的缩写，中文一般翻译为地址族，是指某种类型的地址的集合。例如AF_INET就是所有IPv4地址的集合，AF_LOCAL就是Unix Socket的集合（大部分为一个本地文件的路径）。我个人是这样理解的，`domain`指定的是一个通讯的范围或者空间，可以通过地址族来描述这个空间的范围（因为地址族就是所有通讯地址的集合），因此通过地址族来指定domain是很合理的


* `type` ：**代表通讯数据的语意**  
    所谓的“语意”我个人的理解是指：通讯前是否需要建立连接，通道是否双工，数据是否有序，通讯是否可靠。一开始我觉得这些不是协议的部分内容么，为何要在这里指定？后来再仔细想想这些其实和具体的协议是不相关的，协议的具体内容是构建于这些“语意”之上，“语意”比协议更加低层，它是socket进行数据交换的方式，而如何解读这些数据才是协议的事情。
    Unix中支持的`type`的值和含义为：
    ```bash
    SOCK_STREAM     Provides sequenced, reliable, two-way, connection-based byte streams.  An out-of-band data transmission mechanism may be supported.

    SOCK_DGRAM      Supports datagrams (connectionless, unreliable messages of a fixed maximum length).

    SOCK_SEQPACKET  Provides a sequenced, reliable, two-way connection-based data transmission path for datagrams of fixed maximum length; a consumer is required  to  read  an  entire packet with each input system call.

    SOCK_RAW        Provides raw network protocol access.

    SOCK_RDM        Provides a reliable datagram layer that does not guarantee ordering.

    SOCK_PACKET     Obsolete and should not be used in new programs; see packet(7).
    ```
    `SOCK_STREAM`提供面向连接的、可靠的、顺序的字节流，因为流式数据没有提供定界功能，因此需要自己去处理数据重组，即所谓的“粘包”。`SOCK_DGRAM`提供无连接的、不可靠的、最大长度是确定的数据报。一种类型的`domain`可以选择不同的`type`，例如我们选择`AF_INET`类型的socket进行通讯，可以选择流式数据还是数据报数据。而网络编程中，TCP和UDP分别使用`SOCK_DGRAM`和`SOCK_DGRAM`的方式进行通信。

* `protocol`：**代表通讯所用的协议类型**  
    一般来说对于某个给定的协议族，只有一个`protocal`和`domain`对应，在这种情况下你只需将`protocol`设为0系统就会自动为你选择适当的协议。但是理论上在一个协议族中，是有可能有多个`protocal`适用于同一个`domain`，此时需要显示指定`protocol`的值。

* `protocol`和`domain`是不是有点重复？  
    我个人认为`domain`只是指定了通讯在哪个空间中进行，至于通讯的具体细节（即协议）由`protocol`指定。但是现实中一个`domain`通常只有一个`protocal`，因此让人觉得两个参数的意义是重复。理论上我在一个通讯空间是可以有多种通讯协议的。

这个函数最终会创建一个socket，并返回一个描述符（正整数）来表示它。如果函数的返回值是-1，则表示socket创建失败。


## 将这个socket绑定到某个地址
当两个socket进行通讯的时候，必须有某种机制用来找到对方，这就需要将socket绑定到某个地址（address）上面。犹如两个人打电话，只有电话（socket）还是不够的，必须把电话和电话号码（address）绑定起来，才能相互找到对方。

Unix中通过函数`bind()`来实现绑定，它的原型如下：
```C
#include <sys/types

# 使用`send()`和`recv()`进行数据的收发
Unix domain socket是全双工的，因此双方都可以使用.h>         
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

这个函数成功时候返回0，否则返回-1，常见的errno意义如下（Node.js中常见）：
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
* `sun_path`：地址的具体标识。不同的地址通过`sun_path`来相互区分。标记一个地址有3中方法：
    * 使用文件系统的某个路径，这是最为常见的方法，例如将`sun_path`赋值为`/tmp/test`
    * 使用匿名路径：例如通过`socketpair()`创建的socket对，它们的地址就是匿名的
    * 使用抽象路径：使用一种更加抽象的方式来标记一个地址

## 让这个socket转为被动模式
通过`listen()`函数，可以将一个socket转变为被动模式。socket有两种模式，分别是被动模式和主动模式。当socket处于被动模式时，它被用作接受请求（即成为一个服务端）。该函数的原型如下：

```C
#include <sys/types.h>         
#include <sys/socket.h>
int listen(int sockfd, int backlog);
```
* `sockfd`：服务端的socket的描述符，例如之前调用`socket()`之后的返回值
* `backlog`：当一个请求进来的时候，如果服务端正忙于前一个请求而无暇顾处理当前请求，当前请求就会被加入等待队列。`backlog`指定了等待队列的最大值。

这个函数成功时候返回0，否则返回-1。注意在Node.js的`net`模块中有一个`server.listen()`方法，文档上对其的解释是：
>tart a server listening for connections. A `net.Server` can be a TCP or a IPC server depending on what it listens to.

也就是说`listen()`的语义是去**监听某种东西**，可以是端口或者代表IPC的本地路径。然而Unix上的`listen()`并没有很直接表现出“去监听什么东西”这种意思。因此我觉得Node.js中的API在语义上设计得更加好，与人的思维更加符合（说到这里我特意去查了下Java的API，发现它有`bind()`但是没有`listen()`，意思是把socket绑定到某处就可以接受请求了，也很直白简洁。多年不用Java，我已经连API都记不住了）。


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

当socket为阻塞且等待队列为空，则`accept`会一直阻塞直到有请求到来（服务端的socket可以配置为阻塞和非阻塞两种，本文只讨论阻塞的socket，非阻塞socket会另开专题讨论）。如果没有错误发生，`accept()`最终会返回一个**新的socket的文件描述符，真正跟对端socket通讯的是这个新的socket描述符，而原来的socket并不会受到影响**。

如果成功，函数返回一个非负整数，否则返回-1。


## 一个服务端的例子
有了以上的基础，我们可以写本地版的echo服务器，这个服务器接受客户端连接，然后接受输入并原样返回给客户端。这个服务端被设计为一次只能接收一个连接（如果要接收多个连接需要多线程或者非阻塞IO，这使得程序复杂化，不利于演示）。
```C
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <string.h>
#include <stdbool.h>
#include <errno.h>
#include <unistd.h>
#define BACK_LOG 1000
#define BUFFER_SIZE 1024
char buffer[BUFFER_SIZE] = {0};
char path[] = "./namo_amitabha";
void handleError(char *msg) { //错误处理函数
    perror(msg);
    exit(-1);
}

void bindToAddress(int serverSocket) { //将socket与某个地址绑定
    struct sockaddr_un address;
    address.sun_family = AF_UNIX;//使用Unix domain
    strncpy(address.sun_path, path, sizeof(path));//这个地址的类型有3种，参考上文所说，这里我们使用“系统路径”这一类型
    if (remove(path) == -1 && errno != ENOENT) { //绑定之前先要将这个路径对应的文件删除，否则会报EADDRINUSE
        handleError("删除失败");
    }
    if (bind(serverSocket, (struct sockaddr *)&address, sizeof(address)) == -1) {
        handleError("地址绑定失败");
    }
}

void echo(int socket) {
    int numberOfReaded, numberOfWrited = 0;
    while (true) {
        numberOfReaded = recv(socket, buffer, BUFFER_SIZE, 0);//读取客户端进程发送的数据
        if (numberOfReaded == -1) {
            handleError("读取数据错误");
        } else if (numberOfReaded == 0) {
            printf("客户端关闭连接\n");
            close(socket);
            return;
        }
        printf("收到对端进程数据长度为%d，开始echo", numberOfReaded);
        if (numberOfReaded > 0) {
            numberOfWrited = write(socket, buffer, numberOfReaded);//然后原版返回
            printf("  写入的结果为%d\n", numberOfWrited);
        }
    }
}

void handleRequest(int serverSocket) {
    int socket = accept(serverSocket, NULL, NULL);//监听客户端的请求，没有请求到来的话会一直阻塞
    if (socket == -1) {
        handleError("accept 错误");
    }
    puts("client发起连接...");
    echo(socket);
}
int main(void) {
    int serverSocket = socket(AF_UNIX, SOCK_STREAM, 0);
    if (serverSocket == -1) {
        handleError("创建socket失败");
    }
    bindToAddress(serverSocket);
    if (listen(serverSocket, BACK_LOG) == -1) {//转为被动模式
        handleError("监听失败");
    }
    while (true) {
        handleRequest(serverSocket);
    }
}
```


# 客户端的socket API
实现一个客户端的步骤为：
* 创建一个socket
* 连接到对等的socket

可见创建客户端的socket较为简单，没有地址绑定和状态转换，下面将详细讲述这两个步骤
## 创建一个socket
和服务端创建socket一样，请参考上面

## 连接到对等的socket
通过调用`connect()`函数，客户端socket可以主动连接到服务端的socket，`connect()`的原型如下：
```C
#include <sys/types.h>         
#include <sys/socket.h>
int connect(int sockfd, const struct sockaddr *addr,socklen_t addrlen);
```
* `sockfd`：客户端socket的描述符，通过`socket()`函数返回
* `addr`和`addrlen`：这两个参数的意义和`bind()`函数中对应的参数意义一样，请参考上面


# 使用`send()`和`recv()`进行数据的收发
当两个socket连接起来后（其实datagram socket不需要连接也可以发送数据），就可以使用其它API进行通讯了。Unix domain socket是全双工的，因此双方都可以使用`send()`和`recv()`来进行数据的收发，`recv()`的原型如下：
```c
#include <sys/types.h>
#include <sys/socket.h>
ssize_t recv(int sockfd, void *buf, size_t len, int flags);
```

* `sockfd`：描述符，函数将从这个描述符代表的socket中读取数据
* `buf`：一个指针，指向了当前socket用来接收对端socket数据的缓冲区
* `len`：表示从socket中读取长度为`len`的数据到缓冲区
* `flags`:用途非常广泛，可以用来设置异步IO等，我们这里不深入介绍，如果没有额外的要求可以设为0

`recv`的返回值意义如下：
* -1：出错
* 0：表示对端已经关闭
* 其它正整数：真正从对端socket读取出来的字节数，有可能比`len`要小（因为数据不一定全部就绪）

`send()`函数的原型如下：
```C
#include <sys/types.h>
#include <sys/socket.h>
ssize_t send(int sockfd, const void *buf, size_t len, int flags);
```
它的参数、返回值意义和`recv()`类似，这里不再重复

## 一个客户端的例子
有了以上的基础，我们可以写一个客户端的demo
```C
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <string.h>
#include <stdbool.h>
#include <errno.h>
#include <unistd.h>
#define BUFFER_SIZE 1024
char buffer[BUFFER_SIZE] = {0};
char path[] = "./namo_amitabha";
void handleError(char *msg) { //错误处理函数
    perror(msg);
    exit(-1);
}
int main(void) {
    int clientSocket = socket(AF_UNIX, SOCK_STREAM, 0);
    if (clientSocket == -1) {
        handleError("创建socket失败");
    }
    struct sockaddr_un addr;
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, path, sizeof(addr.sun_path));

    if (connect(clientSocket, (struct sockaddr *)&addr, sizeof(addr)) == -1) {
        handleError("连接服务端失败");
    }
    while(true) {
        fgets(buffer, BUFFER_SIZE, stdin);
        if(send(clientSocket, buffer, strlen(buffer), 0)==-1) {
            handleError("发送失败");
        }
        int numOfReaded = recv(clientSocket, buffer, BUFFER_SIZE, 0);
        if(numOfReaded==-1) {
            handleError("对端已经关闭");
        }
        buffer[numOfReaded]=0;
        printf("%s", buffer);
    }
}
```
将服务端和客户端分别保存为server.c和client.c并放到同一目录下，对于服务端使用以下命令编译运行
```bash
gcc -Wall server.c -o server.out && ./server.out
```
对于客户端使用以下命令编译运行
```bash
gcc -Wall client.c -o client.out && ./client.out
```
在我的机器上(Fedora26 + GCC7.3.1)运行结果如下：

![unix_domain](/imgs/unix_domain.jpg)