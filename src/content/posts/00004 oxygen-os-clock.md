---
title: 氧 OS 打开一加时钟的法定工作日 (跳过节假日) 功能
published: 2020-11-20 20:01:52
description: '氧 OS 打开一加时钟的法定工作日 (跳过节假日) 功能'
image: ''
tags: ['氧 OS','一加手机']
category: 'Android'
draft: false 
lang: ''
---
### 准备工作
1. 手机开启 bootloader
2. 刷入 magisk 用于安装必要模块和获取 root 权限
3. Play Store 安装 ApkExtractor 用于提取时钟 apk
4. 一台配置了 Java 环境的 Win PC


### 过程
1. 首先打开 ApkExtractor，找到`时钟`应用，包名为`com.oneplus.descklock`，点击旁边菜单，选择`分享`
![](/images/1605874073702.jpg)
提取的 APK 所在路径，可以在右上角设置菜单查看
![](/images/1605874214935.jpg)
![](/images/1605874223166.jpg)
在对应路径下，找到 APK，并将 APK 导入 PC

2. 然后在 PC 上下载`AndroidKiller_v1.3.1.zip`[https://down.52pojie.cn/Tools/Android_Tools/](https://down.52pojie.cn/Tools/Android_Tools/)，解压该压缩包。同时下载最新版`apktool`[https://bitbucket.org/iBotPeaches/apktool/downloads/](https://bitbucket.org/iBotPeaches/apktool/downloads/)。`AndroidKiller 1.3.1`内置的 apktool 太旧，会导致反编译错误。

3. 打开`AndroidKiller.exe`，选择最上面的`Android`菜单，点击`APKTOOL`管理器，将我下载好的`apktool.jar` 添加进去
![](/images/1605874881181.png)
选择默认的 ApkTool 版本为我们新添加的版本
![](/images/1605874887653.png)
4. 选择`主页`菜单，点击`打开`，选择我们从手机上导出来的时钟 Apk.
![](/images/1605875052797.png)
稍作等待后，提示`APK 反编译完成!`即可，对于`APK 源码反编译失败!`我们暂时忽略
![](/images/1605875208858.png)

5. 左边菜单，选择`工程管理器`，依次展开`smali_classes5` -> `com` -> `oneplus` -> ` deskclock` -> `picker`。找到`PickerUtils.smali`，双击打开`PickerUtils.smali`，滚到最下面，找到`.method public static isH2()Z`方法
将其中的
```java
.method public static isH2()Z
    .locals 1

    .line 28
    invoke-static {}, Lcom/oneplus/deskclock/Utils;->isH2()Z

    move-result v0

    return v0
.end method
```
修改成
```java
.method public static isH2()Z
    .locals 1

    .line 28
    const/4 v0, 0x1

    return v0
.end method
```
并保存。
![](/images/1605876089271.png)
> 该段代码逻辑，实际是调用一个静态方法判断当前系统是不是氢 OS，然后进行返回。如果不是氢 OS，就不会显示`法定工作日`的选项，所以我们只要把这个方法，修改成强制返回`const/4 v0, 0x1`，时钟就会判定成是氢 OS，从而打到目的。

6. 在修改后，我们需要进行编译，选择`Android`菜单，点击`编译`。发现`APK编译失败`，错误如下
```Shell
   正在编译 APK，请稍等...
>I: Using Apktool 2.4.1
>I: Smaling smali folder into classes.dex...
>I: Smaling smali_classes2 folder into classes2.dex...
>I: Smaling smali_classes3 folder into classes3.dex...
>I: Smaling smali_classes4 folder into classes4.dex...
>I: Smaling smali_classes5 folder into classes5.dex...
>I: Building resources...
>W: D:\apk\AndroidKiller\projects\DeskClock\Project\res\values\styles.xml:926: error: Resource entry CitiesTheme already has bag item onePlusActionbarBackgroundColor.
>W: D:\apk\AndroidKiller\projects\DeskClock\Project\res\values\styles.xml:925: Originally defined here.
>W: 
>brut.androlib.AndrolibException: brut.common.BrutException: could not exec (exit code = 1): [C:\Users\GZZHOU~1\AppData\Local\Temp\brut_util_Jar_4336882941068523831.tmp, p, --forced-package-id, 127, --min-sdk-version, 29, --target-sdk-version, 29, --version-code, 530, --version-name, 5.3.0, --no-version-vectors, -F, C:\Users\GZZHOU~1\AppData\Local\Temp\APKTOOL1039353466293257463.tmp, -e, C:\Users\GZZHOU~1\AppData\Local\Temp\APKTOOL8918995624491212644.tmp, -0, arsc, -I, C:\Users\gzzhoukaihuan\AppData\Local\apktool\framework\1.apk, -S, D:\apk\AndroidKiller\projects\DeskClock\Project\res, -M, D:\apk\AndroidKiller\projects\DeskClock\Project\AndroidManifest.xml]
APK 编译失败，无法继续下一步签名!
```
原因是`\DeskClock\Project\res\values\styles.xml`这个文件，有一个变量定义重复了。依次展开`res` -> `values`，找到并双击打开`styles.xml`，找到错误提示的 925 行，删除掉其中重复的一行后保存。
![](/images/1605876232466.png)
删除掉 925 行或者 926 后，保存，再点击`编译`
![](/images/1605876385968.png)
编译完成后，还会自动签名。*将编译完成的 APK，导入手机。*


7. 现在修改版的时钟应用已经弄好了，只剩下如何替换掉系统内的原有的时钟应用了。我这边采用的方法使用`App Systemizer`讲替换安装到系统分区。
具体操作为
a. 是先下载`Root Explorer`，我们俗称的`RE文件管理器`。给予 RE 文件管理器 ROOT 权限后，进入`/system/app`目录，`挂载为可读写`后，删除`DeskClock`文件后，重启。重启后，时钟应用就消失了。
b. `magisk`搜索安装`App Systemizer`模块和`BusyBox for Android NDK`模块，重启。
c. 在 Play Store 安装`Termux`后，运行`Termux`，输入`su` 获取 root 权限，再输入`systemize`，然后输入`3`，输入从电脑导入到手机上的修改版时钟应用的路径，比如我的是`/sdcard/clock.apk。安装完成后，重启。
d. 最后就能在手机应用列表看到新的时钟应用，且有`法定工作日`的选项。
![](/images/1605877666824.jpg)

关于`App Systemizer`的安装使用，可以参考[这篇文章](https://izaka.tw/magisk-app_systemizer-guide/)