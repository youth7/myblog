本文将讨论以下内容
* HTTP RFC的分类
* HTTP message（报文）的组成
    * 起始行（start-line）
    * message header
        * ~~通用message header~~
        * request message header
        * response message header
        * 可选的headers
* 常用header的解释
    * cache-control


## HTTP RFC的分类
>注：文中提及的HTTP协议都是指HTTP1.1  

HTTP规范可以大致可以分为
* 核心规范
    * 必选的：服务器必须实现的特性
    * 可选的特性：服务器可以选择是否实现这些特性
* 扩展规范：

本文只讨论核心规范。


## HTTP message（报文）的组成
HTTP报文分为两种类型：
* 请求报文：由客户端发送给服务的
* 响应报文：有服务的发送给客户端

两者都使用通用报文格式（generic message format）进行封装，一个通用的报文格式由以下4部分组成：

```HTTP
generic-message = start-line
                  *(message-header CRLF)
                  CRLF
                  [ message-body ]
```

其中每个部分的具体内容跟报文的类型有密切关联，下面将按照报文类型分别说明


### 起始行（start-line）
起始行根据报文的类型可分为Request-Line和Status-Line两种类型。  一个Request-Line的组成是：
```HTTP
method SP request-target SP HTTP-version CRLF
````
其中各个部分的意思如下：
* method：HTTP的请求类型，如GET/POST/DELETE/PUT等
* SP：空格
* request-target：简单来说就是一个被请求的URI
* HTTP-version：HTTP版本

一个Status-Line的组成是：
```HTTP
 HTTP-version SP status-code SP reason-phrase CRLF
