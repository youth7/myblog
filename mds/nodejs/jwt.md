网上关于JWT的介绍很多，然后真正从零开始实现一个JWT的例子几乎没有，于是参照着文档写了一个小例子帮助理解

```js
const crypto = require("crypto");
function base64(content) {
    if (content instanceof Buffer) {
        return content.toString("base64").replace("=", "");
    }
    return Buffer.from(JSON.stringify(content)).toString("base64").replace(/=/g, "");

}
const header = {
    "alg": "HS256",
    "typ": "JWT"
};
const playload = {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
}


const hmac = crypto.createHmac("SHA256", "123");
const h = base64(header);
const p = base64(playload);
hmac.update(`${h}.${p}`);
const token = hmac.digest();

console.log("最终生成的token是", base64(token));
```

>注意：base64的几个标准之间有一些细微的差异，上述代码的输出或许跟一些在线进行base64加密的应用稍有区别