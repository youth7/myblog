# 基础

## 规则1：解读指向函数的指针 

```c
int (*func_ptr) (int, int);
```

1. 根据`(*func_ptr)`确定`func_ptr`是一个指针

2. `func_ptr`后面跟的是括号，说明这个指针指向一个函数，假设为`fn`。

3. 由2可知，此时需要知道**`fn`的参数列表和返回值**。观察容易得知，参数列表由后面的`(int, int)`描述，返回值由最前面的`int`描述。

   



## 规则2：解读指向数组的指针 

```c
int (*array_ptr)[10];
```

1. 根据`(*array_ptr)`确定`array_ptr`是一个指针
2. `array_ptr`后面跟的是中括号，说明这个指针指向一个数组，假设为`array`。
3. 由2可知，此时需要知道**`array`的长度和其中元素的类型**。观察容易得知，长度由后面的`[10]`描述，元素类型由最前面的`int`描述。



## 解读步骤

1. 确定变量的类型，是指针？函数？数组？其中`*`号的优先级是很低的，比`()`和`[]`都要低，因此**变量优先和`()`、`[]`结合**。例如`*p[]`和 `*p()`中的`p`的类型分别是数组和函数。
2. 如果`p`是数组的话，确定数组元素的类型。如果元素类型是指针，则去步骤4
3. 如果`p`是函数的话，确定函数的签名。如果签名中包含指针，则去步骤4
4. 如果`p`的是指针的话，**需要确定`p`指向什么类型的对象**：
   1. `p`指向数组，回到步骤2
   2. `p`指向函数，回到步骤3



# 例子

```cpp
    void ( *(*f[]) () ) ();  
by applying the above rules:  

    void ( *(*f[]) () ) ();        "f is"  
              ^  
   
    void ( *(*f[]) () ) ();        "f is an array"  
               ^^ 

    void ( *(*f[]) () ) ();        "f is an array of pointers" 
             ^    

    void ( *(*f[]) () ) ();        "f is an array of pointers to function"   
                   ^^     
 
    void ( *(*f[]) () ) ();        "f is an array of pointers to function returning pointer"
           ^   

    void ( *(*f[]) () ) ();        "f is an array of pointers to function returning pointer to function" 
                        ^^    

    void ( *(*f[]) () ) ();        "f is an array of pointers to function returning pointer to function returning `void`"  
    ^^^^
```



参考：

* [How to Easily Decipher a Complex Pointer Declarations](https://www.codementor.io/@dankhan/how-to-easily-decipher-complex-pointer-declarations-cpp-so24b66me)

  