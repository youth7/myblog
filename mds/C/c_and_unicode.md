


# 约定
文中的论述是基于以下软件环境：
* C语言规范：[C11](http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
* Clang：Clang4.0.1（on Windows10 with visual studio 2015）
* GCC：GCC7.1.1（on Fedora26）
* 源文件采用UTF8编码，意味着使用Unicode字符集

# 疑惑
最近研究书写C的源文件所用字符集时候，看到一些稍稍有所不同的C语言，下面的的程序分别使用了GCC7 和Clang进行编译：
```C
//Clang可以通过编译，GCC不行
#include<stdio.h>
int main(void){
	int 一个变量 = 100;
	printf("%d\n",一个变量);
};
```

```C
//Clang和GCC中都无法通过编译（工农联盟居然无法通过编译）
#include<stdio.h>
int main(void){
	int ☭ = 100;
	printf("%d\n",☭);
};
```

```C
//Clang可以通过编译，GCC不行
#include<stdio.h>
int main(void){
	int ❶ = 100;
	printf("%d\n",❶);
};
```

```C
//Clang和GCC都可以
#include<stdio.h>
int main(void){
	int \u4e00\u4e2a\u53d8\u91cf = 100;
	printf("%d\n",\u4e00\u4e2a\u53d8\u91cf);
};
```

回答这个问题涉及到C11和相关的实现。

# C11中关于字符集的规定
在C11的5.2.1中指出C语言中有两套字符集，分别是是
* **源文件字符集（source character set）**（书写C语言的源文件所使用的字符集）
* **运行字符集（execution character set）**（执行编译之后的C语言程序所使用的字符集）

而他们又分别被划分为两部分：**基础字符集（base character set）** 和 **扩展字符集（extended charcter set**），即关系如下：
* 源文件字符集
	* **基础源文件字符集（base source character set）**
	* **扩展源文件字符集（extended source charcter set）**
* 运行字符集
	* **基础运行字符集（base execution character set）**
	* **扩展运行字符集（extended execution charcter set）**

## 关于基础字符集
基础源文件字符集和基础运行字符集非常相似都不完全相同，他们相同的部分是都包含以下字符：

* 26个小写英文字母（a~z）
* 26个大写英文字母（A~Z）
* 10个阿拉伯数字（0~9）
* 29个标点符号
	```C
		! " # % & ' ( ) * + , - . / : ; < = > ? [ \ ] ^ _ { | } ~
	```
* 4个空白字符
	```C
		空格 水平制表符 垂直制表符 换页符
	```

不同之处是：

基础源文件字符集：包含一个新行符（new-line）用来标明源文件中一行的结束。

基础运行字符集：包含一系列的控制字符，例如响铃，退格，回车，新行。

## 关于扩展字符集
C11对扩展源文件/运行字符集有一系列的规定，其中以下几条跟我们的问题有关：
* 两者都是由具体实现定义的（即支持什么样的字符集，由编译器自行决定）
* 两者都必须兼容基础字符集
* 两者都可以包括多字节字符（multibyte character）
* 对于扩展源文件字符集，程序中的标识符、注释、字符串、字符常量、头文件名，必须由一系列的多字节字符组成（注意多字节字符集兼容基础字符集）

从上可知扩展字符集是可以作为变量名称，而Clang从3.3开始就支持Unicode作为扩展字符集，因此

```C
	int 一个变量 = 100;
	int ❶ = 100;
```
是符合规范的，因此可以通过编译。

但是为何
```C
int ☭ = 100;
```
无法通过编译呢？这个我们通过

## 关于Unicode和标识符
C11的6.4.2.1中指出，标识符可以由下列字符组成
* 非数字字符（即a~z、A~Z和_）
* Universal Character Name
* 其它由实现定义的字符集（即扩展字符集）

Universal Character Name用来表示基础字符集中无法表示的字符，可以用在标识符、字符串、字符常量中。引用它的形式是\unnnn或者\Unnnnnnnn（n是16进制表示的数字），nnnn和nnnnnnnn就是一个字符在ISO/IEC 10646中的值。
并不是所有的Universal Character Name都可以用作标识符，规范的附录中指定了合法的Universal Character Name的范围，现摘录部分如下所示：

* 00A8, 00AA, 00AD, 00AF, 00B2−00B5, 00B7−00BA, 00BC−00BE, 00C0−00D6, 00D8−00F6, 00F8−00FF
* 0100−167F, 1681−180D, 180F−1FFF
* 200B−200D, 202A−202E, 203F−2040, 2054, 2060−206F
* 2070−218F, 2460−24FF, 2776−2793, 2C00−2DFF, 2E80−2FFF
* 3004−3007, 3021−302F, 3031−303F
* 3040−D7FF
* F900−FD3D, FD40−FDCF, FDF0−FE44, FE47−FFFD
* 10000−1FFFD, 20000−2FFFD, 30000−3FFFD, 40000−4FFFD, 50000−5FFFD, 60000−6FFFD, 70000−7FFFD, 80000−8FFFD, 90000−9FFFD, A0000−AFFFD, B0000−BFFFD, C0000−CFFFD, D0000−DFFFD, E0000−EFFFD

由此可知
```C
int \u4e00\u4e2a\u53d8\u91cf = 100;
```
是合法的，它的每个字符的码点都落在上面第8条的范围。

## Unicode和ISO/IEC 10646

虽然ISO/IEC 10646和Unicode具有细微的差别，但基本上可以认为是一回事。从[这里](https://en.wikipedia.org/wiki/Universal_Coded_Character_Set#Encoding_forms)我们可以知道，Unicode和ISO/IEC 10646具有相同的字符，但是Unicode比ISO/IEC 10646具有更多的规则，可以说ISO/IEC 10646就是Unicode的子集。


需要注意的是，扩展字符集和Universal Character Name是两回事，不能混为一谈。理论上来说扩展字符集可以是任意字符集（例如GBK）。但是从实践上来说，如果这个字符集可以支持足够多的字符那么是非常好的，因此Clang选择Unicode作为扩展字符集是非常自然的。因为Universal Character Name和Unicode几乎等价，因此Universal Character Name的规则完全适用于Unicode。

回到我们之前的例子，这代码

```C
int ☭ = 100;
```
之所以无法通过编译，是因为☭的值是262D，不在附录规定的范围中，因此是不合法的字符。将☭换成\u262D也是无法通过编译，从侧面证明了这个事实。而

```C
int ❶ = 100;
```
可以通过编译，是以为❶的值是2776，在附录规定的范围中，因此可以通过编译。

## 关于其它字符集的扩展字符集

扩展字符集有没有可能使用GBK呢，我后来特意将文件改成GBK编码，结果连Clang也无法编译文件了。仔细想想这也是正常，作为Clang开发人员，它们在选择扩展字符集的时候，肯定希望这个字符集最好能容纳世界上所有的文字，因此选Unicode是理所当然的。那如果源文件采用了其它类型的字符集怎么办呢，在阅读GCC手册时候发现了一个这样的选项-finput-charset，它会将其它字符集转换为自身支持的字符集，算是一种补充。然而我试了下发现并不起作用，因此为了移植性，选择基础字符集来写源码是最为妥当的选择。


