# 一些基本概念

## 数据抽象
从最高的层面来说，抛开具体的实现，数据库可以划分为3个层面
* 物理层：描述数据实际上是**怎样被存储的**
* 逻辑层：描述数据库系统中**存储什么数据，以及这些数据之间的关系**
* 视图层：更加高层次的抽象，只描述整个数据库的某些部分

这里只是说明数据库由不同的层组成，每层需要如何设计，则是 ***database schema*** 的内容

## 数据库模式（ database schema, which is the logical design of the database）
**数据库的总体设计**称为数据库的模式，根据上面不同的数据抽象，*data schema* 也可以对应地分为物理模式、逻辑模式和子模式。

SQL是一种描述*data schema* 的语言，它由DDL和DML组成：
* DDL：定义*data schema* 
* DML：表达数据库的查询和更新

##  数据模型 （data model）
 ***data model*** 是一个描述 **数据、数据联系、数据语意、一致性约束** 的概念工具集合。 ***data model*** 提供了一种 **描述物理层、逻辑层、视图层数据库设计** 的方式。，它可以分为4类：
* 关系模型（例如Oracle、PostGresql）
* E-R模型
* 基于对象的模型（很多NoSql数据库例如Mongodb） 
* 半结构化的模型

## 一些概念的辨析
*  *data model* 和SQL都是用来描述*database schema*的. *data model*可以基于不同的角度（例如上述的4种）来描述*database schema*，而SQL则是属于“关系模型”中的一部分内容，因此两者地位不同。如下图所示  
![db_c1.jpg](/imgs/db_c1.jpg)

* 关系模型与ER模型的区别：从不同的角度来刻画*database schema*，可以认为是具有密切联系的两种不同的事物，因为ER模型可以转换为关系模型。[What is the difference between an entity relationship model and a relational model?](https://stackoverflow.com/questions/27268711/what-is-the-difference-between-an-entity-relationship-model-and-a-relational-mod)

