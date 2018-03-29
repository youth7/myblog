


在ES6出现前，开发者通常使用一个普通对象来模拟Set和Map这两种数据结构，例如：
```javascript
var map = Object.create(null);
map.key = "value"
console.log(map.key);

var set = Object.create(null);
set.key = true;
console.log(set.key);
```
这种做法的优点是快捷方便，但也有局限性：**键只能是字符串类型**，如果你的键是非字符串类型，基于JavaScript的自动转型机制，可能会导致意想不到的结果。例如：

```javascript
var map = Object.create(null);
map[64] = "v1";
map["64"] = "v2"
var key1 = {};
var key2 = {};
map[key1] = "v3";
console.log(map[64]);
console.log(map["64"]);
console.log(map[key2]);
/**
运行后输出
v2
v2
v3
**/
```
由于自动转型的机制，不同类型的变量可能会被转换为同一个字符串，最终使得键产生“碰撞”。  
除此之外，这种做法在某种场景下还会导致语义模糊，例如：
```javascript
var map = Object.create(null);
map.key = 0;
if(map.key){
	//do something
}
```
单纯从代码的角度并不能100%作者的意图，因为在if语句中，程序有两种解读方式：
* 判断map中是否含有key
* 判断map中key是否非0  

当然可以堆砌更多的代码来回避这个问题，但是将普通对象当做Map来用是天生带有缺陷。