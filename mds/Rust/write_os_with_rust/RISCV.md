## 杂项

* 汇编器中`as`的Directives见：https://sourceware.org/binutils/docs/as/Pseudo-Ops.html

* RISCV专用的Directives见：https://sourceware.org/binutils/docs/as/RISC_002dV_002dDirectives.html

* 寄存器定义见：https://msyksphinz-self.github.io/riscv-isadoc/html/regs.html
* 所有RISCV相关的规范见[这里](https://wiki.riscv.org/display/HOME/RISC-V+Technical+Specifications)或者[这里](https://github.com/riscv-non-isa)，中文版翻译见[这里](https://ica123.com/archives/5282)





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



## 指令格式说明
<table class="wikitable" style="text-align:center;">
<caption>32-bit RISC-V instruction formats
</caption>
<tbody><tr>
<th rowspan="2">Format
</th>
<th colspan="32">Bit
</th></tr>
<tr>
<th>31</th>
<th>30</th>
<th>29</th>
<th>28</th>
<th>27</th>
<th>26</th>
<th>25</th>
<th>24</th>
<th>23</th>
<th>22</th>
<th>21</th>
<th>20</th>
<th>19</th>
<th>18</th>
<th>17</th>
<th>16</th>
<th>15</th>
<th>14</th>
<th>13</th>
<th>12</th>
<th>11</th>
<th>10</th>
<th>9</th>
<th>8</th>
<th>7</th>
<th>6</th>
<th>5</th>
<th>4</th>
<th>3</th>
<th>2</th>
<th>1</th>
<th>0
</th></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Register/register
</td>
<td colspan="7" style="background:#FFCBDB;">funct7
</td>
<td colspan="5" style="background:#dfd;">rs2
</td>
<td colspan="5" style="background:#dfd;">rs1
</td>
<td colspan="3" style="background:#FFCBDB;">funct3
</td>
<td colspan="5" style="background:#ffb7b7;">rd
</td>
<td colspan="7" style="background:#FFFDD0;"><a href="/wiki/Opcode" title="Opcode">opcode</a>
</td></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Immediate
</td>
<td colspan="12" style="background:#def;">imm[11:0]
</td>
<td colspan="5" style="background:#dfd;">rs1
</td>
<td colspan="3" style="background:#FFCBDB;">funct3
</td>
<td colspan="5" style="background:#ffb7b7;">rd
</td>
<td colspan="7" style="background:#FFFDD0;">opcode
</td></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Upper immediate
</td>
<td colspan="20" style="background:#def;">imm[31:12]
</td>
<td colspan="5" style="background:#ffb7b7;">rd
</td>
<td colspan="7" style="background:#FFFDD0;">opcode
</td></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Store
</td>
<td colspan="7" style="background:#def;">imm[11:5]
</td>
<td colspan="5" style="background:#dfd;">rs2
</td>
<td colspan="5" style="background:#dfd;">rs1
</td>
<td colspan="3" style="background:#FFCBDB;">funct3
</td>
<td colspan="5" style="background:#def;">imm[4:0]
</td>
<td colspan="7" style="background:#FFFDD0;">opcode
</td></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Branch
</td>
<td style="background:#def;">[12]
</td>
<td colspan="6" style="background:#def;">imm[10:5]
</td>
<td colspan="5" style="background:#dfd;">rs2
</td>
<td colspan="5" style="background:#dfd;">rs1
</td>
<td colspan="3" style="background:#FFCBDB;">funct3
</td>
<td colspan="4" style="background:#def;">imm[4:1]
</td>
<td style="background:#def;">[11]
</td>
<td colspan="7" style="background:#FFFDD0;">opcode
</td></tr>
<tr>
<td style="background: #ececec; color: black; font-weight: bold; vertical-align: middle; text-align: left;" class="table-rh">Jump
</td>
<td style="background:#def;">[20]
</td>
<td colspan="10" style="background:#def;">imm[10:1]
</td>
<td style="background:#def;">[11]
</td>
<td colspan="8" style="background:#def;">imm[19:12]
</td>
<td colspan="5" style="background:#ffb7b7;">rd
</td>
<td colspan="7" style="background:#FFFDD0;">opcode
</td></tr>
</tbody></table>


* `opcode` (7 bits): Partially specifies which of the 6 types of *instruction formats*.
* `funct7`, and `funct3` (10 bits): These two fields, further than the *opcode* field, specify the operation to be performed.
* `rs1`, `rs2`, or `rd` (5 bits): Specifies, by index,  the register, resp., containing the first operand (i.e., source  register), second operand, and destination register to which the  computation result will be directed.



### Loads and Stores

$$
\left\{
	\begin{aligned}
		&\underline{\textbf{l}}oad \\
		&\underline{\textbf{s}}tore \\
	\end{aligned}
\right\}
\left\{
	\begin{aligned}
		&\underline{\textbf{b}}yte \\
		&\underline{\textbf{h}}alfword \\
		&\underline{\textbf{w}}ord \\
	\end{aligned}
\right\}
$$

$$
&\underline{\textbf{l}}oad
\left\{
	\begin{aligned}
		&\underline{\textbf{b}}yte \\
		&\underline{\textbf{h}}alfword
	\end{aligned}
\right\}
\underline{\textbf{u}}nsigned
$$







