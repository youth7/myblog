# 本文讨论以下内容
* 矩阵乘以列向量
* 行向量乘以矩阵
* 矩阵${A}$乘以矩阵${B}$的三种理解
    * ${A}$ 乘以${B}的列向量$
    * ${A}$的行向量乘以${B}$
    * ${A}$的列向量乘以${B}$的行向量


为方便讨论，我们将矩阵乘法$C=AB$中，$c_{ij}$等于$A$的$i$行中的各元素分别乘以$B$的$j$列中各对应元素这一操作，记为$C_{ij} = A_i⊙B_j$。

注意：本文不是讨论矩阵相乘的意义（线性变换），而仅仅是从代数角度去理解矩阵乘法是如何展开，其关键核心是从线性组合的角度去理解。

---
## 矩阵乘以列向量
设矩阵  
$A = \begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}  ,
B =\begin{bmatrix}
{b_{11}}\\
{b_{21}}\\
{\vdots}\\
{b_{n1}}\\
\end{bmatrix}$

 
则
$C = AB = \begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}
\begin{bmatrix}
{b_{11}}\\
{b_{21}}\\
{\vdots}\\
{b_{n1}}\\
\end{bmatrix}=
\begin{bmatrix}
{a_{11} \cdot b_{11}} + a_{12}\cdot{b_{21} +  \cdots a_{1n} \cdot b_{n1} }\\
{a_{21} \cdot b_{11}} + a_{22}\cdot{b_{21} +  \cdots a_{2n} \cdot b_{n1} }\\
{\vdots}\\
{a_{m1} \cdot b_{11}} + a_{m2}\cdot{b_{21} +  \cdots a_{mn} \cdot b_{n1} }\\
\end{bmatrix}$


![matrix_mul_vector1](/imgs/matrix_mul_vector1.jpg)


仔细观察$C$，发现红色框框是列向量$B$中的元素，蓝色框框则是矩阵$A$中各列向量，因此矩阵右乘列向量可以看做以下形式
  
$\begin{equation}
\begin{aligned}
C = AB = &A的第1列 \cdot b_{11} +\\ 
& A的第2列 \cdot b_{21} + \\
& \vdots\\
& A的第n列 \cdot b_{n1}
\end{aligned}
\end{equation}$


因此对于矩阵$A$和$B$（只有1列），我们先写下两个稍后会用到的结论，
* 结论①：根据矩阵的定义$C =\begin{bmatrix}
{A_{1} ⊙ B_1}\\
{A_{2} ⊙ B_1}\\
{\vdots}\\
{A_{n} ⊙ B_1}\\
\end{bmatrix}$ 。我们这里用$A_i(i=1,2\cdots n)$表示$A$中的第$i$行，用$B_1$代表$B$中的第一列（也是唯一的一列）
* 结论②：根据上图，我们知道$C$又可以看作，**$A$中各个列向量，以$B$中对应元素为权重的线性组合**（因此要求$A$的列数必须等于$B$的行数）


---
## 行向量乘以矩阵
设矩阵  
$A = \begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}  ,
B = \begin{bmatrix}
{b_{11}}&
{b_{12}}&
{\cdots}&
{b_{1m}}
\end{bmatrix}$

则
$C = BA = \begin{bmatrix}
{b_{11}}&
{b_{12}}&
{\cdots}&
{b_{1m}}
\end{bmatrix}
\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}=
\begin{bmatrix}
{c_{11}}&
{c_{12}}&
{\cdots}&
{c_{1n}}
\end{bmatrix}$  
其中  
$\begin{equation}
\begin{aligned}
c_{11}=&b_{11} \cdot a_{11} +\\ 
&b_{12} \cdot a_{21}  +\\ 
&\vdots\\
&b_{1m} \cdot a_{m1}\\
\end{aligned}
\end{equation}$ 
  

$\begin{equation}
\begin{aligned}
c_{12}=&b_{11} \cdot a_{12} +\\ 
&b_{12} \cdot a_{22}  +\\ 
&\vdots\\
&b_{1m} \cdot a_{m2}\\
\end{aligned}
\end{equation}$ 
  

$\begin{equation}
\begin{aligned}
c_{1n}=&b_{11} \cdot a_{1n} +\\ 
&b_{12} \cdot a_{2n}  +\\ 
&\vdots\\
&b_{1m} \cdot a_{mn}
\end{aligned}
\end{equation}$  



![matrix_mul_vector3](/imgs/matrix_mul_vector3.jpg)  
仔细观察这个图，对于图中的每一行（黄色框框）则可发现蓝色框框都是行向量$B$的各个元素，红色框框中的元素组合起来就是是矩阵$A$中的一行，因此行向量乘以矩阵可以看做以下形式  
$\begin{equation}
\begin{aligned}
C = BA = &A的第1行 \cdot b_{11} +\\ 
& A的第2行 \cdot b_{12} + \\
& \vdots\\
& A的第n行 \cdot b_{1n}
\end{aligned}
\end{equation}$


