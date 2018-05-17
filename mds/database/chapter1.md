# 一些基本概念

## 数据抽象
从最高的层面来说，抛开具体的实现，数据库可以划分为3个层面
* 物理层：描述数据实际上是**怎样被存储的**
* 逻辑层：描述数据库系统中**存储什么数据，以及这些数据之间的关系**
* 视图层：更加高层次的抽象，只描述整个数据库的某些部分

这里只是说明数据库由不同的层组成，每层需要如何设计，则是 ***数据库模式*** 的内容

## *数据库模式*（ database schema, which is the logical design of the database）
**数据库的总体设计**称为数据库的模式，根据上面不同的数据抽象，*数据库模式*也可以对应地分为物理模式、逻辑模式和子模式。

SQL是一种描述*数据库模式*的语言，它由DDL和DML组成：
* DDL：定义*数据库模式*
* DML：表达数据库的查询和更新

##  *数据模型* （data model）
 *数据模型* 是一个描述**数据、数据联系、数据语意、一致性约束**的概念工具集合。 *数据模型* 提供了一种**描述物理层、逻辑层、视图层数据库设计**的方式。，它可以分为4类：
* 关系模型
* 实体-联系（E-R）模型
* 基于对象的 *数据模型* 
* 半结构化的 *数据模型* 

## 一些概念的辨析
*  *数据模型* 和SQL都是用来描述数据模式的， *数据模型* 从一个较高的角度来描述一个数据库的设计，而SQL则是将这种设计，通过某种语言精细表达出来
* 关系模型与ER模型的区别：ER模型从一个更高的角度来刻画一个数据库的模式，它描述了实体的性质和实体之间的联系。关系模型则是从较低的角度来进行这项工作，因此也涉及到更加多的细节和实现。ER模型着重表达逻辑的整体设计，关系模型着重表达逻辑的具体实现。ER模型可以转换为关系模型。[What is the difference between an entity relationship model and a relational model?](https://stackoverflow.com/questions/27268711/what-is-the-difference-between-an-entity-relationship-model-and-a-relational-mod)


注意区分 *数据模型* 和SQL的关系，个人认为 *数据模型* 是一种高层次的抽象，抽象出来的方案落地到具体数据库的时候，需要用SQL表达出来。打个比方， *数据模型* 就像UML图，它是一种高层的概念设计，表达了事物之间的关系，然后通过java的编程技术，来实现UML中的设计。