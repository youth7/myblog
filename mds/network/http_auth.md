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

- **Basic** (查看 [RFC 7617](https://tools.ietf.org/html/rfc7617), base64编码凭证),
  - 细节可以参考[这里](https://zh.m.wikipedia.org/zh-hans/HTTP%E5%9F%BA%E6%9C%AC%E8%AE%A4%E8%AF%81)和[这里](https://en.wikipedia.org/wiki/Basic_access_authentication)
- **Bearer** (查看 [RFC 6750](https://tools.ietf.org/html/rfc6750), bearer 令牌通过OAuth 2.0保护资源),
- **Digest** (查看 [RFC 7616](https://tools.ietf.org/html/rfc7616), 只有 md5 散列 在Firefox中支持, 查看 [bug 472823](https://bugzilla.mozilla.org/show_bug.cgi?id=472823) 用于SHA加密支持)
- **HOBA** (查看 [RFC 7486](https://tools.ietf.org/html/rfc7486) (草案), **H**TTP **O**rigin-**B**ound 认证, 基于数字签名)
- **Mutual** (查看 [draft-ietf-httpauth-mutual](https://tools.ietf.org/html/draft-ietf-httpauth-mutual-11))
- **AWS4-HMAC-SHA256** (查看 [AWS docs](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html))







# 参考

https://insights.thoughtworks.cn/api-2/

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication