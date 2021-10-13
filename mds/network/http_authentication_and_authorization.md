# HTTP验证框架及其基本流程

这个协议没有定义具体的验证方案，只是提供了一个框架（主体流程）用来确定交互的主体流程。它主要确定了以下几点：

* client请求server时，server告知需要身份验证，并通过`header`指明验证的方式和相关参数

  * ```http
    WWW-Authenticate: <type> realm=<realm>
    ```

* client根据server的验证提示信息，采用相关方案进行验证，并通过`header`提交凭证

  * ```http
    Authorization: <type> <credentials>
    ```

* server告知验证的结果
  * 200后者403





# 各种验证方案：

- **Basic** (查看 [RFC 7617](https://tools.ietf.org/html/rfc7617), base64编码凭证),
- **Bearer** (查看 [RFC 6750](https://tools.ietf.org/html/rfc6750), bearer 令牌通过OAuth 2.0保护资源),
- **Digest** (查看 [RFC 7616](https://tools.ietf.org/html/rfc7616), 只有 md5 散列 在Firefox中支持, 查看 [bug 472823](https://bugzilla.mozilla.org/show_bug.cgi?id=472823) 用于SHA加密支持)
- **HOBA** (查看 [RFC 7486](https://tools.ietf.org/html/rfc7486) (草案), **H**TTP **O**rigin-**B**ound 认证, 基于数字签名)
- **Mutual** (查看 [draft-ietf-httpauth-mutual](https://tools.ietf.org/html/draft-ietf-httpauth-mutual-11))
- **AWS4-HMAC-SHA256** (查看 [AWS docs](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-auth-using-authorization-header.html))







# 参考

https://insights.thoughtworks.cn/api-2/

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication