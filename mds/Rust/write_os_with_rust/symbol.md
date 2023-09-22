讨论了以下问题：

* 为何rust代码中是extern为函数，而不是extern为静态变量
* 为何`stext`这种符号没有size（因为它只代表一个地址的符号，当源码中碰到这个符号，就立马替换为对应的地址）

最终答案在这里找到了：https://stackoverflow.com/questions/8398755/access-symbols-defined-in-the-linker-script-by-application，原文如下：

> Linker scripts symbol declarations, by contrast, **create an entry in the symbol table but do not assign any memory to them.  Thus they are an address without a value**.  So for example the linker script definition:
>
> ```
>   foo = 1000;
> ```
>
> creates an entry in the symbol table called ‘foo’ which **holds the address of memory location 1000, but nothing special is stored at address 1000**.  This means that you **cannot access the *value* of a linker script defined symbol - it has no value - all you can do is access the *address* of a linker script defined symbol**.
>
> Hence when you are using a linker script defined symbol **in source code** you should always **take the address of the symbol, and never attempt to use its value**.  For example suppose you want to copy the contents of a section of memory called .ROM into a section called .FLASH and the linker script contains these declarations:
>
> ```
>   start_of_ROM   = .ROM;
>   end_of_ROM     = .ROM + sizeof (.ROM);
>   start_of_FLASH = .FLASH;
> ```
>
> Then the C source code to perform the copy would be:
>
> ```
>   extern char start_of_ROM, end_of_ROM, start_of_FLASH;
> 
>   memcpy (& start_of_FLASH, & start_of_ROM, & end_of_ROM - & start_of_ROM);
> ```
>
> Note the use of the ‘&’ operators.  These are correct.

总结：

* 链接脚本中定义的符号和源码中变量编译而来的符号**是不一样**的，源码中由变量编译而来的符号有size和value，value指向内存地址，size则是这个符号的值所占据的内存的大小。而链接脚本定义的符号**只有地址没有值**。
* 由此可知为何这些符号的size都是0。并且，extern为函数是合法的，因为函数就是一个地址，而extern为变量的话，还需要用&来取地址的值。



![](../../../imgs/rcore-stext-1.jpg)

![](../../../imgs/rcore-stext-2.jpg)

![](../../../imgs/rcore-stext-3.jpg)

![](../../../imgs/rcore-stext-4.jpg)