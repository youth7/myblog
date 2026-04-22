> https://qemu.gevico.online/tutorial/2026/ch1/qemu-startup-param/#_1



# 常用参数速查[¶](https://qemu.gevico.online/tutorial/2026/ch1/qemu-startup-param/#_1)

大体上 QEMU 常用的启动参数可以分为五类：

* 主板配置参数、
* 引导参数、
* 存储设备参数、
* 网络参数、
* 显示和交互参数。

考虑 QEMU 的启动参数众多，不建议大家死记硬背，而是常用常新，可以将本文作为手册，需要的时候查询一下即可。

下面我们通过表格来介绍，主要罗列适用于 `qemu-system-*`（`*` 代表目标架构，如 `qemu-system-riscv64`、`qemu-system-aarch64` 等）的启动参数。

##  **主板配置参数**：

| parameter          | example                     | Description                                                  |
| ------------------ | --------------------------- | ------------------------------------------------------------ |
| `-machine` or `-M` | `-M virt`                   | 选择机器或者主板的类型（`virt` 是 QEMU 提供的通用虚拟主板，不对应真实硬件，专为虚拟化场景设计）， `-M help` 可查询支持的主板 |
| `-cpu`             | `-cpu rv64`                 | 选择 CPU 模型， `-cpu help` 可查询支持的 CPU 模型            |
| `-m`               | `-m 2G`                     | 设置内存大小，支持 M/G 单位，如 2048M                        |
| `-smp`             | `-smp 4`                    | 配置 CPU 核心数/线程数                                       |
| `-device`          | `-device virtio-blk-device` | 添加新设备，只要当前主板支持                                 |

## **引导参数**：

| parameter | example                   | Description                                                  |
| --------- | ------------------------- | ------------------------------------------------------------ |
| `-bios`   | `-bios opensbi.bin`       | 加载自定义 BIOS 或 OpenSBI 固件或裸机程序                    |
| `-kernel` | `-kernel Image`           | 直接加载 Linux 内核镜像（direct Linux boot；不同架构常见镜像名不同，例如 x86 常见 `bzImage`，ARM/RISC-V 常见 `Image`） |
| `-initrd` | `-initrd initrd.img`      | 指定初始化内存盘，加载 initramfs 或 initrd 文件系统          |
| `-append` | `-append "console=ttyS0"` | 传递给内核的命令行参数（direct Linux boot 场景，通常与 `-kernel` 配合使用） |
| `-dtb`    | `-dtb kernel.dtb`         | 传递给内核的 DTB（Device Tree Blob，设备树二进制文件，用于描述硬件拓扑，供内核发现和配置设备）镜像文件 |

**各种启动参数（`-loader` `-bios` `-kernel`）的之间的关系：**

其实就是代表启动流程中的不同阶段，对于riscv架构：

* `-loader`: 通常只在需要自定义 Boot ROM （Mask Rom）代码时使用
* `-bios`：加载OpenSBI
* `-kernel`：加载操作系统内核



## **存储设备参数**：

| parameter | example                                          | Description                |
| --------- | ------------------------------------------------ | -------------------------- |
| `-drive`  | `-drive file=image.qcow2,format=qcow2,if=virtio` | 添加块设备（硬盘、光盘等） |

## **网络参数**：

| parameter | example                                      | Description                          |
| --------- | -------------------------------------------- | ------------------------------------ |
| `-netdev` | `-netdev user,id=net0,hostfwd=tcp::2222-:22` | 定义网络后端，用户模式网络、TAP 设备 |

## **显示和交互参数**：

| parameter    | example         | Description                                                  |
| ------------ | --------------- | ------------------------------------------------------------ |
| `-nographic` | -               | 禁用图形输出，并将串口 I/O（以及默认 monitor）重定向到当前终端；默认转义键为 `Ctrl+a`，可用 `Ctrl+a c` 在串口/monitor 间切换，`Ctrl+a x` 退出，`Ctrl+a h` 查看帮助 |
| `-serial`    | `-serial stdio` | 将 guest 串口重定向到宿主字符设备（常见：`stdio`、`mon:stdio`、`file:run.log` 等） |
| `-monitor`   | `-monitor none` | 重定向或禁用 HMP monitor；例如 `-monitor stdio` 将 monitor 放到当前终端，`-monitor none` 禁用默认 monitor |
| `-s`         | -               | 启用 gdbstub（QEMU 内置的 GDB 远程调试服务端，等价于 `-gdb tcp::1234`） |
| `-S`         | -               | 启动时冻结 CPU，等待 gdb/monitor 继续执行                    |



## 