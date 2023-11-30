# 奇怪的现象


```rust
use std::time::SystemTime;
fn main() {
    let start = SystemTime::now();
    println!("🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡  {:?}", start);
    println!("只要加入下面那句，就每次都能输出？？？");    
    println!("cargo:rerun-if-changed=main.rs");
}
```

观察到一个奇怪的现象是：每次使用`cargo run -vv`运行控制台都会输出，即使*main.rs*没有改动，观察到控制台有输出如下：

```bash
       Dirty new_test v0.1.0 (/home/dmai/workspace/rust/my_test): the file `main.rs` is missing
   Compiling new_test v0.1.0 (/home/dmai/workspace/rust/my_test)
```

猜测是因为`cargo:rerun-if-changed=main.rs`中对文件的查找是基于*build.rs*所在的目录，显然这是肯定找不到*main.rs*的，因此必须重新运行构建脚本（删除也是一种修改），改为`cargo:rerun-if-changed=./src/main.rs`后一切符合预期。

其实控制台的输出里面包含了当前运行是否调用了构建脚本及其的原因，例如：

```bash
cargo run -vv
       Dirty new_test v0.1.0 (/home/dmai/workspace/rust/my_test): the file `src/main.rs` has changed (1701342777.446938375s, 2m 53s after last build at 1701342604.972919207s)
   Compiling new_test v0.1.0 (/home/dmai/workspace/rust/my_test)
   ...
#说明因为main.rs的内容改变了使得构建脚本被调用
```

```bash
 cargo run -vv
       Dirty new_test v0.1.0 (/home/dmai/workspace/rust/my_test): the file `build.rs` has changed (1701343161.068326373s, 9m 17s after last build at 1701342604.756911669s)
   Compiling new_test v0.1.0 (/home/dmai/workspace/rust/my_test)
   ...
# 说明因为build.rs的内容改变了使得构建脚本被调用   
```

除此之外还有一些其他文件修改导致的运行，例如：

```bash
Dirty new_test v0.1.0 (/home/dmai/workspace/rust/my_test): the local fingerprint type changed
# 不知道什么修改了

Dirty new_test v0.1.0 (/home/dmai/workspace/rust/my_test): stale, unknown reason
# 删除了编译后的产物
```



# 问题的延伸

对*main.rs*修改后运行`cargo run -vv`，根据cargo命令行的说明，使用了`-vv`选项后控制台会显示*build.rs*的输出，但Windows和Linux有着不同的表现：

* Linux上完全遵循文档的描述，*build.rs*中的输出会在控制台显示
* Windows只在首次编译运行时才显示*build.rs*的输出

比较了下两者在控制台的输出后，发现原因是编译后的*build.rs*的二进制产物*/target/debug/build/项目名称相关/build-script-build*在Windows下没有得到执行，原因不明。



还有一个地方是，Windows对构建脚本重新运行的原因描述不同于Linux：

```bash
cargo run -vv
       Dirty new_test v0.1.0 (D:\workspace\rust\new_test): the dependency build_script_build was rebuilt
# 在Linux下这里会显示"the file `src/main.rs` has changed"       
```



另外一个更为诡异的现象是，**在Windows中如果`main.rs`被修改了，即使不主动运行`cargo run -vv`，output文件也会自动生成**。Windows上各种现象文档中都没有描述，还是Linux更加符合文档的描述。



