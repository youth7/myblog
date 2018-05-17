



# 关于极限无穷小的一些思考

极限和无穷小是高数的基石，理解好它们的概念非常重要，[知乎](https://www.zhihu.com/question/20573378)上对极限的讨论非常有启迪。


## 极限
答主[alphacalculus](https://www.zhihu.com/people/alphacalculus/activities)（这个答主建立了一个非常好的学习[高数的网站](http://www.alphacalculus.com/)）写到：

>圆的内接正6边形的面积为$A_{1}$   
圆的内接正12边形的面积为$A_{2}$   
圆的内接正24边形的面积为$A_{3}$   
边数每次加倍，这些正多边形的面积按照边数由小到大排列成一列数  
$A_{1}$ ,$A_{2}$ ,$A_{3}$ ,...$A_{n}$ ,...  
n越大，n边形的面积$A_{n}$ 就越大，这个$A_{n}$ 会不会无限增大呢，显然不会！  
$A_{n}$ 的最大值就是我们要求的圆的面积，而这个面积，只要半径定了，它就是一个实数。  

这个例子非常直观说明了两点：

* **极限是一个确定的常数**，纵使数列$A_n$有无穷多项且不断递增，但最终只会逼近一个常数，即圆的面积。它是一个无理数，但是在图形上看却又是那么确定。
* 因变量的极限是客观存在的，**无论自变量是否能取得对应的值**，例如因变量$A_n$取得极限的时候，自变量n为无穷大，但n是不可能取得无穷大的。但这并不影响极限（圆的面积）的存在。



下面谈一下我的理解，首先给出极限的定义（这里只给出函数趋向$x_0$时候的情况，其它情况类似）


> **任给$ε$，存在$δ$，当$0<|x-x_0|<δ$时，有$|f(x)-A|<ε$**


* **从定义可知，$ε$和$δ$隐含了一个映射关系**，任意一个$ε$都有$δ$与之对应，在一些要求从定义证明极限的题目中，其实就是找出这种隐含的映射关系。

* **极限描述了函数在点$x_0$时候的一种趋向**，并且无论函数在点$x_0$是否有定义，都不会影响这个趋向。例如函数$f(x) = \frac{x(x-1)}{x}$，函数在在$x=0$处是无定义的，但是有无定义不会改变它在点$x=0$时值趋向$-1$的事实。从函数的图像来看，就是在函数的曲线上挖了一个孔，但这个孔的存在并不会影响我们对曲线走向的判断。

## 无穷小

[这里](https://www.zhihu.com/question/20454375/answer/130566890)有一个很棒的关于无穷小的讨论，下面说我自己的理解。

极限虽然是一个客观存在，但是很多时候它并不可及，特别是某点没有定义的时候。例如上面所说的函数$f(x) = \frac{x(x-1)}{x}$，$x \to 0$时极限为$-1$，但是因为$x=0$处无定义，因此函数的值永远无法取得$-1$，因此$f(x)$的值与$-1$之间总是有那么一点“空隙”。

我们能直观地感受到，当自变量从0的左边靠近的时候，**$f(x)$ $+$ 空隙 $=$ 极限**，自变量越靠近0，“罅隙”就越小越接近0。当自变量无限接近0的时候，这个“罅隙”就成为无穷小。必须注意的是，**这个“罅隙”不是静止的，而是随着$f(x)$动态变化，因此“罅隙”是一个动态变化的过程**。教材上给出了无穷小与函数极限关系的定理如下：

$\lim_{x \to .} f(x)= A + o(α)$，这个公式很好解释了极限和无穷小的关系：

$x$在趋向某个值的时候，**函数的值无限趋向于$A$，但是并不是等于$A$**（可能大一点也可能小一点），它和$A$之间的差就是一个无穷小，通过加上这个无穷小，可以补偿掉大一点或者小一点的那部分，同时表明了**函数永远不可能取得**$A$，**但是无限趋向**$A$这个事实。
