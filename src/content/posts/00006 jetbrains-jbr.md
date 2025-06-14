---
title: 'JetBrains 开发工具更换最新的 JBR 提高性能（MacOS 限定）'
published: 2021-10-10 14:51:17
tags: [Java,JetBrains,JBR]
draft: false
description: 'JetBrains Runtime 分享'
image: ''
category: 'Java'
---
## 什么是 JBR
> JetBrains Runtime（即 JetBrains 运行时）是一个运行时环境，用于在 Windows，Mac OS X 和 Linux 上 运行 IntelliJ 平台的各种产品。JetBrains Runtime 基于 OpenJDK 项目，并进行了一些修改。这些修改包括：抗锯齿，Linux 上增强的字体渲染，HiDPI 支持，连字，一些官方版本中未提供的针对产品崩溃的修复程序以及其他小的增强功能。
https://github.com/JetBrains/JetBrainsRuntime
目前 JetBrains 的开发工具默认使用基于 JDK11 版本的 JBR，而 JDK11 版本的 java2d 使用 OpenGL 来渲染图形基元。JDK 17 的 java2d 使用了 Metal 框架提供更好的性能（JEP 382: New macOS Rendering Pipeline），并更好地支持现代 macOS 版本和硬件。所以我们现在可以更换 JBR 版本以提高 macOS 下 JetBrains 开发工具的性能。
 ![](/images/1633848995459.png)

## 更换步骤（以下以 idea 为例，其余诸如 pycharm、goland 同理）
•	下载官方提供的最新的 JBR https://github.com/JetBrains/JetBrainsRuntime/releases/tag/jbr17b106.1  或者自行编译（后续教程）
•	更改开发工具的 VM Options,   Help -> Edit Custom VM Options,   增加以下参数
```shell
--illegal-access=warn
-Dsun.java2d.metal=true
--add-opens=java.desktop/java.awt.event=ALL-UNNAMED
--add-opens=java.desktop/sun.font=ALL-UNNAMED
--add-opens=java.desktop/java.awt=ALL-UNNAMED
--add-opens=java.desktop/sun.awt=ALL-UNNAMED
--add-opens=java.base/java.lang=ALL-UNNAMED
--add-opens=java.base/java.util=ALL-UNNAMED
--add-opens=java.desktop/javax.swing=ALL-UNNAMED
--add-opens=java.desktop/sun.swing=ALL-UNNAMED
--add-opens=java.desktop/javax.swing.plaf.basic=ALL-UNNAMED
--add-opens=java.desktop/java.awt.peer=ALL-UNNAMED
--add-opens=java.desktop/javax.swing.text.html=ALL-UNNAMED
--add-exports=java.desktop/sun.font=ALL-UNNAMED
--add-exports=java.desktop/com.apple.eawt=ALL-UNNAMED
--add-exports=java.desktop/com.apple.laf=ALL-UNNAMED
--add-exports=java.desktop/com.apple.eawt.event=ALL-UNNAMED
```
 ![](/images/1633849016382.png)

- IDEA 安装 Choose Runtime 插件（如果插件商店没有，可以下载离线包进行安装 https://plugins.jetbrains.com/plugin/12836-choose-runtime）  

- 使用 Choose Runtime 插件安装并使用最新的 JBR，Help -> Find Action，搜索 Choose Runtime 并运行，点击 … 按钮浏览并选择第一步下载的 JBR 压缩包，然后点击 Install，安装完以后开发工具会自动重启，现在可以看到已经使用了 JDK 17 版本的 JBR
 ![](/images/1633849025685.png)
目前官方的 jbr17b106.1 版本 存在 BUG：切换到全屏无法退出全屏，也无法切换屏幕，想要更好的体验，需要自行编译更新的代码

## 后悔药
如果更换了 JBR 后无法启动的话，或者需要反悔，只需要把对应 idea.jdk 删除即可  
位置比如：
~/Library/Application Support/JetBrains/IntelliJIdea2021.2 下的 idea.jdk
对应的 VM Options 也在这个位置下的 idea.vmoptions，可以直接删除之前添加的 VM Options 恢复原样


## 自行编译 JBR
由于官方只公布了一个 JBR17 的 release B106.1，且存在 BUG，如果想体验更佳的 JBR，就需要自行编译了。
JBR17 对应的官方代码分支是 [https://github.com/JetBrains/JetBrainsRuntime/tree/master17]

我们参考上面的编译步骤自行编译 JBR
 ![](/images/1633849063185.png)
预备动作
1.	安装 Xcode，终端输入 xcode-select –install 安装 xcode command line 
2.	终端输入 brew install autoconf 安装 autoconf
3.	安装 JDK16 以上，这里我们可以直接去 oracle 官方安装 JDK17 LTS [https://www.oracle.com/java/technologies/downloads/]
编译
```shell
$ cd JetBrainsRuntime
$ git checkout master17
$ sh ./configure
$ make images
```
make images 编译过程需要较长时间


如果出现
```shell
configure: error: No xcodebuild tool and no system framework headers found, use --with-sysroot or --with-sdk-name to provide a path to a valid SDK
```
运行了一下``xcodebuild``，错误信息如下：
```shell
xcode-select: error: tool 'xcodebuild' requires Xcode, 
but active developer directory 
'/Library/Developer/CommandLineTools' is a command line tools instance
```
解决办法
```shell
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```
再重新编译就可以

编译完成后在
./JetBrainsRuntime/build/macosx-x86_64-server-release/images/jdk-bundle/jdk-17.jdk
![](/images/1633849124589.png)
然后按照上面的 更换步骤 用 choose runtime 选择编译好的 jdk-17.jdk 即可
 ![](/images/1633849128395.png)

至此，就让 IDEA 使用上了最新源码编译的 JBR17，且用上了 metal 框架的特性。


