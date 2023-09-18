汇编器中`as`的Directives见：https://sourceware.org/binutils/docs/as/Pseudo-Ops.html

RISCV专用的Directives见：https://sourceware.org/binutils/docs/as/RISC_002dV_002dDirectives.html

寄存器定义见：https://msyksphinz-self.github.io/riscv-isadoc/html/regs.html





## Integer Registers


| 5-bit Encoding (rx) | 3-bit Compressed Encoding (rx') | Register | ABI Name | Description                                      | Saved by Calle- |
| ------------------- | ------------------------------- | -------- | -------- | ------------------------------------------------ | --------------- |
| 0                   | -                               | x0       | `zero`     | hardwired zero                                   | -               |
| 1                   | -                               | x1       | `ra`       | **r**eturn **a**ddress                           | -R              |
| 2                   | -                               | x2       | `sp`       | **s**tack **p**ointer                            | -E              |
| 3                   | -                               | x3       | `gp`       | **g**lobal **p**ointer                           | -               |
| 4                   | -                               | x4       | `tp`       | **t**hread **p**ointer                           | -               |
| 5                   | -                               | x5       | `t0`       | **t**emporary register **0**                     | -R              |
| 6                   | -                               | x6       | `t1`       | **t**emporary register **1**                     | -R              |
| 7                   | -                               | x7       | `t2`       | **t**emporary register **2**                     | -R              |
| 8                   | 0                               | x8       | `s0`/`fp`  | **s**aved register **0** / **f**rame **p**ointer | -E              |
| 9                   | 1                               | x9       | `s1`       | **s**aved register **1**                         | -E              |
| 10                  | 2                               | x10      | `a0`       | function **a**rgument **0** / return value 0     | -R              |
| 11                  | 3                               | x11      | `a1`       | function **a**rgument **1** / return value 1     | -R              |
| 12                  | 4                               | x12      | `a2`       | function **a**rgument **2**                      | -R              |
| 13                  | 5                               | x13      | `a3`       | function **a**rgument **3**                      | -R              |
| 14                  | 6                               | x14      | `a4`       | function **a**rgument **4**                      | -R              |
| 15                  | 7                               | x15      | `a5`       | function **a**rgument **5**                      | -R              |
| 16                  | -                               | x16      | `a6`       | function **a**rgument **6**                      | -R              |
| 17                  | -                               | x17      | `a7`       | function **a**rgument **7**                      | -R              |
| 18                  | -                               | x18      | `s2`       | **s**aved register **2**                         | -E              |
| 19                  | -                               | x19      | `s3`       | **s**aved register **3**                         | -E              |
| 20                  | -                               | x20      | `s4`       | **s**aved register **4**                         | -E              |
| 21                  | -                               | x21      | `s5`       | **s**aved register **5**                         | -E              |
| 22                  | -                               | x22      | `s6`       | **s**aved register **6**                         | -E              |
| 23                  | -                               | x23      | `s7`       | **s**aved register **7**                         | -E              |
| 24                  | -                               | x24      | `s8`       | **s**aved register **8**                         | -E              |
| 25                  | -                               | x25      | `s9`       | **s**aved register **9**                         | -E              |
| 26                  | -                               | x26      | `s10`      | **s**aved register **10**                        | -E              |
| 27                  | -                               | x27      | `s11`      | **s**aved register **11**                        | -E              |
| 28                  | -                               | x28      | `t3`       | **t**emporary register **3**                     | -R              |
| 29                  | -                               | x29      | `t4`       | **t**emporary register **4**                     | -R              |
| 30                  | -                               | x30      | `t5`       | **t**emporary register **5**                     | -R              |
| 31                  | -                               | x31      | `t6`       | **t**emporary register **6**                     | -R              |





## Floating Point Registers

| Register | ABI Name | Description                | Saver  |
| -------- | -------- | -------------------------- | ------ |
| f0       | ft0      | FP temporaries             | Caller |
| f1       | ft1      | FP temporaries             | Caller |
| f2       | ft2      | FP temporaries             | Caller |
| f3       | ft3      | FP temporaries             | Caller |
| f4       | ft4      | FP temporaries             | Caller |
| f5       | ft5      | FP temporaries             | Caller |
| f6       | ft6      | FP temporaries             | Caller |
| f7       | ft7      | FP temporaries             | Caller |
| f8       | fs0      | FP saved registers         | Callee |
| f9       | fs1      | FP saved registers         | Callee |
| f10      | fa0      | FP arguments/return values | Caller |
| f11      | fa1      | FP arguments/return values | Caller |
| f12      | fa2      | FP arguments               | Caller |
| f13      | fa3      | FP arguments               | Caller |
| f14      | fa4      | FP arguments               | Caller |
| f15      | fa5      | FP arguments               | Caller |
| f16      | fa6      | FP arguments               | Caller |
| f17      | fa7      | FP arguments               | Caller |
| f18      | fs2      | FP saved registers         | Callee |
| f19      | fs3      | FP saved registers         | Callee |
| f20      | fs4      | FP saved registers         | Callee |
| f21      | fs5      | FP saved registers         | Callee |
| f22      | fs6      | FP saved registers         | Callee |
| f23      | fs7      | FP saved registers         | Callee |
| f24      | fs8      | FP saved registers         | Callee |
| f25      | fs9      | FP saved registers         | Callee |
| f26      | fs10     | FP saved registers         | Callee |
| f27      | fs11     | FP saved registers         | Callee |
| f28      | ft8      | FP temporaries             | Caller |
| f29      | ft9      | FP temporaries             | Caller |
| f30      | ft10     | FP temporaries             | Caller |
| f31      | ft11     | FP temporaries             | Caller |