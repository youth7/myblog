
# 核心语义
Makefile文件由一系列规则（rules）构成。每条规则的形式如下：
```makefile
<target>:[prerequisites] 
tab[recipe]
```

1. `target`：是必需的，不可省略

2. `prerequisites`：可选

3. `recipe`（以及前面的tab符）：可选

2和3都是可选，**但是两者之中必须至少存在一个**。



每条规则就明确两件事：

* 构建`target`的前置条件是什么（`prerequisites`）
* 如何构建`target`（`recipe`）



`target`通常是**被生成的文件的名称**，还可以是一个**标签名称**（这种称为*伪目标*，暂时先不讨论）。`prerequisites`中如果有一个以上的文件比`target`要新的话，`recipe`所定义的命令就会被执行。



假设有以下`makefile`文件

```makefile
a.out:
	gcc main.c	
```

则可以这样执行它

```bash
$ make
gcc main.c
```
