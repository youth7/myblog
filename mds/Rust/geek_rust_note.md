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

   * 所有权检查分为静态动态两种，静态即编译时检查。动态即以`Rc` /`ARC` /`Cell`/ `RefCell`为代表的一系列智能指针在运行时检查是否满足所有权的3条规则。



2. 通过所有所有权机制进行内存管理，解决了以下问题：

   * 资源自动释放，**它使得在一般情况下，堆上和栈上数据的生命周期一致了**

   * 防止数据被意外修改，同一时刻，一个值只有1个可变引用或者多个不可变引用

> 所有权规则（编译时检查）：
>
> - Each value in Rust has an *owner*.
> - There can only be one owner at a time.
> - When the owner goes out of scope, the value will be dropped.





## 生命周期

* 重要的只有一句话：**生命周期的标记只是函数签名的一部分，它描述了入参和返回值的关系，不改变系统中任何对象的生命周期**。

* 生命周期的作用：防止读取到内存中的无效单元

![](/imgs/rust_lifetimes.jpg)



## 内存管理

**值的创建**

* 栈上放胖指针，堆上放数据，绝大部分的Rust对象都是这种关系的。胖指针就是各种原生或者自定义的类型，例如以下代码：

  ```rust
  let s = String::from("hi");//s的类型String，是一个胖指针，在语义上来讲是owner
  let rs = &s;// rs的类型&String，它是一个引用，在语义上来讲是borrow
  ```

  | 对象                 | 语义   | 类型/分配                                |
  | -------------------- | ------ | ---------------------------------------- |
  | `s`                  | owner  | `String`这个结构体（胖指针），分配在栈上 |
  | `&s`                 | borrow | 是一个`&String`（非胖指针），分配在栈上  |
  | `String::from("hi")` | value  | 分配在堆上的二进制数据                   |

  

* `Option`、`Result`对引用类数据的优化

**值的销毁**

* `Drop` trait

* `RAII`

  

## 类型系统

## 数据结构

## 错误处理

## 闭包



# 03 期中测试

# 04 进阶篇

# 05 并发篇

# 06 实战篇

# 07 高级篇

# 08 学习锦囊