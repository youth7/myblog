# 一些基本概念

## 关系
数据库是表的集合，一张表就是一个关系，关系是一系列元组的集合

## 元组
表中的一行称为一个元组

## 属性
属性即表中的列

## 域
列的取值范围称为域

## 关系模式
由属性序列和各属性对应域组成（即表的结构？）
数据库模式（database schema）和关系模式（relation schema）的关系：数据库模式是描述整个数据库的，它包含了各个表之间的关系。而各个表的细节，则是由关系模式描述。
[What's the difference between relation schema and database schema?](https://www.quora.com/Whats-the-difference-between-relation-schema-and-database-schema)

## 模式图

## 关系运算
有以下几种关系运算，注意关系运算时一种高层概念，SQL提供了关系运算的实现
* 选取元组
* 选取属性
* 笛卡尔积
* 自然连接

## 关系代数
关系代数定义了一组在关系上的运算，有：
* σ ：投影
* $\prod$ ：选择
* $\cup$：并
* $⋈$：自然连接
* $\times$：笛卡尔积