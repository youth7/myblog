## `case`的关键点总结

* 最为关键的一点是，**`case`是一个表达式而不是语句**。这是`case`表达式灵活性的根本所在
* 在`group by`的子句中使用`case`能够自定义分组的粒度
* 在聚合函数中使用`case`表达式，能够实现行转列
* 聚合函数也可以嵌套在`case`表达式中



## 实际应用

### 行转列

其核心思想是两步

* 首先，将原表的每一条记录的结构都扩充变为所需的形式（即转换后的形态），无法获得的属性使用null或者其它值，这个值需要能够被后续的聚合函数区分
* 然后，结合`group by`和聚合函数，将上一步生成的新表进行压缩。

例如有下表

| pref_name | sex | population |
| ---- | ---- | ---- |
|东京	|1	|250|
|东京	|2	|150|
|佐贺	|1	|20|
|佐贺	|2	|80|
|德岛	|1	|60|
|德岛	|2	|40|
|爱媛	|1	|100|
|爱媛	|2	|50|
|福冈	|1	|100|
|福冈	|2	|200|
|长崎	|1	|125|
|长崎	|2	|125|
|香川	|1	|100|
|香川	|2	|100|
|高知	|1	|100|
|高知	|2	|100|



希望转换为下表

| 性别 | 全国 | 德岛 | 香川 | 爱媛 | 高知 | 四国 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 男   | 855  | 60   | 100  | 100  | 100  | 360  |
| 女   | 845  | 40   | 100  | 50   | 100  | 290  |



则根据上述步骤，首先将原表转为目标表的结构，缺失的属性我们使用0来填充（其实也可以使用null）

```sql
select
	case when sex=1 then '男' else '女' end  as 性别,
	(population) as '全国',
	(case when pref_name = '德岛' then population else 0 end) as '德岛',
	(case when pref_name = '香川' then population else 0 end) as '香川',
	(case when pref_name = '爱媛' then population else 0 end) as '爱媛',
	(case when pref_name = '高知' then population else 0 end) as '高知',
	(case when pref_name in ('德岛','香川','爱媛','高知') then population else 0 end) as '四国'
from
	poptbl2 p2

```

从而得到这样的中间结果


| 性别 | 全国 | 德岛 | 香川 | 爱媛 | 高知 | 四国 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|男	|250	|0	|0	|0	|0	|0|
|女	|150	|0	|0	|0	|0	|0|
|男	|20	|0	|0	|0	|0	|0|
|女	|80	|0	|0	|0	|0	|0|
|男	|60	|60	|0	|0	|0	|60|
|女	|40	|40	|0	|0	|0	|40|
|男	|100	|0	|0	|100	|0	|100|
|女	|50	|0	|0	|50	|0	|50|
|男	|100	|0	|0	|0	|0	|0|
|女	|200	|0	|0	|0	|0	|0|
|男	|125	|0	|0	|0	|0	|0|
|女	|125	|0	|0	|0	|0	|0|
|男	|100	|0	|100	|0	|0	|100|
|女	|100	|0	|100	|0	|0	|100|
|男	|100	|0	|0	|0	|100	|100|
|女	|100	|0	|0	|0	|100	|100|



然后，对扩展的表进行压缩，需要如下改造上述的SQL

```sql
select
	case when sex=1 then '男' else '女' end  as 性别,
	sum(population) as '全国',
	sum(case when pref_name = '德岛' then population end) as '德岛',
	sum(case when pref_name = '香川' then population end) as '香川',
	sum(case when pref_name = '爱媛' then population end) as '爱媛',
	sum(case when pref_name = '高知' then population end) as '高知',
	sum(case when pref_name in ('德岛','香川','爱媛','高知') then population end) as '四国'
from
	poptbl2 p2
group by
	性别
```

则最终得到我们需要的表，留意`group by`和聚合函数是如何压缩中间的表的。