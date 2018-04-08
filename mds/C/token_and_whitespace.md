


# 疑惑
刚开始学习C语言时候，看到的最基本的例子是这样子的
```
#include<stdio.h>
int main(void){
	printf("hello world\n");
}
```

后来发现还可以这样

```
#include<stdio.h>
int main(void){
	printf                   ("hello world\n");
}
```

甚至这样
```
#include<stdio.h>
int main(void){
	printf/*wtf?*/

	(


		"hello world\n"


	);
	printf("this \
		is \
		a \
		very \
		long \
		string\n");
	\
	\
	\

}

```
但是不可以这样
```
#include<stdio.h>
int main(void){//此时会报编译错误
	printf("hello 
	world\n");
}
```

后来仔细查了很多书籍和C的语言规范，才找到最终答案。

# token和white-space
一个C语言的源文件经过预处理之后产生一系列的token和white-space组成，它们是组成C语言的基本元素。token分为以下几种
* keyword（关键字）
* identifier（标识符）
* constant（常量）
* string-literal（字符串）
* punctuator（标点符号）

white-space则由以下符号组成
* 空格（键盘上的空格） 
* 水平制表符（键盘上的Tab）, 
* 换行（键盘上的回车键）
* 垂直制表符（无法从键盘直接输入，但是可以通过特殊方法输入） 
* 分页符（同上）
* 注释

C语言程序的书写规则可以总结为以下两条
* token之间可以插入0个或者多个white-space
* 如果不插入white-space会使得语义改变，则最少需要插入1个white-space。

以下面这段代码作为说明
```c
    int  a = 123;
//  ➏    ➐   ➑➒   
    printf ( "hello world\n" )    ;
//  ➊      ➋     ➌         ➍   ➎  
```
## 规则1

这段代码中的token分别是：

➏是关键字

➊➐是标识符

➑是常量

➌是字符串

➋➍➎➒是标点符号

按照上面说的规则1，这些token之间可以插入0个或者多个white-space，所以我们看到➊➋➌➍➎之间有若干空格，➑➒之间没有空格，这都是允许的。把空格换成其他类型的white-space也是可以的。


由于垂直制表符和分页符无法从键盘直接输入，我们可以通过以上的方式实现，在linux的bash中输入以下命令，其中\v和\f分别是垂直制表符和换页符。

```bash
echo -e "int main(void){int a\v =\f1;}" > test.c
```

## 规则2
➏➐之间的white-space是不可以省略的，因为它区分了标识符和关键字，如果省略这个white-space，则改变了语义且无法通过编译。

# 关于预处理
C语言的源码进入编译之前有一个预处理的步骤，在C11的5.1.1.2中值得注意的是：

* 源码中如果出现反斜杠(`/`)，并且后面跟着一个新行(new-line)字符的话，那么这个反斜杠和新行字符会一起删掉。只有当反斜杠出现在文件末尾的时候是例外。
* 注释会被替换成一个空格，新行符会被保留，剩下的所有white-space可能会被替换成一个空格或者原封不动，采取哪种处理最终由实现决定。

这就解释了为何上面的程序可以有多个反斜杠实现换行。

而在C11的6.4.5中对字符串的定义是这样的：
```C
可选的编码前缀"字符序列"
```
可选的编码前缀包括:
```C
u8 u U L
```
这意味着以下字符都是合法的:
```C
L"abc" u"abc"
```
字符序列则**不能直接包含双引号、反斜杠和新行字符，除非经过转义**。由此可知，上面不能通过编译的代码是因为它直接在字符串中添加了新行字符。
