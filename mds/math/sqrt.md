![](https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3260098476,1888438210&fm=26&gp=0.jpg)
![](/imgs/dmai.png)  
本文涉及以下内容
* 从雷神之锤讲起
* 一段神奇的代码
* 牛顿迭代法
* 浮点数与IEEE754
* 推导过程
* 重中之重：泰勒展开？最小二乘法？


# 从雷神之锤讲起
## 一款出色的射击游戏
[https://www.bilibili.com/video/av2102388/](https://www.bilibili.com/video/av2102388/)
<iframe src="//player.bilibili.com/player.html?aid=2102388&cid=3261524&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>


## 1999年的主流配置
* CPU  
    * AMD K6-2 350MHz
    * Celeron 300A—366MHz
    * Pentium 2 350MHz（高端）
* 内存：64MB
* 硬盘：6.4G~8.4G
* 显卡：AGP 2X显卡（4M—16M显存）
* 显示器： 15寸平面直角CRT 
* 声卡： 16位兼容声卡 

为何会这么流畅？？？？！！！

# 一段神奇的代码(卡马克开方 or 快速倒数平方根 or fast inverse square root )

快速计算$\frac{1}{\sqrt x}$

```C
float FastInvSqrt(float x) {
  float xhalf = 0.5f * x;
  int i = *(int*)&x;         // evil floating point bit level hacking
  i = 0x5f3759df - (i >> 1);  // what the fuck?
  x = *(float*)&i;
  x = x*(1.5f-(xhalf*x*x));
  return x;
}
```

# 牛顿迭代法
![newton](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1562594853630&di=0f70ccb68695006eae2d26849b061865&imgtype=0&src=http%3A%2F%2Fpic.baike.soso.com%2Fp%2F20140428%2F20140428164458-1019475479.jpg)

**重点：迭代的次数与初始值选取密切相关**

# 浮点数与IEEE754
[浮点数的整型表示](http://localhost:8888/mds/csapp3e/float.md)  

![32bit](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1562663641960&di=b6798213b7afbfa1f71b1b9e2a6af09e&imgtype=0&src=http%3A%2F%2Fwww.ad.siemens.com.cn%2Fclub%2Fbbs%2Fupload%2F634616130743452500.jpg)


**重点：位串可以用不同的方式解读，作用是用整型运算代替浮点数运算**

$$
m = \frac{M}{L}   \\
e = E -B  \\
(1+m)2^e (浮点数的计算公式) \\
M + LE (浮点数的整型表示)\\
$$  


# 推导过程
$$
y = \frac{1}{\sqrt{x}} = x^{-\frac 12} \\
\log_2 y = {-\frac 12}\log_2 x \\
\log_2 (1+m_y) + e_y = {-\frac 12}(\log_2 (1+m_x) + e_x)\\
$$

## 用线性方程逼近(重点！！！)
$$
\log_2(1 + v) \\
\log_2(1 + v) \approx v + \sigma （重点来了！！）\\ 
m_y + \sigma + e_y \approx {-\frac 12}(m_x + \sigma + e_x)\\
\frac{M_y}{L} + \sigma + E_y - B \approx {-\frac 12}(\frac{M_x}{L} + \sigma + E_x - B) \\
\frac{M_y}{L} + E_y \approx {-\frac 12}(\frac{M_x}{L} + \sigma + E_x - B) - \sigma + B\\
\frac{M_y}{L} + E_y \approx {-\frac 12}(\frac{M_x}{L} + E_x) - \frac{3}{2}(\sigma - B)\\
M_y + LE_y \approx {\frac 32}L(B - \sigma) - {\frac 12}(M_x + LE_x)\\
$$

[演示一下](https://www.geogebra.org/graphing/nvuqbbdu)  
![](http://h14s.p5r.org/wp-content/uploads/2012/09/ln.png)  
最终我们会得到
$$
\mathbf{I_y} \approx {\frac 32}L(B - \sigma) - {\frac 12}\mathbf{I_x}\\
$$

# 重中之重：泰勒展开？最小二乘法？
脑洞大开？

$$
\log_2(1 + v) \approx v + \sigma \\
$$

泰勒公式
$$
f(x)=f(a)+f'(a)(x-a)+{\frac {f''(a)}{2!}}(x-a)^{2}+\cdots +{\frac {f^{(k)}(a)}{k!}}(x-a)^{k}+h_{k}(x)(x-a)^{k}
$$


# 参考文章
* [Hummus and Magnets 0x5f3759df](http://h14s.p5r.org/2012/09/0x5f3759df.html)
* [超快速开平方0x5f3759df算法探究](https://blog.csdn.net/qq_23997101/article/details/49535161)
* [Fast inverse square root](https://en.wikipedia.org/wiki/Fast_inverse_square_root)
<!-- 

[!牛顿迭代法](https://images0.cnblogs.com/blog/300640/201304/18155235-b272cc444a1845d3aede4c72a87f83dc.jpg) -->