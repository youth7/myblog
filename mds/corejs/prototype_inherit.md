本文不涉及`ES6`的新特性`class`

本来将讨论以下内容  
* 对象继承对象  
	* 方法1：`__proto__`法
	* 方法2：`Object.create`法
	* 方法3：`setPrototypeOf`法
	* 共享属性、非共享属性、私有属性
* 构造函数继承构造函数
* 总结

> **想继承谁，就把谁设为自己的原型**

这就是JavaScript中原型继承的核心，原理虽然简单，但是在代码层面的上的实现是丰富多彩的，也是容易迷惑初学者的地方，主要有以下几种实现方式：

# 对象继承对象
对象继承对象有几种写法
## 方法1：`__proto__`法
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



## 方法2：`Object.create`法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = Object.create(parent);
child.speak();	
```
`ES5`的提供的新方法，能在创建对象时候提供原型，也直观体现了***你想继承谁，就把谁设为你自己的原型*** 


## 方法3：`setPrototypeOf`法
```JavaScript
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = {};
Object.setPrototypeOf(child, parent);
child.speak();
```
可以在运行期间动态改变原型，也直观体现了***你想继承谁，就把谁设为你自己的原型*** 

## 方法4：`构造函数prototype`法  
上述三种方法优点在于直观，但是缺少封装，缺少一致的创建对象的方式，当程序中需要多次创建同类型对象时，上述方法需要重复大量的代码（这点可以通过手动封装来解决），因此实际中很少使用。我们可以引入构造函数和`prototype`来解决这个问题
```JS
let parent = {
	name:"parent",
	speak(){console.log(this.name);}
};
let child = function(){};
child.prototype = parent;
new child().speak();
```


## 共享属性、非共享属性、私有属性
* 共享属性：对外公开，并且各个对象之间共享，内存中只有一份，这种属性只能挂在构造函数的`prototype`上
* 非共享属性：对外公开，但是各个对象私有，内存中只有多份，这种属性通常挂在构造函数的`this`上
* 私有属性：对外隐藏，调用者无法获取，类似java中用`private`修饰的属性，，这种属性通常是构造函数作用域中定义的独立变量

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

* 继承父类的**私有属性和非共享属性**：首先创建新对象的构造函数`child`，它通过**某种方式调用父类的构造函数**
* 继承父类的**共享属性**： 设置`child`的`prototype`属性，**使其指向以`parent`为原型的对象** 
* 使用`new`来调用`child`

具体代码如下：
```JavaScript
function parent(myname="共享属性") {
	const pri = "私有属性";
	this.myname = myname;
	this.getPrivate = function(){
		console.log("获取私有属性", this.pri);
	}
}
parent.prototype.speak = function() {
	console.log(this.myname);
};
function child(age=2, myname="子类指定") {
	this.age = age;
	parent.call(this, myname, 34);
}
// 如果省去这一句代码，child的实例就无法继承parent的speak，虽然child实例的内部有一个parent的实例，但是按照原型链往上搜索的时候并不会找到speak()
child.prototype = Object.create(parent.prototype);
var c = new child(33,44);
```

在上述代码中，为了继承父类的公有属性我们使用了`child.prototype = Object.create(parent.prototype)`，其实继承父类的公有属性有以下几种写法
* `child.prototype = parent.prototype`  
	缺点：子类和父类共享了同一个原型，如果其中一个修改了原型会影响对方
* `child.prototype = new person()`  
	缺点：`parent`被重复调用了2次（第一次是`parent.call(this, myname, 34);`）  ，其实这个问题并不大，因为`child.prototype = new person()`仅仅在设置`child`原型的时候调用一次。
* `child.prototype = Object.create(parent.prototype)`  
	优点：和第二种方法的区别其实就是被`new person()`和`Object.create(parent.prototype)`创建出来的对象的区别。     通过`Object.create(parent.prototype)`创建出来的原型会缺少`myname`和`getPrivate`，但是这完全没有问题，因为我们并不需要这两个属性，并且我们在`child`内部已经通过`parent.call`来为子类继承所需的属性了

# 总结：
如果想实现类似Java那种基于类的继承，可以这么做
* 首先，创建子类构造函数，在子类构造函数内部调用`父类构造函数.call(this, 其它参数)`，经过这一步之后就继承了父类的私有属性和非共享属性
* 然后，在子类构造函数外面调用`子类构造函数.prototype = Object.create(父类构造函数.prototype);`，经过这一步之后就继承了父类的共享属性

另外需要留意以下的概念

* 共享属性、非共享属性、私有属性
* `new class()` 和 `Object.create(class.prototype)`创建出来的对象的区别，前者全部属性都有所继承，后者只继承原型上的属性。

[参考资料](https://segmentfault.com/a/1190000016708006)