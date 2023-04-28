# 00 开篇词

## 值放堆上还是栈上

* **学习难点**：类型系统、泛型、并发安全

* **学习核心**：软件开发的核心概念（包括：堆、栈、函数、闭包、虚表、泛型、同步和异步等 ） ，**编程语言不过是软件开发核心概念的具体表述和载体**



## 基本概念

**数据：**

原生类型（primitive type）：所有原生类型见[这里](https://doc.rust-lang.org/stable/std/index.html#primitives)，Rust的原生类型比C语言丰富太多，例如以下几种类型居然也是原生的：

- [array](https://doc.rust-lang.org/stable/std/primitive.array.html)
- [fn](https://doc.rust-lang.org/stable/std/primitive.fn.html)
- [pointer](https://doc.rust-lang.org/stable/std/primitive.pointer.html)
- [reference](https://doc.rust-lang.org/stable/std/primitive.reference.html)
- [str](https://doc.rust-lang.org/stable/std/primitive.str.html)
- [tuple](https://doc.rust-lang.org/stable/std/primitive.tuple.html)

需要注意`reference`和`pointer`的区别，`reference`比`pointer`携带了更加多的信息（例如胖指针），更加安全（不能指向null），但也受到一些限制（只能解引用为原来的数据类型）。



# 01 前置篇

* stack上的数据：是静态的，指**静态大小**（编译器就能确定数据的大小），**静态生命周期**（与栈的生命周期一致）。其实这也不是绝对的，**例如`alloca()`就可以动态地在栈上分配内存**，C语言中的可变参也是分配在栈上的。但因为stack是较小且有限的，在上面动态分配空间容易导致溢出类问题。
* heap上的数据：是动态的，指动态大小（运行期间大小可能会改变），动态生命周期（可能会被多个栈引用）

# 02 基础篇

## 所有权

1. 关于所有权的一些要点：

   * **分清楚owner/value/reference/borrow，见下面*值的创建*相关讨论，这是重中之重**

   * 要注意区分引用和借用的关系，官方文档中有：

     > We call the action of creating a reference *borrowing*

   * Rust函数调用的时候**所有权会转移，例如`func(var)`并不会自动自动转为`func(&var)`并造成所有权转移**。



2. 通过所有所有权机制进行内存管理，解决了以下问题：

   * 资源自动释放，**它使得在一般情况下，堆上和栈上数据的生命周期一致了**

   * 防止数据被意外修改，同一时刻，一个值只有1个可变引用或者多个不可变引用

    > 所有权规则（编译时检查）：
    >
    > - Each value in Rust has an *owner*.
    > - There can only be one owner at a time.
    > - When the owner goes out of scope, the value will be dropped.



3. `Rc/Arc`提供了共享所有权（所有权规则的一个例外？），`Cell/RefCell`提供了内部可变性。这意味着除了`Rc/Arc`，其它标准库的数据对象都满足所有权规则。

   |            | 语法                | 所有权检查（3条规则）  |
   | ---------- | ------------------- | ---------------------- |
   | 外部可变性 | `let mut`或者`&mut` | 编译时检查（静态检查） |
   | 内部可变性 | 使用`Cell/RefCell`  | 运行时检查（动态检查） |

   



## 生命周期

* 重要的只有一句话：**生命周期的标记只是函数签名的一部分，它描述了入参和返回值的关系，不改变系统中任何对象的生命周期**。

* 生命周期的作用：防止读取到内存中的无效单元

* 生命周期中最难以理解的一些误解
  * `T: 'static` vs `&'static T`，关于它的解释见参考资料。简单来说，前者的`T`包括了引用类型和所有权类型，反正**禁止含有非`'static`生命周期的引用**，因为当`T`为非`'static`引用的时候可能不能满足一些使用场景（例如跨线程），见参考4。


![](/imgs/rust_lifetimes.jpg)



参考：

* [Why does the compiler tell me to consider using a `let` binding" when I already am?](https://stackoverflow.com/questions/28893183/why-does-the-compiler-tell-me-to-consider-using-a-let-binding-when-i-already)
* [Rust 中常见的有关生命周期的误解](https://github.com/pretzelhammer/rust-blog/blob/master/posts/translations/zh-hans/common-rust-lifetime-misconceptions.md)
* https://practice.rs/lifetime/static.html
* [Learning Rust: static trait bounds](https://codeandbitters.com/static-trait-bound/)

## 内存管理

**值的创建**

* 栈上放胖指针，堆上放数据，绝大部分的Rust对象都是这种关系的。胖指针就是各种原生或者自定义的类型，例如以下代码：

  ```rust
  let s = String::from("hi");//s的类型String，是一个胖指针，在语义上来讲是owner
  let rs = &s;// rs的类型&String，它是一个引用，在语义上来讲是borrow
  ```

  | 对象                 | 语义              | 类型/分配                                |
  | -------------------- | ----------------- | ---------------------------------------- |
  | `s`                  | owner，所有权类型 | `String`这个结构体（胖指针），分配在栈上 |
  | `&s`                 | borrow，引用类型  | 是一个`&String`（非胖指针），分配在栈上  |
  | `String::from("hi")` | value             | 分配在堆上的二进制数据                   |

  关于胖指针可以参考[Exploring Rust fat pointers](https://iandouglasscott.com/2018/05/28/exploring-rust-fat-pointers/)

* `Option`、`Result`对引用类数据的优化

**值的销毁**

* `Drop` trait

* `RAII`

| 检查时机 | 编译时         | 运行时             |
| -------- | -------------- | ------------------ |
| 检查效果 | 高效、但不灵活 | 灵活、但有额外负担 |
| 检查位置 | 栈             | 堆                 |
| 检查机制 | borrow checker | 引用计数           |



## 类型系统

trait的作用：

* 行为抽象：
* 泛型约束：trait bound
* 抽象类型：trait object
* 标签trait：



多态：在使用相同的接口时，不同类型的对象，会采用不同的实现  

| 多态类型              | 实现技术     | 备注                                            |
| --------------------- | ------------ | ----------------------------------------------- |
| 参数多态              | 泛型         | 包含泛型数据结构和泛型函数                      |
| adhoc多态（特设多态） | trait        | 指同一种行为有很多不同的实现（正是trait的用途） |
| 子类型多态            | trait object |                                                 |



### 参数多态（泛型）

* 注意**泛型**和**泛型约束**是不一样的，可以随便使用一个符号代表泛型，但是**泛型约束必须是trait**
* 在泛型函数的参数中，有若干种表示方式：
  * 直接使用泛型
  * `impl Trait`，静态分派，
  * `&dyn Trait`是动态分派，trait早期意思有点模糊，具有trait和type双重含义，具体看[这里](https://stackoverflow.com/questions/50650070/what-does-dyn-mean-in-a-type)

例子：

```rust
fn test<T1>(   //另外一个泛型参数
    a: &dyn T, //trait object，动态分派
    e: impl T, //静态分派，编译时最终会有确定的类型
    d: T1,     //即impl T vs 普通泛型，见第2条参考
    b: Bar,    //注意：这是一个struct
    c: &Bar,   //注意：这是一个struct的引用
) {
}
```





泛型单态化的优缺点：

* 优点：
  * 高效，没有运行时代价
* 缺点：
  * 编译速度慢
  * 编译结果体积大
  * 以二进制发布的话会丢失泛型信息



参考：

https://www.ncameron.org/blog/dyn-trait-and-impl-trait-in-rust/

https://doc.rust-lang.org/reference/types/impl-trait.html



### adhoc多态（特设多态）

### 子类型多态



## 数据结构

## 错误处理

## 闭包



# 03 期中测试

# 04 进阶篇

# 05 并发篇

# 06 实战篇

# 07 高级篇

# 08 学习锦囊