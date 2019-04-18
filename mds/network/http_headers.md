## http rfc的分类
>注：文中提及的http协议都是指http1.1  

http规范可以大致可以分为
* 核心规范
    * 必选的：服务器必须实现的特性
    * 可选的特性：服务器可以选择是否实现这些特性
* 扩展规范：

本文只讨论核心规范。


## http message（报文）的组成
http报文分为两种类型：
* 请求报文：由客户端发送给服务的
* 响应报文：有服务的发送给客户端

两者都使用通用报文格式（generic message format）进行封装，一个通用的报文格式由以下4部分组成：

```http
generic-message = start-line
                  *(message-header CRLF)
                  CRLF
                  [ message-body ]
```

其中每个部分的具体内容跟报文的类型有密切关联，下面将按照报文类型分别说明


## 起始行（start-line）
起始行根据报文的类型可分为Request-Line和Status-Line两种类型。  一个Request-Line的组成是：
```http
method SP request-target SP HTTP-version CRLF
````
其中各个部分的意思如下：
* method：http的请求类型，如GET/POST/DELETE/PUT等
* SP：空格
* request-target：简单来说就是一个被请求的URI
* HTTP-version：http版本

一个Status-Line的组成是：
```http
 HTTP-version SP status-code SP reason-phrase CRLF
```
其中各个部分的意思如下：
* HTTP-version：http版本
* SP：空格
* status-code：响应的状态码 
* reason-phrase：关于status-code的文字描述

总结：**起始行由多个部分组成，其中以空格分割，起始行结尾有一个回车换行符**


## message header
message header是报文非常重要的部分，携带了通讯中的一些元信息。跟起始行一样，它的具体内容跟报文类型密切相关，不同类型的报文有不同的header
### ~~通用message header~~
在本文写作的时候，最新的[RFC标准](https://httpwg.org/specs/rfc7230.html#RFC7231)似乎已经抛弃了通用message header的说法，用了另外的方式来为header分类
### request message header
按照功能可以分为以下几类：  

|功能类型|包含的header|
|---|---|
|Controls                       |Cache-Control<br>Expect<br>Host<br>Max-Forwards<br>Pragma<br>Range<br>TE|
|Conditionals                   |if-Match<br>if-None-Match<br>if-Modified-Since<br>if-Unmodified-Since<br>if-Range|
|Content Negotiation            |Accept<br>Accept-Charset<br>Accept-Encoding<br>Accept-Language|
|Authentication Credentials     |Authorization<br>Proxy-Authorization|
|Request Context                |From<br>Referer<br>User-Agen|

### response message header
按照功能可以分为以下几类： 

|功能类型|包含的header|
|---|---|
|Control Data               |Age<br>Cache-Control<br>Expires<br>Date<br>Location<br>Retry-After<br>Vary<br>Warnin|
|Validator Header Fields    |ETag<br>Last-Modified|
|Authentication Challenges  |WWW-Authenticate<br>Proxy-Authenticate|
|Response Context           |Accept-Ranges<br>Allow<br>Server|
<!-- * Control Data
    * Age	          
    * Cache-Control
    * Expires	      
    * Date	      
    * Location	  
    * Retry-After	  
    * Vary	      
    * Warning    
* Validator Header Fields（这种header应答上面Conditionals类的request header）
    * ETag	
    * Last-Modified
* Authentication Challenges  
    * WWW-Authenticate
    * Proxy-Authenticate
* Response Context  
    * Accept-Ranges
    * Allow	         
    * Server -->

### 可选的headers
看上去好像少了很多我们经常碰得到的字段（例如缓存），实际上相当一部分我们广泛使用的header其实是可选的，它们包括


|功能类型|包含的header|
|---|---|
|Conditional Requests   |If-Match<br>If-None-Match<br>If-Modified-Since<br>If-Unmodified-Since<br>If-Range|
|Range Requests         |Range<br>If-Range|
|Caching                |Age<br>Cache-Control<br>Expires<br>Pragma<br>Warning|
|Authentication         |WWW-Authenticate<br>Authorization<br>Proxy-Authenticate<br>Proxy-Authorization|

## 参考资料
[https://httpwg.org/specs/](https://httpwg.org/specs/)
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