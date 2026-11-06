完整代码见：https://github.com/youth7/write_rvos_with_c_in_n_days/tree/day7



本章的目标是通过中断读取uart的输入，从而实现在控制台回显用户的输入，这要求：

1. 初始化PLIC，设置好uart设备的中断相关项
2. 编写uart中断处理函数，读取用户的输入并回显



# 初始化PLIC，设置好uart设备的中断相关项



# 编写uart中断处理函数，读取用户的输入并回显