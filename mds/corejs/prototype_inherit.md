本文不涉及`ES6`的新特性`class`


> **想继承谁，就把谁设为自己的原型**

这就是JavaScript中原型继承的核心，原理虽然简单，但是在代码层面的上的实现是丰富多彩的，也是容易迷惑初学者的地方，主要有以下几种实现方式：

# 对象继承对象
对象继承对象有几种写法
## 方法1：构造函数法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = function(){};
child.prototype = parent;
new child().speak();	
```
这种方法是最为传统的写法，其特点是**批量创建同类型的对象**，而下面的方法则需要每次都手动设置。



## 方法2：`__proto__`法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = {
	__proto__:parent
};
child.speak();	
```
这种方法是对 ***你想继承谁，就把谁设为你自己的原型*** 的最直接体现，`__proto__`现在已经标准化，可以放心使用。


## 方法3：`Object.create`法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = Object.create(parent);
child.speak();	
```
`ES5`的提供的新方法，能在创建对象时候提供原型。


## 方法4：`setPrototypeOf`法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = {};
Object.setPrototypeOf(child, parent);
child.speak();
```
这种方法本意是在程序运行过程中动态改变原型，它要**先创建对象，然后再去改变原型**

总结：后三种方法优点在于直观，但是缺少封装，，当程序中需要多次创建同类型对象时往往需要重复大量的代码（特别是对象的初始化比较复杂时），因此实际中很少使用。而第1种方法缺点是不太直观，新手难以理解，但是却是一种良好的封装，具有一致的创建对象的方式。

## 共享属性、非共享属性、私有属性
* 共享属性：各个对象之间共享，内存中只有一份
* 非共享属性：各个对象私有，内存中只有多份，**注意共享属性和非共享属性都是对外公开的，调用者可以直接访问**
* 私有属性：对外隐藏的属性，调用者无法获取，类似java中用`private`修饰的属性

例如：
```JavaScript
function MyClass(){
	const priv = "私有属性，不能直接访问";
	this.notShare = [];//"非共享属性";
	this.getPrivate = function(){//私有属性只有通过闭包才能访问
		console.log(priv);
	};
}
MyClass.prototype.share = function(){
	console.log("共享属性，所有对象共享");//共享属性
};
const c1 = new MyClass();
const c2 = new MyClass();
console.log(c1.notShare === c2.notShare);
console.log(c1.share === c2.share);
console.log(c1.getPrivate());
```

# 构造函数继承构造函数
假设有一个构造函数`parent`，现在需要创建一种新的对象，它继承了`parent`，要怎么操作？这取决于你要继承父类的多少属性。

## 方式1：继承父类的**所有**属性（这才是完整的继承）
* 首先创建新对象的构造函数`child`
* 设置`child`的`prototype`属性，使其指向以`parent`为原型的对象
* 使用`new`来调用`child`

## 方式2：只继承父类的**共享**属性（非完整的继承）
* 首先创建新对象的构造函数`child`
* 设置`child`的`prototype`属性，使其指向以`parent.prototype`
* 使用`new`来调用`child`

## 方式3：只继承父类的**非共享**属性（非完整的继承）
* 首先创建新对象的构造函数`child`
* 设置`child`的`prototype`属性，使其指向`parent`
* 使用`new`来调用`child`

运行以下例子，观察用不同的方式设置`child.prototype`时的效果
```JavaScript
"use strict";
function parent() {
	this.name = "parent";
}
parent.prototype.speak = function() {
	console.log(this.name || "没有name属性");
};
function child() {
	this.age = 1;
}
//child.prototype = Object.create(new parent); //继承所有属性
//child.prototype = parent.prototype;//只继承非共享属性
child.prototype = Object.create(new parent);//只继承共享属性
const c = new child();

c.speak ? c.speak() : () => {
	console.log(c.name);
};
```

总结（注意区分各自继承了什么对象，该对象上有何属性）：
* 方式1继承了 **`parent`类型的对象**    
* 方式2继承了 **`parent.prototype`**   
* 方式3继承了 **函数`parent`**  



