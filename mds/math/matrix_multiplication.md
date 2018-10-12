

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
& A的第3列 \cdot b_{n1}
\end{aligned}
\end{equation}$

即矩阵$A$右乘列向量$B$可以看做$A$中各个列向量乘以列向量$B$中的各个元素（因此要求$A$的列数必须等于$B$的行数）


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
& A的第1行 \cdot b_{12} + \\
& A的第n行 \cdot b_{1n}
\end{aligned}
\end{equation}$
  