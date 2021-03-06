



# 传统的交换两个变量的方法
在C语言中，交换两个变量的值，可以通过以下方法进行
```C
	int a = 32;
	int b = 64;
	int temp = a;
	a = b;
	b = temp;
```
这种方法的特点是需要一个中间变量，且代码容易理解。

# 原地交换
csapp中介绍了另外一种方法，利用^操作符，我们可以省去这个中间变量，例如

```C
int main(void)
{
	int a = 32;//假设a的值为A
	int b = 64;//假设b的值为B
	a = a ^ b; // a = A^B
	b = a ^ b;//  b = (A^B)^B = A
	a = a ^ b;//  a = (A^B)^A = B
	printf("%d %d\n", a, b);
}

```

这种方法的原理是布尔环数学特性：

* $a \wedge a = 0$（类似加法逆元）

* $a \wedge 0 = a$（^的定义）

* $a \wedge b \wedge a = a \wedge a \wedge b =b$（结合律、交换律）


# 比较

方法1之所以需要额外的临时变量，是因为a原来的值会被覆盖。而方法2不需要额外变量，**是因为^操作并不会将a的信息抹去，通过某些操作可以将a还原出来**。给b可以还原a，给a可以还原b，就是给定结果和其中的一个变量，可以求出另外一个变量。

或者说方法1是一种直接覆盖的方法，无法逆推回去；而方法2是一种函数的方法，可以通过定义逆推回去（类似反函数）。