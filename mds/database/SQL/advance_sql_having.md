## `having`的关键点总结

* `group by`用来划分集合，`having`是对划分后的集合的过滤，而`where`是对集合元素的过滤。
* sql是面向集合的语言，通过不停地划分集合，并对集合做运算求解问题。
* `count(*)`和`count(列)`的区别在于后者会忽略null行，而前者不会
* 关系除法的定义

## 实际应用

* 利用交集求中位数

  假设有以下表格，求中位数（如果表格行数为奇数，则取中间的数；如果表格行数为偶数，则取中间两个数的平均值）

  | value  |
| ----  |
  |533	  |
	| 12321 |
	|12	  |
	|54	  |
	|8	  |
	|76	  |
	|87  |
	|123	  |
	|435  |
	
	这个问题采用一个交集的方法来求，步骤如下：
	
	* 找到一个集合A，A比表中一半以上的元素要大
	* 找到一个集合B，B比表中一半以上的元素要小
	* 则A∩B就是所求。（如果A∩B只有一个元素，则取之；如果A∩B有两个元素，就取两个元素的平均
	
	> 注意`having`在sql中发挥的过滤划分后的集合的作用
	
	按照以上思路，我们可以写出以下代码
	
	首先求A
	
	```sql
	select
		t1.value
	from
		test t1,
		test t2
	group by
		t1.value
	having
		( count(*)/ 2 <= sum( case when t1.value >= t2.value then 1 else 0 end ));
	```
	
	
	
	然后求B
	
	```sql
	select
		t1.value
	from
		test t1,
		test t2
	group by
		t1.value
	having
		( count(*)/ 2 <= sum( case when t1.value <= t2.value then 1 else 0 end ));
	```
	
	
	
	综合以上代码，我们求A∩B
	
	```sql
	select
		avg(temp.value)
	from
		(
		select
			t1.value
		from
			test t1,
			test t2
		group by
			t1.value
		having
			( count(*)/ 2 <= sum( case when t1.value >= t2.value then 1 else 0 end ) )
			and 
	        ( count(*)/ 2 <= sum( case when t1.value <= t2.value then 1 else 0 end )) ) as temp;
	```
	
	

* 关系除法