# 关于引用的理解

Rust中的引用和C中的有明显不同的地方，理解引用应该包含以下几个方面：

* 指向某块内存的一个指针，这和C是一样的。
* 是一种primitive type，但从**使用的角度来看和原始值几乎没有区别，这是因为Rust中的自动引用/解引用**。
* 表示对原始值的借用，意味着给函数传参的时候**不会转移所有权，不需要消费掉参数**。

个人认为在理解引用的时候，需要强化2和3。此外生成引号的符号`&`和C中的`&`也有区别，C中的语义更加倾向于“获取内存地址”；而Rust中因为自动引用/解引用的原因，“获取内存地址”的意味变弱了。

# 自动引用和自动解引用


* 当deref的时候，尝试无数次，例如：`(&&String -> &String -> String -> str)`,此时遵循的规范是实现trait`Deref<Target = U>`
* 当reference的时候，最多尝试一次，例如：`(str -> &str)`

>this answer seems exhaustive and detailed but I
 think it lacks a short and accessible summery of the rules. One such 
summery is given in this comment by Shepmaster: "It [the deref algorithm] will deref as many times as possible (&&String -> &String -> String -> str) and then reference at max once (str -> &str)"



* 自动解引用：https://stackoverflow.com/questions/28519997/what-are-rusts-exact-auto-dereferencing-rules
* 自动引用：https://doc.rust-lang.org/book/ch05-03-method-syntax.html#wheres-the---operator



另外可以参考一下[数组和切片类型转换](./array_slice_coerce.md)

