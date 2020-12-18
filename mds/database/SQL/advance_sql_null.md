## null和三值逻辑的关键点

* 数据库中采取的是三值逻辑(true/false/unknown)，记忆unknown和true、false的与或关系时候，可以根据以下原则进行：**unknown表示值可能为true或false，如果表达值的值跟unknown有关，则最终结果为unknown**，例如：

  * 对于与关系，只有true and true时候表达式才返回true，当有表达式true and unknown时，因为unknown表示的是未知，则意味着unknown此时可能为true或false，即true and unknown的结果有两种，至于具体是哪一种结果是未知的，因此true and unknown的结果为unknown。同理可知false and unknown为false，unknown and unknown为unknown
  * 对于或关系，同上所述，unknown or unknown为unknown。true or unknown为true，false or unknown为unknown。

* null不是值，应该将它看做一种标记，表示值缺失。同时因为 null 不是值，所以不能对其使用谓词  **null和所有谓词结合后返回unknown，再结合三值逻辑的与或关系**，是引起各种莫名其妙问题的原因。

  

## 实际案例

* 比较谓词和null

  * 比较谓词和 null结合时候，排中律不成立。执行下面的sql，比较结果的异同

    ```sql
    -- 两条sql本意都是查出临时表temp中所有记录，但是第二条sql会漏掉value为null的记录
    
    with temp as (
    	select 1 as value  union 
    	select 2 as value)
    select * from temp where value=1 or value != 1;
    
    with temp as (
    	select null as value  union 
    	select 1 as value  union 
    	select 2 as value)
    select * from temp where value=1 or value != 1;
    ```

  * case when和null结合的时候，也有类似情况

    ```sql
    -- 两条sql都试图将数字值转为符号○，将null值转为符号×，事实上第一条sql的结果中不会含有×
    
    with temp as (
    	select null as value  union 
    	select 1 as value  union 
    	select 2 as value)
    select case value
    	when 1 then '○'
      	when 2 then '○'
    	when null then '×'
      end from temp;
    
    
    with temp as (
      	select null as value  union 
    	select 1 as value  union 
    	select 2 as value)
    select case 
    	when value = 1 then '○'
    	when value = 2 then '○'
    	when value is null then '×'
    end from temp;
    ```

* not in  和 null

  ```sql
  -- 比较以下sql，为何第二条sql没有返回任何记录
  select '有记录' where 1 not in (2,3,4);
  select '有记录' where 1 not in (2,3,4, null);
  ```

  第二条sql没有返回记录的原因在于，经过一系列的等价转换之后，它等价于以下sql，因为最后的`1 != null`的结果是`unknown`，导致整个`where`子句的结果为`false`

  ```sql
  select '有记录' where 1 != 2 and 1 != 3 and 1 != 4 and 1 != null;
  ```

* 限定谓词和null

  SQL 里有 all 和 any 两个限定谓词。其中 any与 in 是等价的  ，而ALL在含有null的记录中会出现意想不到的问题，原因在于all等价于多个and的组合，因此上述的比较谓词和null的问题，在all中也会有，例如

  ```sql
  -- 比较以下sql，为何第条sql没有返回任何记录
   with temp as (
  	select 1 as value  union 
  	select 2 as value)
  select * from temp 
  	where value <= all (select value from temp);	
  
  with temp as (
    	select null as value  union 
  	select 1 as value  union 
  	select 2 as value)
  select * from temp 
  	where value <= all (select value from temp);
  ```

* 极值函数、聚合函数和null

  为了克服上面的问题，可以使用以下sql

  ```sql
  with temp as (
    	select null as value  union 
  	select 1 as value  union 
  	select 2 as value)
  select * from temp 
  	where  value <=  (select max(value) from temp) ;	
  ```

  看起来好像用极值函数能够解决null的问题，实际极值函数也不是万能的，当表为空的时候，极值函数会返回null，这又使得再次回到的null的陷阱中。例如：

  ```sql
  with temp as ( select 1 as value )
  select * from temp
  where -- 3，因此where后的结果是false
      value <= (-- 2，对null使用<=后会返回unknown
          select min(value) from (-- 1，在一个空表中使用极值函数会返回null
              select * from temp where value > 10
          ) nullTable
      )
  ```

  注意这个问题也存在除了`count`之外的所有聚合函数中



## 总结

* 聚合函数，极值函数在表为空时会返回null
* null和比较谓词结合后的结果是unknown
* unknown在与或操作中很有可能返回false或者unknown，从而使得查询不能返回期待中的结果

**如果记录中不包含null，则没有上述所有问题**，因此最好使用COALESCE函数对表中所有null值进行转换，或者在建表时候添加not null约束，转换到我们熟悉的二值逻辑的领域。

