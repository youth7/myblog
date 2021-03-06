假设有以下实验：

>  持续不断地抛硬币，直到第一次出现正面停止，此时记录下抛硬币的次数$k$

将这个实验重复$n$次，记录下每次实验结果$(k_1 , k_2...k_n)$，其中最大的值为$k_{max}$，则容易知道有以下两个事实

* $n$次抛掷中，每一次的抛掷次数$k$都不大于$k_{max}$
* $n$次抛掷中，至少有一次的抛掷次数$k$等于于$k_{max}$

其简单推导如下：  
$$  
\begin{aligned}
P(X \leq =  K_{max})  
& = P({所有的投掷次数 \leq K_{max}}) \\
& = P({某次的投掷次数 \leq K_{max}})^n \\
& = [1-P({某次的投掷次数 > K_{max}})]^n \\
& = (1-\frac{1}{2^{K_{max}}})^n  （只要连续K_{max}次都出现反面，则投掷次数肯定>K_{max}）\\
\end{aligned}
$$




$$  
\begin{aligned}  
P(X \geq =  K_{max})
& = 1 - P(所有的投掷次数都<K_{max}) \\
& = 1 - P({某次的投掷 < K_{max}})^n （直接算的话情况太多了，正面只要发生在K_{max}前任意一个投掷中即可，因此用下式计算）\\  
& = 1 - [1-P({某次的投掷 \geq K_{max}})]^n \\
& = 1-(1-\frac{1}{2^{K_{max-1}}})^n  （前面K_{max}-1次都是反面，则达成\geq K_{max}）\\
\end{aligned}
$$

推理过程：

* 在$n$次抛硬币过程中，情况1和2都是必然发生的
* 当$n$远大于或者远小于$2^{K_{max}}$的时候，情况1和2的概率会趋向于0，这与事实相违背，因此推测$n$与$2^{K_{max}}$接近

因此知道了$K_{max}$就可以估算$n$以上就是hyperLogLog的算法核心原理

