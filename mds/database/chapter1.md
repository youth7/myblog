# 一些基本概念

这一章讲的数据库本身的最高抽象，包含了数据库软件的分层架构。需要注意**不要和应用程序开发中的数据源层的数据库设计相混淆**，一些重要的概念如下：




##  数据模型 （`data model`）

个人认为，简单来说它就是数据库用于抽象数据的风格，它可以分为4类：
* 关系模型（例如Oracle、PostGresql）
* E-R模型
* 基于对象的模型（很多NoSql数据库例如Mongodb） 
* 半结构化的模型

> 感觉E-R模型不应该出现在这里，它是属于更高层面的抽象内容，见下面的概念辨析





## 概念辨析

*  关系模型与ER模型的区别：
   *  E-R模型是更高层次的抽象（`It is a high-level or conceptual model`），描述了系统中实体之间的关系。
   *  关系模式则是ER模型在RDBMS中的表达（`It is the implementation or representational model`），处于低一级的抽象层。个人认为ER模型是领域层面的抽象，它不依赖于数据库的具体表达。同一个ER模型既可以用MongoDB表达也可以用RDBMS表达。


# 参考

* [Difference between E-R Model and Relational Model in DBMS](https://www.geeksforgeeks.org/difference-between-e-r-model-and-relational-model-in-dbms/)
* [Difference between ER Model and Relational Mode](https://www.javatpoint.com/er-model-vs-relational-model)
* [ER vs Relational Model](https://www.codingninjas.com/studio/library/er-vs-relational-model)

