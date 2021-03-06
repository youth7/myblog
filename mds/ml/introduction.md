## 人工智能的发展历程
人工智能从二十世纪五十年代发展至今，经历了以下几个时期：  
* 推理期：认为赋予机器逻辑推理的能力，机器就具有智能。
* 知识期：发现仅仅具有逻辑推理能力是不够的，还需使机器拥有知识。于是人们总结好知识，再“喂”给计算机。
* 学习期（即机器学习）：知识是无穷的，仅靠人类主动灌输知识是远不够的（称为“知识工程瓶颈”），需要计算机能够自己主动学习知识。

## 机器学习的几个流派
在学习期，人们对于计算机如何学习知识有不同的看法，主要有以下几种观点：
* 符号主义：认为智能的基本元是符号，智能活动是符号推理或符号计算过程，人脑在本质上就是一个物理符号系统，这种方式注重于**模拟人的思维方式**，代表是基于逻辑的学习和决策树。
* 连接主义：认为智能的基本单元为神经元，智能活动是神经元之间连接活动过程，这种方式注重于**模拟人的生理结构**，代表是神经网络和深度学习。
* 统计学习：认为统计学的规律遍布于各类事物中，可以从数据中挖掘这种规律从而做出预测。

## 人工智能、机器学习、深度学习、统计学习的关系

![introduction](/imgs/introduction.jpg)
## 统计学习的分类
  * 监督学习：例如线性回归、逻辑回归、SVM、决策树
  * 非监督学习：
  * 半监督学习：
  * 强化学习：


## 统计学习的三要素
* 模型：就是人们最终希望获得的东西，它是一个函数（条件分布或者决策函数），能够对目标系统的输出进行预测。
* 策略：相当于决策的标准。假设有一系列的备选模型，哪个才是我们需要的呢，我们可以制定一个标准用来筛选模型，例如损失函数最小就是一个常用的标准。统计学习中常用的损失函数有：
    * 0-1损失函数：$\begin{equation}
    L(Y, f(X))=
   \begin{cases}
   1& Y \neq f(X)\\
   0& Y = f(X)
   \end{cases}
  \end{equation}$
    * 平方损失函数：$L(Y, f(X)) = (Y, f(X))^2$
    * 绝对损失函数：$L(Y, f(X)) = |(Y, f(X))|$
    * 对数损失函数：$L(Y, f(X)) = -logP(Y|X)$  
     其中$Y$是目标系统的实际值，而$f(X)$是我们学得的模型的预测值
* 算法：当策略定下来后，有多种算法可以求解。例如现在我们的策略是取样本中排在中间的那个，用它的值来预测目标系统。怎么取中间数？最简单的就是先对样本排序。而对样本进行排序就涉及到排序算法了，可以选择快速排序、归并排序或者选择排序。


## 参考资料
[如何理解并区分“符号学习”、“统计学习”、“深度学习”和“机器学习”？](https://www.zhihu.com/question/55551036/answer/160340432)