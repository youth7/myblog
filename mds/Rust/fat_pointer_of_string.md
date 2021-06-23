
众所周知Rust的胖指针由[三部分构成](https://zhuanlan.zhihu.com/p/103847632)，但是没有亲自写程序验证过心里还是没底，以下程序就是用类C的方式验证了胖指针的构成

```rust
/// 将指针的值增加一定的值，使其指向不同的内存地址
fn increase_value_of_ptr<From, To>(ptr: *const From, step: u64) -> *const To {
    let mut ptr_vlaue = ptr as u64;
    ptr_vlaue += step;
    return ptr_vlaue as *const To;
}


fn main() {
    let mut s = String::from("0123456789");
    s.push_str("qwertyuiop");
    s.push_str("asdfghjkl");
    let ptr = &s as *const String as *const u64;//获取胖指针在stack中的地址
    unsafe {
        let heap_addr = (*ptr) as *const u8; //胖指针第1部分的内容：heap中存储字符串的首地址
        let capacity = *increase_value_of_ptr::<u64, u64>(ptr, 8);//胖指针第2部分的内容：在heap中为为这个String分配的容量
        let length = *increase_value_of_ptr::<u64, u64>(ptr, 16);//胖指针第3部分的内容：这个String的当前长度
        println!("堆地址是{:?}\t 长度是{}\t 容量是{}\t",heap_addr, length, capacity);
        let mut i: u64 = 0;
        while i < length {
            let c = *increase_value_of_ptr::<u8, u8>(heap_addr, i) as char;
            print!("{}", c);
            i += 1;
        }
    }
}

```