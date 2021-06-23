
* 当deref的时候，尝试无数次，例如：`(&&String -> &String -> String -> str)`,此时遵循的规范是实现trait`Deref<Target = U>`
* 当reference的时候，最多尝试一次，例如：`(str -> &str)`

>this answer seems exhaustive and detailed but I
 think it lacks a short and accessible summery of the rules. One such 
summery is given in this comment by Shepmaster: "It [the deref algorithm] will deref as many times as possible (&&String -> &String -> String -> str) and then reference at max once (str -> &str)"



* 自动解引用：https://stackoverflow.com/questions/28519997/what-are-rusts-exact-auto-dereferencing-rules
* 自动引用：https://doc.rust-lang.org/book/ch05-03-method-syntax.html#wheres-the---operator


