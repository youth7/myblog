# serde_json

要解决的核心问题有：

* serde_json中表示JSON的原生对象（即`serde_json::Value`），字符串`&str`，Rust中各种自定义的`struct`之间的转换关系，即：`&str`  **⇔**  `Value`  **⇔**  `struct`
* `Value`中的属性如何访问，分为`Value`的结构已知和未知两种情况



![](../../imgs/rust_json.jpg)

## `&str`  **⇔**  `serde_json::Value` 

**`&str`  到  `Value` 的转换：**

```rust
use serde_json::{json, Value};
fn main() -> () {
    //方法1：rust原生字符串到Value
    let data = r#"
    {
        "name": "John Doe",
        "age": 43,
        "phones": ["+44 1234567", "+44 2345678"]
    }"#;
    let v: Value = serde_json::from_str(data).unwrap();
    println!("first phone number: {}, age is {}", v["phones"][0], v["age"]);

    //方法2：原生JSON写法到Value，姑且也算是字符串的一种方式
    let v: Value = json!({
        "name": "John Doe",
        "age": 43,
        "phones": ["+44 1234567", "+44 2345678"]
    });
    println!("first phone number: {}, age is {}", v["phones"][0], v["age"]);
}
```



 **`Value`到`&str` 的转换：**

```rust
fn main() -> () {
    let v: Value = json!({
        "name": "John Doe",
        "age": 43,
        "phones": ["+44 1234567", "+44 2345678"]
    });
    //方法1：
    println!("{}", v.to_string().as_str());

    //方法2：
    println!("{}", serde_json::to_string(&v).unwrap().as_str());
}
```






##  `Value`  **⇔**  `struct`

 **`Value`到`struct` 的转换：**

没有直接支持的方式，但`Value`到各种原始类型有支持，例如各种`to_xxx()`方法



**`struct`到`Value` 的转换：**

没有直接支持的方式，需要先转为JSON字符串再转为`Value`
