


之前写过一篇关于C的自动转型，觉得其中的细节颇为繁复，然而今天看到javascript中的自动转型规则，才发现C的自动转型简直小菜一碟。总的来说，JavaScript的自动转型有两个关键点：
* 各种类型之间的转换规则
* 各种操作符下的转换算法

# 原值类型、对象之间的转换规则
## 原始类型之间的相互转换
这里我们忽略ES6新增的Symbol类型，虽然它是原始类型，但是不能转换为除了boolean之外任何其它原始类型。  
用以下程序打印出转换表格
```JavaScript
(function() {
	"use strict";
	const defaultLength = 12;
	const fixLength = function(value) {
		value += "";
		const difference = defaultLength - value.length;
		return value.concat(" ".repeat(difference));
	};
	const fixLengthPrint = function() {
		const [value, string, number, boolean] = Array.prototype.map.call(arguments, fixLength);
		console.log(`${value}\t|${string}\t|${number}\t|${boolean}`);
	};
	const printfHeader = function() {
		fixLengthPrint("raw value", "to string", "to number", "to boolean");
		printLine();
	};
	const printLine = function() {
		let line = "-".repeat(defaultLength);
		fixLengthPrint(line, line, line, line);
	};
	const convertions = function(values) {
		values.forEach(value => {
			const string = `"${value}"`;
			const number = value - 0;
			const boolean = !!value;
			fixLengthPrint(value, string, number, boolean);
		});
		printLine();
	};
	//分别测试null、undefined、布尔型、字符串、数字之间的相互转换
	const nils = [undefined, null];
	const bool = [true, false];
	const strs = ["nodejs", "", "1.2"];
	const nums = [0, -0, NaN, +Infinity, -Infinity, 64];
	printfHeader();
	[nils, bool, strs, nums].forEach(convertions);
})();

```
则输出结果为：
```JavaScript
raw value       |to string      |to number      |to boolean
------------    |------------   |------------   |------------
undefined       |"undefined"    |NaN            |false
null            |"null"         |0              |false
------------    |------------   |------------   |------------
true            |"true"         |1              |true
false           |"false"        |0              |false
------------    |------------   |------------   |------------
nodejs          |"nodejs"       |NaN            |true
                |""             |0              |false
1.2             |"1.2"          |1.2            |true
------------    |------------   |------------   |------------
0               |"0"            |0              |false
0               |"0"            |0              |false
NaN             |"NaN"          |NaN            |false
Infinity        |"Infinity"     |Infinity       |true
-Infinity       |"-Infinity"    |-Infinity      |true
64              |"64"           |64             |true
```
值得注意的是：
* null、undefined、空字符串、0、NaN转为布尔值时候都是false。
* null、空字符串转为数字数字时候都是0，**但undefined却是NaN**。

## 对象与原始类型之间的转换
### 原始类型转为对象
直接调用对应的构造函数就可以，例如字符串就调用`new String()`、数字就调用`new Number()`，注意null和undefined没有对应的构造函数因此不能转为对象。因此在它们上面调用方法或者属性会报错。

### 对象转为原始类型
而对象转为原始类型，则分为以下几种情况讨论
* 对象转为布尔值  
	所有对象都转转为true。  

* 对象转为数字 
	* 1，调用对象的`valueOf`方法，**如果返回原始类型的值**，则将这个原始类型转为数字。
	* 2，否则，调用对象的`stringOf`方法，**如果返回原始类型的值**，则将这个原始类型转为数字。
	* 3，否则，抛出异常。  

* 对象转为字符串
	* 1，调用对象的`stringOf`方法，**如果返回原始类型的值**，则将这个原始类型转为字符串。
	* 2，否则，调用对象的`valueOf`方法，**如果返回原始类型的值**，则将这个原始类型转为字符串。
	* 3，否则，抛出异常。  
	
