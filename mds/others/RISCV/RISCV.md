已经完成RISCV汇编的翻译，关于RISCV的前置知识可以参考：https://github.com/youth7/An-Introduction-to-Assembly-Programming-with-RISC-V-CN



## 杂项

* 汇编器中`as`的Directives见：https://sourceware.org/binutils/docs/as/Pseudo-Ops.html

* RISCV专用的Directives见：https://sourceware.org/binutils/docs/as/RISC_002dV_002dDirectives.html

* 寄存器定义见：https://msyksphinz-self.github.io/riscv-isadoc/html/regs.html
* 所有RISCV相关的规范见[这里](https://wiki.riscv.org/display/HOME/RISC-V+Technical+Specifications)或者[这里](https://github.com/riscv-non-isa)，中文版翻译见[这里](https://ica123.com/archives/5282)

​	

## 寄存器分类

| 功能            | ABI名称    | 备注                           | Caller保存 | Callee保存 |
| --------------- | ---------- | ------------------------------ | ---------- | ---------- |
| 恒为零          | `x0`       |                                |            |            |
| 返回地址        | `ra`       |                                | ✔️          |            |
| stack指针       | `sp`       |                                |            | ✔️          |
| global指针      | `gp`       |                                |            |            |
| thread指针      | `tp`       |                                |            |            |
| temporary寄存器 | `t0`~`t6`  |                                | ✔️          |            |
| frame指针       | `fp`       | 注意：`fp`即`s0`               |            | ✔️          |
| saved register  | `s0`~`s11` | callee saved的寄存器           |            | ✔️          |
| 函数参数        | `a0`~`a7`  | 注意`a0`和`a1`也可以作为返回值 | ✔️          |            |



## 指令二进制格式
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



## RISCV汇编语法

### 语句格式

**`[label:]  [operation]  [comment]`**

其中`operation`的可能性如下：

* instruction：机器指令
* pseudo-instruction：伪指令
* directive：汇编指示（指示汇编器进行某些操作）
* macro：宏

### 指令的操作对象

* 寄存器
* 内存



### Loads and Stores指令快速记忆

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







