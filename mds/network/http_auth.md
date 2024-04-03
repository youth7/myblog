# HTTP验证框架及其基本流程

![imgs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication/http-auth-sequence-diagram.png)



这个协议没有定义具体的验证方案，只是提供了一个框架（主体流程）用来确定交互的主体流程。它主要确定了以下几点：

* client请求server时，server发出challenge要求验证client的身份，具体的验证方式通过http的`WWW-Authenticate`首部指定，格式如下：

  ```http
  WWW-Authenticate: <type> realm=<realm>
  ```

  * `type`：指明了验证方案（可用的方案下面会讨论），

  * `realm`：表明了该验证保护的范围，用户可以通过这个值来判断他们正在试图访问哪一空间。

* client根据server的challenge，通过http的`Authorization`首部提交身份凭证，格式如下：

  ```http
  Authorization: <type> <credentials>
  ```

  * `type`：指明了验证方案（一般来说跟challenge中要求的`type`一致）
  * `credentials`：身份凭证，它可以编码或者加密，server经过解码或者解密后得知凭证真实内容

  





# `type`中支持各种验证方案：

- **Basic** (查看 [RFC 7617](https://tools.ietf.org/html/rfc7617), base64编码凭证)，细节可以参考[这里](https://zh.m.wikipedia.org/zh-hans/HTTP%E5%9F%BA%E6%9C%AC%E8%AE%A4%E8%AF%81)和[这里](https://en.wikipedia.org/wiki/Basic_access_authentication)
- **Bearer** (查看 [RFC 6750](https://tools.ietf.org/html/rfc6750), 这种类型的令牌使用OAuth 2.0协议来保护资源),
- **Digest** (查看 [RFC 7616](https://tools.ietf.org/html/rfc7616), 只有 md5 散列 在Firefox中支持, 查看 [bug 472823](https://bugzilla.mozilla.org/show_bug.cgi?id=472823) 用于SHA加密支持)
- **HOBA** (查看 [RFC 7486](https://tools.ietf.org/html/rfc7486) (草案), **H**TTP **O**rigin-**B**ound 认证, 基于数字签名)
- **Mutual** (查看 [draft-ietf-httpauth-mutual](https://tools.ietf.org/html/draft-ietf-httpauth-mutual-11))
- **AWS4-HMAC-SHA256** (查看 [AWS docs](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html))





# 计算机网络通信过程中的几个问题

公钥：简称为pub_key

私钥：简称为prv_key

当提及AB双方使用非对称加密通讯时候，通常指A



* A和B通讯，如何防止**窃听**？

  答：使用**非对称加密**，具体如下：

  1. A生成公钥和私钥，私钥自己保留，公钥对外公布
  2. B用公钥对发送给A的数据（简称data）加密，得到e_data，将e_data发送给A
  3. A用私钥对e_data解密
  4. A向B发送消息也使用如上机制

  信息即使被中途截取也无法被解密窥视，因为缺少私钥

* A和B通讯，双方如何防止自己的消息被**伪造和篡改**）？

  答：使用**数字签名**，即私钥签名，公钥验签，具体如下：

  1. B生成公钥和私钥，私钥自己保留，公钥对外公布
  2. B对自己发送的数据（简称为data）生成一个hash
  3. B用私钥对hash进行加密，生成S
  4. B将{data, S}一起发送给A
  5. A用公钥解密S得到hash，并对data生成hash2，比较hash和hash2，如果相等即表示B的信息没有被篡改
  6. A向B发送消息也使用如上机制

* 上述两部都依赖于公钥的正确传播，如何防止中间人**拦截并替换公钥**？

  答：找证书中心（certificate authority，简称CA），为公钥做认证。

  1. 证书中心用**自己的私钥**，对A的公钥和一些相关信息一起加密，生成"数字证书"（Digital Certificate）。
  2. A发送消息给B的时候，需要附带上数字证书
  3. B拿到A的数字证书后，用CA的公钥解密，检验B的公钥是否原装正版
  4. CA的公钥是操作系统出厂时候就内置的，是所有信任的起点



> * **用私钥加密的信息的过程我们称之为：数字签名**
>
> * [数字签名是什么？](https://www.ruanyifeng.com/blog/2011/08/what_is_a_digital_signature.html)
>
> * [数字签名/数字证书/对称/非对称加密/CA 等概念明晰](https://juejin.cn/post/7032540460774080543#heading-6)            





# 参考

https://insights.thoughtworks.cn/api-2/

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication