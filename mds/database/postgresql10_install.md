在centos7上安装postgresql10可以从源码安装或者从yum安装，从源码安装较为繁琐，现在介绍从yum安装的方法


# 安装postgresql10
* 打开[https://www.postgresql.org/download/linux/redhat/](https://www.postgresql.org/download/linux/redhat/)，里面有详细说明如何添加yum源，然后从yum命令行安装、执行初始化等工作。

* 安装完毕之后，会生成两个名为`postgres`的用户，一个是操作系统级别的（密码随机），一个是数据库级别的（密码不知道是否随机，忘记了）。使用`psql`连接数据的时候，如果不指定数据库用户，则默认使用跟当前操作系统用户同名的数据库用户连接。经过多次踩坑实践，个人认为**对新手来说**，安装完之后最好立即使用OS级别的用户`postgres`登录系统（前提是你要用root把`postgres`的密码重设），然后再用数据库级别的`postgres`用户登录postgresql10，然后再进行各种数据库的管理工作（例如修改配置文件、重启、创建其它超级用户），这样就能避开设`PGDATA`环境变量的问题（`PGDATA`非常重要，是初始化数据库的一个重要变量，没它就无法初始化了，默认情况下载.bash_profile中会记录PGDATA的值）。

* 对外开放数据数据库的访问，需要修改两个地方，一个是`postgresql.conf`和`pg_hba.conf`（都在你的`PGDATA`目录下），前者决定监听OS的哪些IP和端口（即决定通过哪个IP和端口可以访问到数据库），后者决定对哪些外部用户可以访问到数据库

* 如果前期安装初始化时候有问题，可以通过`/usr/pgsql-10/bin/pg_ctl -D /home/postgres -l /home/postgres/logfile start`来启动数据库

# 安装pgAdmin4
最为简单的方法是从yum安装，因为pgAdmin4有很多额外的依赖，因此需要先配置epel源，可以参考[这里](https://www.cnblogs.com/renpingsheng/p/7845096.html)，简单来说就是直接执行以下命令来配置yum源和安装pgAdmin4
```BASH
yum install -y epel-release
yum install -y pgAdmin4
/usr/pgadmin4/bin/pgadmin4-web-setup.sh #初始化pgAdmin4
```
然后用你本地的pgAdmin4的客户端连上去就可以了