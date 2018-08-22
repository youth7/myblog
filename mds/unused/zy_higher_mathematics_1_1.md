



# 0 极限的定义

先上定义（这里只给出函数趋向$x_0$时候的情况，其它情况类似）

$$
任给ε，存在δ，当0<|x-x_0|<δ时，有|f(x)-A|<ε
$$

理解极限的几个要点：[这里](https://www.zhihu.com/question/20573378)关于极限的讨论非常有启迪

* $ε$和$δ$之间隐含函数关系，任意一个$ε$都有$δ$与之对应，在一些要求从定义证明极限的题目中，其实就是找出这种隐含的函数关系。

* 极限描述了函数在点$x_0$时候的一种趋向关系，无论函数在点$x_0$是否有定义，都不会影响这个趋向。例如函数$f(x) = x(x-1)/x$，函数在在$x=0$处是无定义的，但是有无定义不会改变它在点$x=0$时值趋向$-1$的事实。从函数的图像来看，就是在函数的曲线上挖了一个孔，但是这个孔并不会影响我们判断曲线形状上的趋向。




# 1，极限的三大性质

## 1.1，唯一性
**【例1】** 设$a$为常数
$$
\lim_{x \to 0} (\frac{e^\frac{1}{x}-\pi}{e^\frac{2}{x}+1}+ 
a * arctan\frac{1}{x})
$$
存在，求$a$

**【分析】**
既然极限存在，则根据极限的唯一性，**左右极限存在且相等**，通过计算左右极限建立方程可解。

**【解】**

当$x \to 0^+$时，原式
$$
\begin{aligned}
	&= \lim_{x \to 0^+}\frac{e^\frac{1}{x}-\pi}{(e^\frac{1}{x})^2+1} 
	+ \lim_{x \to 0^+}a * (arctan\frac{1}{x})\\
	&=\frac{1}{+\infty}  +  a * \frac{\pi}{2} \\
	&=\frac{a\pi}{2}
\end{aligned}
$$


当$x \to 0^-$时，原式
$$
\begin{aligned}
	&= \lim_{x \to 0^-}\frac{e^\frac{1}{x}-\pi}{(e^\frac{1}{x})^2+1} 
	+ \lim_{x \to 0^-}a * (arctan\frac{1}{x})\\
	&=-\pi  +  a * -\frac{\pi}{2} 
\end{aligned}
$$

综合上式子可得$a=-1$

## 1.2，局部有界性
**【例2】**
$$
f(x) = \frac{|x|sin(x-2)}{x(x-1)(x-2)^2}在()内有界
$$
$$
A(-1,0) \ \ \ B(0,1) \ \ \ C(1,2) \ \ \ D(2,3)
$$
**【分析】**

对于函数在区间$I$上的有界性，宇哥总结如下
* 若$I$为闭区间，则函数必然有界
* 若$I$为开区间，假设是$(a,b)$，则使用“三段论”，将$(a,b)$划分为三个区间，分别是$(a, δ_1)$、$[δ_1,δ_2]$和$(δ_2, b)$
	* 若$\lim_{x \to a^+}f(x)$存在，则根据局部有界性，$f(x)$在$(a, δ_1)$必然有界
	* 若$\lim_{x \to b^-}f(x)$存在，则根据局部有界性，$f(x)$在$(δ_2, b)$必然有界
	* 若函数在$(a,b)$上连续，又因为$[δ_1,δ_2]$是$(a,b)$的子区间，则$f(x)$在$[δ_1,δ_2]$上必然连续

综上所述，易知如果一个函数符合三段论的要求，则它在$(a,b)$上必然有界

**【解】**

先看答案A，分析函数在区间$(-1, δ_1)$上的有界性

$$
	\lim_{x \to -1^+}f(x) = \frac{sin(-3)}{18}
$$

然后分析函数在区间$(δ_2, 0)$上的有界性

$$
	\lim_{x \to 0^-}f(x) = \frac{sin(-2)}{4}
$$

且函数在区间$[δ_1,δ_2]$上明显有界，因此根据三段论可知，函数在$(-1,0)$上必然有界

## 1.3，局部保号性
**【例3】**
$$
\lim_{x \to 0}f(x) = f(0)，且 \lim_{x \to 0}\frac{f(x)}{1-cosx}=-2，则x=0是()
$$

$$
A极大值 \ \ \ B极小值 \ \ \ C不是极值 \ \ \ D无法判断
$$

**【分析】**

如果可以判断$f(x)$在0的空心邻域都是大于0或者小于0，则可判断是否极值

**【解】**

$$
	\lim_{x \to 0}f(x) = \lim_{x \to 0}\frac{f(x) * (1 - cos(x))}{1 - cos(x)}
	=-2 * \lim_{x \to 0}(1-cos(x))
	=-2 * 0
	=0 
$$
即$f(0) = 0$，因此$f(x)$在$x=0$处是极大值。


# 2，极限的计算
## 2.1，7种未定式
* $\frac{0}{0}$
* $\frac{∞}{∞}$
* $∞*0$
* $∞-∞$
* $∞^0$
* $0^0$
* $1^∞$
这里的0和1都是指函数的极限趋向于0和1，而不是指常数0和1