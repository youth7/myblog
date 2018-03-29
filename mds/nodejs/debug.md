如果你使用以下几类工具，则它们有内置的调试工具，这里不再啰嗦
* VS Code 1.10+
* Visual Studio
* JetBrains WebStorm 2017.1+ 或者 JetBrains 家族的其它IDEs

如果你像我这样使用sublime text + ssh进行远程开发的话，则可以考虑以下的客户端

## [node-inspect](https://github.com/nodejs/node-inspect)
这是早期最流行的调试工具
* 优点：可以通过npm一键安装，界面简洁，方便易用。
* 缺点：每逢node大版本升级它总是会出现问题，需要维护人员进行更新。最严重的是在node 6发布初的一段时间内维护人员人间蒸发，依赖它的开发者鸡飞狗跳天天在github上问项目还是否继续维护。恰逢chrome自带的调试客户端也在那段时间发布，于是本人顺势弃坑，最近上github看了下好像它又有维护了，不过不建议使用。

## [node自带的debugger](http://nodejs.cn/api/en/debugger.html#debugger_debugger)
无UI的纯命令行界面，跟Linux下的GDB类似，极其难用
* 优点：node自带，无需任何第三方依赖
* 缺点：命令行界面，效率低下

## 终极武器V8 Inspector+Chrome DevTools 
目前最好用的调试工具，将会是以后的主流
* 优点：界面简洁，方便易用
* 缺点：需要高版本的node和chrome支持

使用方法1：通过`node --inspect xxx.js`或者`node --inspect-brk xxx.js`启用程序，然后打开在chrome，在地址栏中敲入chrome://inspect，根据提示选择需要调试的程序。

使用方法2：安装[Install the Chrome Extension NIM (Node Inspector Manager)](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)(有了这个插件之后调试node更加方便，它默认在后台运行，一旦检测到node应用在inspect模式下启用，就立即打开debug窗口，不用再在命令行copy来copy去，非常推荐！)

更加详细情况请参考[官方文档](https://nodejs.org/en/docs/inspector/)