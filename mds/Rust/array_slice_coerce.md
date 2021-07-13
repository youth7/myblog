有以下代码片段

```rust
    let  mut array = [1,2,3,4,5];
    let  array_ref = &mut array;
    // reverse是slice上的方法，而但array_ref类型是array的reference，它没有reverse方法
    // 所以array_ref是何如通过 自动解引用/自动引用 ，从而实现调用reverse方法？
    array_ref.reverse();
```

问题可以归纳为：

对于类型A：`&mut [{integer}; 5]`

对于类型B：`&mut [{integer};]`

为何能在类型A上调用reverse`方法？这个方法只存在于类型B上



解答：这涉及到type-coercions，可以参考:

https://doc.rust-lang.org/reference/type-coercions.html

https://www.possiblerust.com/guide/what-can-coerce-and-where-in-rust

而本文中的例子就属于[Unsized Coercions](https://doc.rust-lang.org/reference/type-coercions.html#unsized-coercions)。