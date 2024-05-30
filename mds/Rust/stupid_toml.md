# 分析与结论

TOML最愚蠢的地方有两点：

1. 语法及其繁琐低效，导致toml格式文件体积膨胀，同时难以阅读。
2. 人类无法从toml中轻易推断出数据的层次结构，难以阅读。

而上述缺点的根本原因在于：

1. TOML自作聪明地删除了缩进机制，因此**不得不在键名中编码数据的层次结构**（通过点分隔符）
2. 将**数据类型也编码到了键名中**，导致无数的方括号

因此可以得出结论：

如果写一些**简单的，单层的，无需嵌套的，不含有数组类型元素**的配置文件，toml才能发挥优势。否则用JSON或者YAML更加有优势。



# 例子

表达一个table，TOML有多种方法：

```toml
# 通过"点分隔键"来表示，这就是所谓的无需缩进来表示数据的层次结构的方法。然而这毫无用处，因为人类不可读
a3.x = "x"
a3.y = "y"

# 紧凑的表示方式，能够轻松表达复杂嵌套，但如果我用了这种所谓的紧凑，那和JSON基本没区别
a1 = { x = "x", y = "y" }

# 对简单的、单层的、无需嵌套的数据结构来说，这样表示确实会容易读一些
[a2]
x = "x"
y = "y"

# 但一旦涉及嵌套，那么就是一个噩梦
[a4]
x = "x"
y = "y"

[a4.z] # 注意：这条粉肠不是独立的！而是a4的一部分，键名包含了数据的层次结构关系！
v= "z"


```

它和以下JSON是等价的

```json
{
  "a1": {
    "x": "x",
    "y": "y"
  },
  "a2": {
    "x": "x",
    "y": "y"
  },
  "a3": {
    "x": "x",
    "y": "y"
  },
  "a4": {
    "x": "x",
    "y": "y",
    "z": {
      "v": "z"
    }
  }
}
```



再来看一个更加明显的例子：

```toml
[[fruits]] # -------------------数组第1个元素的开始
name = "apple"

[fruits.physical]  # 第1个元素中包含一个table类型的属性
color = "red"
shape = "round"

[[fruits.varieties]]  # 第1个元素中包含一个数组类型的属性，这个数组的元素又是table类型
name = "red delicious"

[[fruits.varieties]] # 又是一个因为数组类型而出现的重复
name = "granny smith"

[[fruits]] # -------------------数组第2个元素的开始
name = "banana"

[[fruits.varieties]]
name = "plantain"
```

1. 因为`fruits`是一个表数组，因此数组中的每一项都必须重复出现`[[fruits]]`，当数组元素的数量稍微多一点点，那么这又是一个噩梦。
2. `[fruits.physical]`和`[[fruits.varieties]]`之所以如此难读，因为键名里编码了**层次结构和数据类型**。
3. 从整体上来看，完全无法像JSON那样一目了然发现层次结构（通过IDE的折叠辅助）



# 参考

* [What is wrong with TOML?](https://hitchdev.com/strictyaml/why-not/toml/#1-its-very-verbose-its-not-dry-its-syntactically-noisy)

  > 1. It's very verbose. It's not DRY. It's syntactically noisy.
  > 2. TOML's hierarchies are difficult to infer from syntax alone
  > 3. Overcomplication: Like YAML, TOML has too many features
  > 4. Syntax typing

* [what the fuck do you all see in toml](https://devrant.com/search?term=what+the+fuck+do+you+all+see+in+toml)

  > * it does not claim to care about indentation but it actually does
  >
  > * nested datastructures are a nightmare, especially 'inline' for 'readability'
  > * oh fuck me everything must be "double quotes"
  > * booleans always lowercase, there is no "truthy" here.
  > * Tables are not intuitive at all.
  >
  > And all this from working with it first time because I had the silly idea to modernize a python project to use pyproject.toml
  >
  > Oh and don't get me started on pyproject.toml files. The documentation sucks!





