# 关于`_start`和`start`

```assembly
.global func
func:
	addi a0, a0, 1
	j func
```



在x86的Ubuntu20上编译上面的汇编代码

```
riscv64-unknown-elf-gcc -nostartfiles loop.s 
```

`ld`程序会产生一个警告：

```
riscv64-unknown-elf/bin/ld: warning: cannot find entry symbol _start; defaulting to 00000000000100b0
```

说明缺少了`_start`符号，将`func`改为`_start`就没事了。



然而事情并没有那么简单，搜了下[ld脚本的文档](https://sourceware.org/binutils/docs/ld/Entry-Point.html)中关于入口点的设置，它是这么说的：

> There are several ways to set the entry point.  The linker will set the entry point by trying each of the following methods in order, and stopping when one of them succeeds:
>
> - the ‘-e’ entry command-line option;
> - the `ENTRY(symbol)` command in a linker script;
> - the value of a target-specific symbol, if it is defined;  For many targets this is `start`, but PE- and BeOS-based systems for example check a list of possible entry symbols, matching the first one found.
> - the address of the first byte of the code section, if present and an executable is being created - the code section is usually ‘.text’, but can be something else;
> - The address `0`.

也就是说默认的入口点应该是`start`而不是`_start`，那为何`ld`的警告却要求`_start`呢？

后来看到[这里](https://www.gridbugs.org/if-you-use-a-custom-linker-script-_start-is-not-necessarily-the-entry-point/)发现，原来`ld`启动时候会有**一个默认的脚本，这个脚本利用上述规则的第2条，将默认的入口名称改为了`_start`**，可以通过以下命令来观察这一点，注意第3行的`ENTRY(_start)`，就是它改变了入口函数的名称

```bash
$ ld --verbose | grep start

ENTRY(_start)
  PROVIDE (__executable_start = SEGMENT_START("text-segment", 0x400000)); . = SEGMENT_START("text-segment", 0x400000) + SIZEOF_HEADERS;
      PROVIDE_HIDDEN (__rela_iplt_start = .);
    *(.text.startup .text.startup.*)
     PROVIDE_HIDDEN (__tdata_start = .);
    PROVIDE_HIDDEN (__preinit_array_start = .);
    PROVIDE_HIDDEN (__init_array_start = .);
    PROVIDE_HIDDEN (__fini_array_start = .);
    /* gcc uses crtbegin.o to find the start of
  __bss_start = .;
```



# 关于`ld`选项的传递问题

GCC中和`ld`相关的选项参考[这里](https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html)。注意，**这些都是GCC的选项**，GCC将这些选项传递给`ld`，来控制调用`ld`时的一些行为。

> ```
> -Wl,option
> ```
>
> Pass `option` as an option to the linker.  If `option` contains commas, it is split into multiple options at the commas.  You can use this syntax to pass an argument to the option. 
>
> For example, `-Wl,-Map,output.map` passes `-Map output.map` to the linker.  When using the GNU linker, you can also get the same effect with `-Wl,-Map=output.map`.





而`ld`自身的选项参考[这里](https://sourceware.org/binutils/docs/ld/Options.html)。关于`ld`选项有一点需要说明：

首先是前缀`-Wl`：

>  if the linker is being invoked indirectly, via a compiler driver (e.g. ‘gcc’) then all the linker command-line options should be prefixed by ‘-Wl,’ (or whatever is appropriate for the particular compiler driver) like this:
>
>  ` gcc -Wl,--start-group foo.o bar.o -Wl,--end-group`





然而发现调用gcc时候，似乎不需要这个`-Wl`也没问题，例如以下命令是等效的

```bash
riscv64-unknown-elf-gcc -nostdlib -fno-builtin -march=rv32g -mabi=ilp32 -g -Wall -Ttext=0x80000000 -v loop.s

riscv64-unknown-elf-gcc -nostdlib -fno-builtin -march=rv32g -mabi=ilp32 -g -Wall -Wl,-Ttext=0x80000000 -v loop.s
```

如果按照`ld`的说法，必然是要加`-Wl`。但实际却不用，这是因为[文档的末尾](https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html)写到：



> ```
> -Tbss=addr
> -Tdata=addr
> -Ttext=addr
> -N
> -n
> -t
> -Z
> -z keyword
> ```
>
> These options are passed through to the linker without interpretation by GCC. Refer to your linker documentation for the meanings of these options.