```
其中各个部分的意思如下：
* HTTP-version：HTTP版本
* SP：空格
* status-code：响应的状态码 
* reason-phrase：关于status-code的文字描述

总结：**起始行由多个部分组成，其中以空格分割，起始行结尾有一个回车换行符**


### message header
message header是报文非常重要的部分，携带了通讯中的一些元信息。跟起始行一样，它的具体内容跟报文类型密切相关，不同类型的报文有不同的header
#### ~~通用message header~~
在本文写作的时候，最新的[RFC标准](https://httpwg.org/specs/rfc7230.html#RFC7231)似乎已经抛弃了通用message header的说法，用了另外的方式来为header分类
#### request message header
按照功能可以分为以下几类：  

|功能类型|包含的header|
|---|---|
|Controls                       |Cache-Control<br>Expect<br>Host<br>Max-Forwards<br>Pragma<br>Range<br>TE|
|Conditionals                   |if-Match<br>if-None-Match<br>if-Modified-Since<br>if-Unmodified-Since<br>if-Range|
|Content Negotiation            |Accept<br>Accept-Charset<br>Accept-Encoding<br>Accept-Language|
|Authentication Credentials     |Authorization<br>Proxy-Authorization|
|Request Context                |From<br>Referer<br>User-Agen|

#### response message header
按照功能可以分为以下几类： 

|功能类型|包含的header|
|---|---|
|Control Data               |Age<br>Cache-Control<br>Expires<br>Date<br>Location<br>Retry-After<br>Vary<br>Warnin|
|Validator Header Fields    |ETag<br>Last-Modified|
|Authentication Challenges  |WWW-Authenticate<br>Proxy-Authenticate|
|Response Context           |Accept-Ranges<br>Allow<br>Server|


#### 可选的headers
看上去好像少了很多我们经常碰得到的字段（例如缓存），实际上相当一部分我们广泛使用的header其实是可选的，它们包括


|功能类型|包含的header|
|---|---|
|Conditional Requests   |If-Match<br>If-None-Match<br>If-Modified-Since<br>If-Unmodified-Since<br>If-Range|
|Range Requests         |Range<br>If-Range|
|Caching                |Age<br>Cache-Control<br>Expires<br>Pragma<br>Warning|
|Authentication         |WWW-Authenticate<br>Authorization<br>Proxy-Authenticate<br>Proxy-Authorization|

## 常用header的解释
### 跟缓存相关的header
缓存是HTTP中一块重要的内容，跟缓存相关的header多不胜数让人云里雾里，其实要搞清楚缓存主要回答以下的问题：  

1， 是否可以缓存  
2， 缓存的有效期是多少  
3， 过有效期之后还可以使用多久  
4， 过有效期之后如何验证资源  


HTTP的缓存体系是分为多个部分，有client缓存、proxy缓存、server缓存，发送方和响应方通过解析cache-control里面的指令，来执行对应的缓存策略。最为关键的两个概念是新鲜度（Freshness）和验证（Validation），cache-control跟这两个概念有密切联系，先列出cache-control的具体内容。

* 当cache-control在**请求**时发送，可用的指令有:  

    |指令|相关问题|含义|
    |---|---|---|
    |no-store|1|server不得缓存该请或响应|
    |no-cache||server可以使用缓存响应，但在此之前必须先校验资缓存是否还有效。<br>这个主要用在中间有缓存的proxy的时候，此时client允许proxy用它本地的缓存在响应，但是在用之前必须去server验证一下这个缓存是最新的。|
    |max-age|2|server可以使用缓存响应，但是缓存的有效期小于等于max-age|
    |max-stale|3|server可以使用**过期的缓存**响应，但是已经过期的时间不能超出max-stale|
    |min-fresh|2|server可以使用缓存响应，但是缓存的有效期大于等于max-age，它和max-age限制了缓存的有效期的上下限|
    |no-transform||proxy不能改变client的payload|
    |only-if-cached||client希望server只用缓存来响应|
    |cache-extension||扩展用途|



* 当cache-control在**响应**时发送，可用的指令有 

    |指令|相关问题|含义|
    |---|---|---|
    |public||该响应的缓存是共享的|
    |private||该响应的缓存是私有的的|
    |no-store|1|client不得缓存该请或响应|
    |no-cache||client可以缓存这个响应，但是下次使用之前必须先校验资缓存是否还有效|
    |no-transform||proxy不能改变client的payload|
    |must-revalidate||client可以缓存该响应，甚至该缓存过期之后还可以继续使用，但是使用前必须向服务端校验是否还有效|
    |max-age|2|client可以使用缓存响应，该缓存的有效期为max-age|
    |s-maxage|2|当缓存是public的时候，s-maxage的值会覆盖max-age|
    |cache-extension||扩展用途|

> 注意no-cache和no-store在请求和响应的时候都出现了，必须区分它们在不同环境下的语意，另外HTTP1.0还有一个expired的header，它的作用和max-age类似，但优先级低于max-age。


上述是关于Freshness的讨论，接下来是关于Validation的讨论。当缓存尚未过期的时候，client甚至不用发新的请求到server，直接使缓存即可。而缓存过期之后，就必须重新请求服务器来验证缓存的有效性。如果缓存无效了，server就返回新的内容，否则告知client可以继续使用该缓存。

* client端使用的关于验证缓存的header（都是条件请求类）
    |header|含义|
    |---|---|
    |if-Match||
    |if-None-Match||
    |if-Modified-Since||
    |if-Unmodified-Since||

* server端使用的关于验证缓存的header
    |header|含义|
    |---|---|
    |ETag||
    |Last-Modified||














## 参考资料
[https://httpwg.org/specs](https://httpwg.org/specs)
<!-- * HTTP Conditional Requests
    * If-Match
    * If-None-Match
    * If-Modified-Since
    * If-Unmodified-Since
    * If-Range
* HTTP Range Requests
    * Range
    * If-Range
* HTTP Caching
    * Age
    * Cache-Control
    * Expires
    * Pragma
    * Warning
* HTTP Authentication
    * WWW-Authenticate
    * Authorization
    * Proxy-Authenticate
    * Proxy-Authorization -->





<!-- * Controls
    * Cache-Control
    * Expect	   
    * Host	       
    * Max-Forwards
    * Pragma	   
    * Range	       
    * TE
* Conditionals
    * if-Match	          
    * if-None-Match	      
    * if-Modified-Since	  
    * if-Unmodified-Since
    * if-Range
* Content Negotiation
    * Accept	        
    * Accept-Charset	
    * Accept-Encoding	
    * Accept-Language
* Authentication Credentials  
    * Authorization
    * Proxy-Authorization
* Request Context
    * From	
    * Referer	
    * User-Agen -->
