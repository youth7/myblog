# 本文讨论以下内容
* 矩阵乘以列向量
* 行向量乘以矩阵
* 矩阵${A}$乘以矩阵${B}$的三种理解
    * ${A}$ 乘以${B}的列向量$
    * ${A}$的行向量乘以${B}$
    * ${A}$的列向量乘以${B}$的行向量

为方便讨论，我们将矩阵乘法$C=AB$中，$c_{ij}$等于$A$的$i$行中的各元素分别乘以$B$的$j$列中各对应元素这一操作，记为$C_{ij} = A_i⊙B_j$

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
{A_{1} ⊙ B}\\
{A_{2} ⊙ B}\\
{\vdots}\\
{A_{n} ⊙ B}\\
\end{bmatrix}$ 。我们这里用$A_i(i=1,2\cdots n)$表示$A$中的第$i$行，$B$因为只有一列因此将下标1省去
* 结论②：根据上图，我们知道$C$又可以看作，**$A$中各个列向量分别乘以$B$中相对应的元素**（因此要求$A$的列数必须等于$B$的行数）



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
c_{13}=&b_{11} \cdot a_{1n} +\\ 
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
  
因此我们先写下两个稍后会用到的结论：
* 结论③：根据矩阵的定义，$C$中的每个元素是，**$A$（此时退化为1行）中各元素分别乘以$B$中各列对应的元素** 
* 结论④：根据上图，我们知道$C$又可以看作，**$A$中各个列向量分别乘以$B$中相对应的元素**（因此要求$A$的列数必须等于$B$的行数）


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
\end{bmatrix}$ 则$C=AB = \begin{bmatrix}
{A_1 ⊙ B_1}&{A_1 ⊙ B_2}&{\cdots}&{A_1 ⊙ B_p}\\
{A_2 ⊙ B_1}&{A_2 ⊙ B_2}&{\cdots}&{A_2 ⊙ B_p}\\
{A_3 ⊙ B_1}&{A_3 ⊙ B_2}&{\cdots}&{A_3 ⊙ B_p}\\
{A_m ⊙ B_1}&{A_m ⊙ B_2}&{\cdots}&{A_m ⊙ B_p}\\
\end{bmatrix}$

### ${A}$ 乘以${B}$的列向量
<!-- ①②③④⑤⑥⑦⑧⑨⑩ -->
![matrix_mul_matrix1](/imgs/matrix_mul_matrix1.jpg)  
我们从列的角度来观察$C$，并结合结论①②，可以得知$C$中的任意一列，都可以看作是**矩阵$A$乘以矩阵$B$中对应的列**。因此可以这样看待矩阵乘法$AB$，将矩阵$A$保持原样，将矩阵$B$划分为$p$列，则新矩阵为$A$分别乘以$B$的$p$列，然后再组合起来。  因此$C$可以看作以下形式  
$C = \begin{bmatrix}
{A \cdot B_1}&{A \cdot B_2}& \cdots& {A \cdot B_p}
\end{bmatrix}$


### ${A}$的行向量乘以${B}$
### ${A}$的列向量乘以${B}$的行向量