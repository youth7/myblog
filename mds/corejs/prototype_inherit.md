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
假设有一个构造函数`parent`，现在需要创建一种新的对象，它继承了`parent`的所有属性，具体步骤如下：

* 继承父类的私有属性和非共享属性：首先创建新对象的构造函数`child`，它通过某种方式调用父类的构造函数
* 继承父类的共享属性： 设置`child`的`prototype`属性，使其指向以`parent`为原型的对象（注意这里不能通过`Object.create`来创建，下面会说原因）
* 使用`new`来调用`child`

具体代码如下：
```JavaScript
function parent(myname="共享属性") {
	const pri = "私有属性";
	this.myname = myname;
	this.getPrivate = function(){
		console.log("获取私有属性");
	}
}
parent.prototype.speak = function() {
	console.log(this.myname);
};
function child(age=2, myname="子类指定") {
	this.age = age;
	parent.call(this, myname, 34);
}

child.prototype = Object.create(parent.prototype);//只继承非享属性
var c = new child(33,44);
```
注意上面代码中，如果你不通过`parent.call(this, myname, 34)`来调用父类构造函数，而是通过`child.prototype =new Parent()`来实现继承也是可以的，但是这样的缺陷就是**无法给父构造函数传参**，因此很多时候手动调用父类构造函数是必要的。