由上可知，对象转为原始值时候，会调用`valueOf`或者`stringOf`方法，这两个方法如果其中之一返回原始值，则转换可以进行，否则抛出异常。  
这两个矩阵是转换的基础， 当操作符遇到不同类型的数据时候都遵循这种规则。通过以下程序可以测试上述的情况
```JavaScript
(function() {
	"use strict";
	const defaultLength = 18;
	const fixLength = function(value) {
		value += "";
		const difference = defaultLength - value.length;
		return value.concat(" ".repeat(difference));
	};
	const fixLengthPrint = function() {
		const [value, string, number, boolean] = Array.prototype.map.call(arguments, fixLength);
		console.log(`${value}\t|${string}\t|${number}\t|${boolean}`);
	};
	const printfHeader = function() {
		fixLengthPrint("raw value", "to string", "to number", "to boolean");
		printLine();
	};
	const printLine = function() {
		let line = "-".repeat(defaultLength);
		fixLengthPrint(line, line, line, line);
	};
	printfHeader();
	//分别测试对象、数组和函数
	[{}, [], [64], ["a"], function() {}].forEach(obj => {
		const string = `"${obj}"`;
		const number = obj - 0;
		const boolean = !!obj;
		fixLengthPrint(obj, string, number, boolean);
	});
})();
```
最终输出

```JavaScript
raw value               |to string              |to number              |to boolean
------------------      |------------------     |------------------     |------------------
[object Object]         |"[object Object]"      |NaN                    |true
                        |""                     |0                      |true
64                      |"64"                   |64                     |true
a                       |"a"                    |NaN                    |true
function () {}          |"function () {}"       |NaN                    |true

```

# 操作符下的转换规则
## +操作符的转换规则
当两边的操作数都是数字、字符串时候结果是显而易见的，如果遇到类型不一致，则自动转换为都是字符串、数字再进行运算，具体如下：
* 1，如果任一操作数是对象，则根据以下法则转换为原始值  
	* 如果对象非Date类型，**依次调用**`valueOf`、`stringOf`**方法**，如果任一方法返回原始值，进行下一步。（因为很多对象的`valueOf`方法都不能返回原始类型，因此大多数情况下回转换为调用`stringOf`方法。我们下面会写程序验证）。
	* 如果对象是Date类型，**直接调用**`stringOf`**方法**。  
* 2，进过步骤1后操作数全部转为了原始值，如果任一操作数为字符串，则将另外一个操作数转为字符串；否则，全部操作数转为数字（null、undefined和布尔型都可以直接转换为原始类型）。
```JavaScript
(function() {
	"use strict";
	const obj1 = {
		valueOf() {//改写了valueOf方法，使其返回原始值，则不会再调用toString方法
			return 64;
		},
	};
	const obj2 = {
		valueOf() {//改写了valueOf方法，使其返回原始值，则不会再调用toString方法
			return "nodejs";
		},
	};	
	console.log(obj1 + 1, obj2 + 1);//输出  65 'nodejs1'
})();
```
## ==和===下的转换规则
### 操作符“===”的转换算法
对于表达式
```javascirpt
x===y
```
JavaScript使用一种称为[*The Strict Equality Comparison Algorithm*](http://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6)的转换算法，具体如下：
* **如果两者的类型不相同，返回false**
* 如果两者都是null或者undefined，返回true
* 如果两者都是数字类型：
	* 如果其中之一是NaN，返回false
	* 如果两者的值相等，返回true（其中+0和-0被认为是相等的）
* 如果两者都是字符串，则内容和长度都相同时返回true，否则返回false
* 如果两者都是布尔型，则两者都是true时返回true，否则返回false
* 如果两者都是对象，**则指向同一对象时返回true，否则返回false**

### 操作符“==”的转换算法
对于表达式
```javascirpt
x==y
```
JavaScript使用一种称为[*The Abstract Equality Comparison Algorithm*](http://www.ecma-international.org/ecma-262/5.1/#sec-11.9.3)的转换算法，具体如下：  
如果两者类型相同，则参照上述===操作符的转换规则  
如果两者类型不同，则根据以下规则进行转换：  
* null和undefined比较返回true
* 如果两者分别是字符串和数字，则**将字符串转为数字**，再进行比较
* 如果其中之一是布尔型，则将布尔型转换为数字再比较
* 如果其中之一是对象，另外一个是数字或者字符串，则将对象转换为原始类型再比较（对象转原始类型在前面已经详细描述）


简而言之，如果操作数的类型不同，===不会自动转型而==会尝试自动转型。根据上述的规则，我们可以写出一些奇葩的代码，例如写一个表达式返回字符串“a”，要求不能使用英文字母和数字，
```javascript
(!{}+"")[+!!{} + +!{}]
/**
1，表达式(!{}+"")返回的是字符串false，因为!{}返回布尔型，然后通过+把布尔型转换为字符串false
2，表达式+!!{} + +!{}返回数字1，因为!!{}返回true而!{}返回false，通过一元操作符+将其分别转换为1和0
3，结果1和2，最终的表达式其实就是"false"[1]
**/
```
