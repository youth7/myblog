# 基础概念
## 函数依赖
若在一张表中，在属性（或属性组） $X$的值确定的情况下，必定能确定属性 $Y$的值，那么就可以说 $Y$函数依赖于 $X$，写作 $X \xrightarrow{} Y$。

### **完全函数依赖（ $X \xrightarrow{F} Y$）**  
在一张表中，若：
*  $X \xrightarrow{} Y$ 
*  $X' \xrightarrow{} Y$不成立。（$X'$是 $X$的真子集，假如属性组 $X$ 包含超过一个属性的话）

那么我们称 $Y$ 对于 $X$ 完全函数依赖，记作 $X \xrightarrow{F} Y$ 


### **部分函数依赖（ $X \xrightarrow{P} Y$ ）**  
在一张表中，若：
*  $X \xrightarrow{} Y$ 
*  $X \xrightarrow{F} Y$ 不成立

那么我们称 $Y$ 对于 $X$ 部分函数依赖，记作 $X \xrightarrow{P} Y$ 

### **传递函数依赖（ $X \xrightarrow{T} Z$ ）**  
在一张表中，若：
*  $X \xrightarrow{} Y$ 
*  $Y \xrightarrow{} Z$

那么我们称 $X$ 对于 $Z$ 传递函数依赖，记作 $X \xrightarrow{T} Z$ 

## 码
设 $K$ 为某表中的**一个属性或属性组**，如果除 $K$ 之外的**所有属性**都**完全依赖**于 $K$ ,那么我们称 $K$ 为候选码，简称为码。

注意上述定义的两个约束
1. 除 $K$ 之外的**所有属性**
2. 完全函数依赖于 $K$
> 注意：**如果 $K$已经是码了，则 $K$ 再加任何属性都不是码，因为已经不是完全函数依赖**



* 主属性： 包含在**任意一个码**中的属性
* 非主属性：不包含在**任何一个码**中的属性
  


# 1NF 
关系中的每个属性都不可再分

## 存在的问题和原因
存在以下问题：
* 数据冗余过大：
* 插入异常：
* 删除异常
* 修改异常

原因是：

1. 因为存在**非主属性对于码的部分函数依赖**，意味着这里可能有另外一张表（假设为表为T）
2. 而T没有独立出来，因此无法对它进行独立的增删改查，必须依附于已存在的其它表进行，从而导致增删改查的异常。






# 2NF 
在1NF的基础之上，消除了**非主属性对于码的部分函数依赖**（要有主键，要求其他字段都依赖于主键）
> 码：关系中的**某个属性或者某几个属性的组合**，用于**区分每个元组**
## 存在的问题和原因



# 3NF 
在2NF的基础之上，消除了**非主属性对于码的传递函数依赖**（可以看做是“消除冗余”，要求其他字段**只能**依赖于主键 不能由其他字段派生出来）
## 存在的问题和原因
## 



# BCNF（也叫做3.5NF）
在3NF的基础上，消除**主属性对于码的部分与传递函数依赖**（即主属性内部也不能部分或传递依赖，箭头左边的必须是码，不是码的就不是BCNF）
## 存在的问题和原因
## 

# 4NF
## 存在的问题和原因
## 

# 5NF
## 

# 总结

感觉1~3NF的总结就是1个：消除冗余

| 范式          | 消除谁   | 对谁     | 的什么关系         |
| ------------- | -------- | -------- | ------------------ |
| 1NF           |          |          |                    |
| 2NF           | 非主属性 | 码       | 部分函数依赖       |
| 3NF           | 非主属性 | 码       | 传递函数依赖       |
| BCNF（3.5NF） | 主属性   | 码       | 部分、传递函数依赖 |
| 4NF           | 非主属性 | 非主属性 | 多值依赖           |
| 5NF           |          |          |                    |

参考：

* https://zhuanlan.zhihu.com/p/20028672
* https://juejin.cn/post/7146474739018498062#heading-8