## 一个SQL查询的理解可以如下：  
* 从from子句中生成笛卡尔积
* 在笛卡尔积上面应用where子句指定的谓词
* 对步骤2的结果，输出select限定的属性

**注意：这些步骤只是用来理解SQL执行的最终的结果，数据库在实际执行的时候会选择更加高效的方式**


## where子句谓词
元组上直接使用比较运算符，例如
```sql
select name, course_id 
from instructor, teaches
where (instructor.ID, dept_name) = (teaches.ID, 'Biology');
```

## 集合运算
并：union (all)  
交：intersect  (all)  
减：except (all)  
如果想要保留重复，则可以在后面加上一个all

# 嵌套子查询
## 子查询用在`where`中
* 配合in使用
* 使用`some`和`all`进行集合的比较
* 使用`exist`进行空关系测试
## 子查询用在`from`中
* `lateral`子句
* `with`子句
* 标量子查询
## 标量子查询