网上关于JWT的介绍很多，然后真正从零开始实现一个JWT的例子几乎没有，于是参照着文档写了一个小例子帮助理解

```js
(function () {
    const crypto = require("crypto");
    function base64URL(content) {
        if (!(content instanceof Buffer)) {
            content = Buffer.from(JSON.stringify(content)).toString("base64");
        }
        return content.toString("base64")
            .replaceAll("=", "")
            .replaceAll("+", "-")
            .replaceAll("/", "_")

    }
    let header = {
        "alg": "HS256",
        "typ": "JWT"
    };
    let playload = {
        "sub": "1234567890",
        "name": "雷猴雷猴",
        "iat": 1516239022
    }


    const hmac = crypto.createHmac("SHA256", "123");
    header = base64URL(header);
    playload = base64URL(playload);
    hmac.update(`${header}.${playload}`);
    let signature = hmac.digest();
    signature = base64URL(signature);
    console.log("最终生成的token是", `${header}.${playload}.${signature}`);

}())

```



参考资料：

* https://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html
* https://jwt.io/