因此对于矩阵$B$（只有1行）和$A$，我们先写下两个稍后会用到的结论，
* 结论①：根据矩阵的定义$C = BA =\begin{bmatrix}
{B_1⊙A_1}&{B_1⊙A_2}& \cdots &{B_1⊙A_n}
\end{bmatrix}$ 。我们这里用$A_i(i=1,2\cdots n)$表示$A$中的第$i$列，用$B_1$代表$B$中的第一行（也是唯一的一行）
* 结论②：根据上图，我们知道$C$又可以看作，**$A$中各个行向量，以$B$中对应元素为权重的线性组合**（因此要求$A$的行数必须等于$B$的列数）


 
---
## 矩阵${A}$乘以矩阵${B}$的三种理解
设$A = \begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}  ,
B = \begin{bmatrix}
{b_{11}}&{b_{12}}&{\cdots}&{b_{1p}}\\
{b_{21}}&{b_{22}}&{\cdots}&{b_{2p}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{b_{n1}}&{b_{n2}}&{\cdots}&{b_{np}}\\
\end{bmatrix}，C=AB = \begin{bmatrix}
{A_1 ⊙ B_1}&{A_1 ⊙ B_2}&{\cdots}&{A_1 ⊙ B_p}\\
{A_2 ⊙ B_1}&{A_2 ⊙ B_2}&{\cdots}&{A_2 ⊙ B_p}\\
{A_3 ⊙ B_1}&{A_3 ⊙ B_2}&{\cdots}&{A_3 ⊙ B_p}\\
{A_m ⊙ B_1}&{A_m ⊙ B_2}&{\cdots}&{A_m ⊙ B_p}\\
\end{bmatrix}$

### ${A}$ 乘以${B}$的列向量
<!-- ①②③④⑤⑥⑦⑧⑨⑩ -->
**假设我们在生成$C$的时候，按照列的顺序来逐列生成**（即先生成$C$的第$1$列、第$2$列...第$p$列），则由上述结论①②，可以得知$C$中的任意一列，都可以看作是**矩阵$A$乘以矩阵$B$中对应的列**。因此可以这样看待矩阵乘法$AB$，将矩阵$A$保持原样，将矩阵$B$划分为$p$列，则新矩阵为$A$分别乘以$B$的$p$列，然后再组合起来  


因此$C$可以看作以下形式  
$C = \begin{bmatrix}
{A \cdot B_1}&{A \cdot B_2}& \cdots& {A \cdot B_p}
\end{bmatrix}$  
这个计法可能不是很标准，但其目的是为了表达，**矩阵乘法$C=AB$，可以看成矩阵$A$乘以矩阵$B$的各个列向量，再组合起来**这个观点

### ${A}$的行向量乘以${B}$
**假设我们在生成$C$的时候，按照行的顺序来逐列生成**（即先生成$C$的第$1$行、第$2$行...第$m$行），则根据上述结论③④，可以得知$C$中的任意一行，都可以看作是**矩阵$A$对应的行乘以矩阵$B$**。因此可以这样看待矩阵乘法$AB$，将矩阵$B$保持原样，将矩阵$A$划分为$m$行，则新矩阵为$A$的各行分别乘以$B$，然后再组合起来

因此$C$可以看作以下形式  
$C = \begin{bmatrix}
{A_1 \cdot B}\\
{A_2 \cdot B}\\
{\vdots}\\
{A_m \cdot B}
\end{bmatrix}$  
这个计法可能不是很标准，但其目的是为了表达，**矩阵乘法$C=AB$，可以看成矩阵$A$的各个行向量乘以矩阵$B$，再组合起来**这个观点

### ${A}$的列向量乘以${B}$的行向量
设$A_i(i=1,2\cdots n)$为$A$中的各列，$B_j(j=1,2\cdots n)$为$B$中的各行，则$A_i, B_j$对应相乘并相加的结果为  
$\begin{equation}
\begin{aligned}
& A_1 \cdot B_1 + A_2 \cdot B_2 \cdots+ A_n \cdot B_n\\
&=\begin{bmatrix}
{a_{11}\cdot b_{11}}&{a_{11}\cdot b_{12}}&{\cdots}&{a_{11}\cdot b_{1p}}\\
{a_{21}\cdot b_{11}}&{a_{21}\cdot b_{12}}&{\cdots}&{a_{21}\cdot b_{1p}}\\
{\vdots}\\
{a_{m1}\cdot b_{11}}&{a_{m1}\cdot b_{12}}&{\cdots}&{a_{m1}\cdot b_{1p}}\\
\end{bmatrix}+
\begin{bmatrix}
{a_{12}\cdot b_{21}}&{a_{12}\cdot b_{22}}&{\cdots}&{a_{12}\cdot b_{2p}}\\
{a_{22}\cdot b_{21}}&{a_{22}\cdot b_{22}}&{\cdots}&{a_{22}\cdot b_{2p}}\\
{\vdots}\\
{a_{m2}\cdot b_{21}}&{a_{m2}\cdot b_{22}}&{\cdots}&{a_{m2}\cdot b_{2p}}\\
\end{bmatrix}
\cdots + 
\begin{bmatrix}
{a_{1n}\cdot b_{n1}}&{a_{1n}\cdot b_{n2}}&{\cdots}&{a_{1n}\cdot b_{np}}\\
{a_{2n}\cdot b_{n1}}&{a_{2n}\cdot b_{n2}}&{\cdots}&{a_{2n}\cdot b_{np}}\\
{\vdots}\\
{a_{mn}\cdot b_{n1}}&{a_{mn}\cdot b_{n2}}&{\cdots}&{a_{mn}\cdot b_{np}}\\
\end{bmatrix}\\
&=\begin{bmatrix}
{A_1 ⊙ B_1}&{A_1 ⊙ B_2}&{\cdots}&{A_1 ⊙ B_p}\\
{A_2 ⊙ B_1}&{A_2 ⊙ B_2}&{\cdots}&{A_2 ⊙ B_p}\\
{A_3 ⊙ B_1}&{A_3 ⊙ B_2}&{\cdots}&{A_3 ⊙ B_p}\\
{A_m ⊙ B_1}&{A_m ⊙ B_2}&{\cdots}&{A_m ⊙ B_p}\\
\end{bmatrix}\\
&= AB
\end{aligned}
\end{equation}$

 
 因此矩阵$A$乘以$B$又可以看作是 **$A$中的列向量乘以$B$中对应的行向量**
