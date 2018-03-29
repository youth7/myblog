


C中基本数据类型的转换是非常繁琐的，当发生下列情况时候会进行隐式转换

* 情况1：算术表达式或者逻辑表达式中操作数类型不同时候（也叫常用算数转换）

* 情况2：赋值表达式左右两侧的操作数类型不相同

* 情况3：函数调用时候，实参和形参类型不相同

* 情况4：函数的return语句返回的值跟函数声明的不一致

转换的策略大体上是：将两个操作数转换成另外一种类型的数据，这种类型的数据必须能安全容纳原来两个操作数，并且这种类型数据必须尽可能“狭小”。

# 关于整数提升（integer promotions）
C99中有一个整数等级的概念，优先级从高到低如下所示
```C
1，long long int , unsigned long long int
2，long int , unsigned long int
3，int , unsigned int
4，short int , unsigned short int
5，char , signed char, unsigned char
6，_Bool
```
任何等级低于int和unsigned int的整型，如果它所有的值都能够被int表示，则转换为int，否则转换为unsigned int（在16位的平台上面，unsigned short int的值无法全部被int 显示，因为都是16位，因此会被转换为unsigned int，32位之后的平台都不会有这个现象）。

这个行为称为整数提升，可以知道，_Bool和char经过提升之后都会变为int类型。

# 情况1
情况1又分为两种情况：
* 如果任意一个操作数是浮点数：
	- 此时如果任意一个数字是long double，则把另外一个数字转化为long double
	- 此时如果任意一个数字是double，则把另外一个数字转化为double
	- 此时如果任意一个数字是float，则把另外一个数字转化为float

* 两个操作数（假设是m和n）都不是浮点数：
	- 首先对m n进行整数提升
	- 如果m n都是有符号或者无符号，则较窄那个的类型，会被转换成较宽的那个类型。
	- 如果m是无符号，n是有符号，且m的宽度大于n，则n的类型转换为m的类型
	- 如果m是无符号，n是有符号，且n的值域能够包含m的值域，则m的类型转换为n的类型
	- 如果以上情况都不符合，则m n都会转化为对应的无符号类型

例如：
```C
#include<stdio.h>
int main(void) {
  //在64位的Fedora下最终输出4,8,12
  printf("%u %u %u", sizeof(1.0f+1),sizeof(1.0+1), sizeof(1.0L+1));
}



#include<stdio.h>
int main(void) {
	//这个例子对应操作数都不是浮点型的几种情况
	short ss = 1;
	unsigned short us = 1;
	int si = 1;
	unsigned int usi = 1;
	long sl = 1L;
	unsigned long usl = 1UL;
	printf("%ld %ld\n", sizeof(ss + si), sizeof(us + usl));//输出4 8
	printf("%ld %ld\n", sizeof(usi + ss), sizeof(usl + si));//输出4 8
	printf("%ld %ld\n", sizeof(si + us), sizeof(sl + usi));//输出4 8
	printf("%ld %ld\n", sizeof(si + usi), sizeof(sl + usl));//输出4 8
}

```




# 情况2
此时策略很简单，就是直接将等号右边的表达式（以下简称表达式）的类型直接转换为等号左边（以下简称变量）的变量的类型，并且有以下几种情况

* 如果变量跟表达式都是整型或者浮点型，且变量的宽度大于等于表达式，则转换过程不会损失任何东西。
* 如果变量是浮点型，表达式是整型，则结果是可能是：
	- 损失精度（如果变量无法精度表示表达式）
	- 没有任何损失
	- 未定义（如果表达式的范围超出了变量能表示的范围，这种情况几乎不存在）
* 如果变量是整型，表达式是浮点型。则结果是可能是：
	- 未定义的（表达式的值超过了变量能表示的范围）
	- 损失精度（变量可以表示表达式的值，但是会抛弃小数部分）
```C
#include<stdio.h>
#include<limits.h>
int main(void) {
	float f = __LONG_LONG_MAX__ - 17;//会损失精度
	int i = 1.2e20;//未定义
}
```


# 情况3
分为两种情况
* 在调用函数的时候，编译器知道了函数的原型，此时的转换策略跟情况2一样。
* 在调用函数的时候，编译器不知道函数的原型，此时执行默认参数提升（default argument
promotions）：
	- 将float类型的实参转换为double
	- 对整型参数进行整数提升


# 情况4
此时会将return后的表达式的类型，隐式转换为函数声明中返回值的类型，跟情况2类似。

