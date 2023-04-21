众所周知Rust的胖指针由[三部分构成](https://zhuanlan.zhihu.com/p/103847632)（其实也不一定？因为胖指针语义上是owner，实现上是结构体，因此具体的胖指针内存布局跟数据结构相关），但是没有亲自写程序验证过心里还是没底，以下程序就是用类C的方式验证了胖指针的构成

```rust
// 将指针的值增加一定的值，使其指向不同的内存地址
fn increase_value_of_ptr<From, To>(ptr: *const From, step: u64) -> *const To {
    let mut ptr_vlaue = ptr as u64;
    ptr_vlaue += step;
    return ptr_vlaue as *const To;
}

fn main() {
    let mut s = String::from("0123456789");
    s.push_str("hello");
    s.push_str("world");
    let ptr = &s as *const String as *const u64; //获取胖指针在stack中的起始位置
    unsafe {
        let part1 = increase_value_of_ptr::<u64, u64>(ptr, 0); //胖指针的part1
        let part2 = increase_value_of_ptr::<u64, u64>(ptr, 8); //胖指针的part2
        let part3 = increase_value_of_ptr::<u64, u64>(ptr, 16); //胖指针的part3

        //严重注意！胖指针的内存布局跟编译器的实现相关，在当前版本（1.67.0）中，
        //它的布局是：容量,堆指针,长度。但是在老一些的版本中顺序是：堆指针,容量,长度,
        //依赖特定布局的程序是很危险的
        println!(
            "第1部分:{}\t 第2部分:{}\t 第3部分:{}\t",
            *part1, *part2, *part3
        );
        // 其实也可以用这个方法来快速分解胖指针每一部分的内容，但这毕竟没有手动解析那么清晰
        // use std::mem::transmute;
        // println!("{:?}",transmute::<_, (usize, usize, usize)>(s));
        println!("{:p} {:?}", s.as_bytes(), part2);
        let mut i: u64 = 0;
        while i < *part3 {
            //注意part2指向栈，*part2指向堆， **part2才是字符串的值
            let pointer_to_char = increase_value_of_ptr::<u8, u8>(*part2 as *const u8, i);
            print!("{:?} ", *pointer_to_char as char);
            i += 1;
        }
    }
}
```

参考：

* [Exploring Rust fat pointers](https://iandouglasscott.com/2018/05/28/exploring-rust-fat-pointers/)