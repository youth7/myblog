# 一些基本概念

> 书中频繁使用模式（schema）这个词，通过上下文，个人理解模式一词的意思就是**对某样事物的描述和概括**。  
>
> 在数据库系统中，**模式是对数据库中数据结构的逻辑描述**，它定义了数据的组织方式、数据的类型以及数据之间的关系等，但并不涉及数据的物理存储细节。
>
> 数据库模式是对数据库中所有数据结构（如表、视图、索引、数据类型、约束等）的逻辑描述。
>
> 关系模式特指对表中数据的结构描述，包括表名、列名、数据类型、列约束（如主键、外键、唯一约束等）以及表之间的关联关系。



## 关系
* 数据库：**表的集合**
* 表：一张表就是一个关系，关系是**元组的集合**。网上有资料认为**表的结构**是 *关系模式* ，而一张带有数据的表就是一个关系，就像类与对象一样。

## 元组
表中的一行称为一个元组

## 属性
属性即表中的列

## 域
列的取值范围称为域

## 关系模式
**定义**  
由属性序列和各属性对应域组成

**辨析**  
Q：数据库模式（database schema）和关系模式（relation schema）的关系？  
A：数据库模式是描述整个数据库的，它包含了各个表之间的关系。而各个表的细节，则是由关系模式描述。

参考： [What's the difference between relation schema and database schema?](https://www.quora.com/Whats-the-difference-between-relation-schema-and-database-schema)

> A relation schema defines the structure of a single table or relation in a relational database, including the names and data types of its columns. It specifies the attributes (columns) and their corresponding data  types that make up a particular table.
>
> In contrast, a database schema refers to the overall logical design and  structure of an entire database. It encompasses all the relation  schemas, as well as the relationships between the different tables in  the database. The database schema defines how the data is organized and  how the various tables interact with one another.
>
> The database schema provides a high-level view of the entire database,  while a relation schema focuses on the structure of an individual table  within that overall database design. The database schema is the  comprehensive blueprint for the entire database, while relation schemas  define the blueprints for each specific table.

## 模式图（schema diagram）

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