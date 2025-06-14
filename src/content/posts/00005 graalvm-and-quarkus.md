---
title: 'Java 的未来？--GraalVM 和 Quarkus 分享'
published: 2021-07-24 15:42:49
tags: [Java,Spring,GraalVM,Quarkus]
draft: false
description: 'GraalVM 和 Quarkus 分享'
category: 'Java'
---
## 当前 Java 项目执行的问题
### 项目运行需要 JDK 环境，且 JDK 比应用服务磁盘占用大
 运行一个 Java 项目，理所当然的，需要配置一个 JDK 环境。
要么是在每台服务器上面配置好 JDK，在上面的 Java 服务使用同一套 JDK；要么是使用容器化技术，每个 docker image 都要配置基础的 JDK 环境。
我在 windows 上查看我安装的 JDK 大小，对于 Oracle-JDK8，在 windows 上要 186MB。
然后我上 hub.docker.com 查看 JDK8 相关的镜像，发现 JDK8 的镜像需要 200M 之多。
虽然 docker 的分层技术，可以让每台部署 docker 的服务器上使用同一层 JDK8 的环境，但是仍然会出现说我们第一个应用 jar 包只有 100M-200M，而 JDK 却比应用 jar 大。
### 项目的代码并不是每个类每行代码都会被调用
我们打包的代码不一定都用上，类似于 Apache Common、Guava 等类库包，我们可能只是使用了相关的一些功能，但是很多功能我们并不是实实在在的用上。当我们打成一个 fat jar 的时候，会带上这些 lib。同样的，我们在迭代中，可能会出现很多并没有使用上的类，但是它们仍然会被编译和打包。
### 相对于 Go 或者是 Rust，Java 项目的内存占用大
对于一个空的 JVM Web 应用（基于 Spring Boot），一启动内存占用可能就就到 200M 以上了。而作为对比，一个空的 Go Web 项目，其实只要 10M 左右。
我查看了我们公司内部的一些容器化的项目，一个只是做相关合并排序操作的 Java 项目，内存占用就高达 1.2-1.5G。
### Java 启动速度慢，导致发布时间长，动态扩容难度增大
我们可能需要（先启动 Docker），启动 JVM，通过 JIT 机制加载编译好的代码。这对于一个中大型项目来说，启动速度十分的慢，发版时间长。如果突发高峰，我们需要动态扩容，那么在高峰期，我们需要等待新的一批机器启动完毕，才能将这些启动好的 Java 项目对外使用，可能启动起来了，高峰期都过了。
再者，JIT 的机制，导致我代码需要 Warm Up，这就导致了我们在刚启动 Java 项目的时候，会出现小部分的超时。
### 小结
对于 Faas 架构、或者是 serverless 的趋势下，Java 项目存在启动高延时，对磁盘和内存资源高占用的问题。对比 Go、Rust 等技术，呈现明显的掉队情况

## GraalVM 和 Native-Image 技术的到来
### 什么是 GraalVM
1. 是一个基于 OpenJDK/OracleJDK 修改过的，高级一点的 JDK。他可以类似于其他 JDK，提供一个 JVM 环境供 Java 服务使用。其中作为 JVM 使用时，GraalVM 使用 Graal Compiler 替换了 HotspotVM 上的年代久远且很久没有大的更新维护的 C2 编译器，如下图。
![](/images/1627230423015.png)
2. 可以使用`AOT编译器`，将应用程序编译成`本地映像（native-image)`，即是将 Java 代码直接编译成可以执行的程序，类比 Go 编译的输出
3. 多语言支持，除了 JVM 语言的支持外，在 GraalVM 上还能编译运行诸如 C++，python，JavaScript 等语言。也就是说 GraalVM 支持跨语言调用，且性能还不错，大有一统天下 VM 的趋势。
![](/images/1627230659475.png)
### AOT 编译（Ahead-of-Time Compilation）
GraalVM 通过 native-image 技术，可以提前静态分析和编译代码。它使用静态分析的技术，将**需要的、实际使用到的类**分析出来，将这些实际用到的类编译成机器码，形成一个可执行文件。而这个可执行文件需要运行起来，就需要`Substrate VM`的支持
[](/images/1627231216488.jpg)
### Substrate VM 
Substrate VM 是一个在 GraalVM 里的极小型的运行时环境，包括了独立的异常处理、同步调度、线程管理、内存管理（垃圾收集器 Serial GC，G1，Epsilon GC）和 JNI 访问等组件。
Substrate VM 还包含了一个本地镜像的构造器（Native Image Generator），用户可以通过本地镜像构造器构建基于构建机器的可执行文件。
如下图，可以看到基于 GraalVM，各种语言通过 Truffle Framwork 和 Graal Compiler，运行在 HostSpot JVM 上或者是 SubstrateVM 上。
![](/images/1627231212550.png)
### 如何使用
0. 首先需要在我们的机器上配置 C/C++ 编译的环境
对于 linux
```shell
# dnf （rpm-based）
sudo dnf install gcc glibc-devel zlib-devel libstdc++-static
# apt （debian-based）
sudo apt-get install build-essential libz-dev zlib1g-dev
# yum （centos）
sudo yum install gcc glibc-devel zlib-devel
```
对于 macos
```shell
xcode-select --install
```
对于 windows，需要安装 Visual Studio 2017 以上的版本（需要用到里面的 Visual C++ Build Tools），且安装是需要勾选语言为英文（使用中文的 x64 命令行会导致编译 native-image 失败）

1. 安装 GraalVM 并且配置环境变量
对于 linux/macos，可以直接使用 SDKMAN 安装
```shell
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 21.1.0.r11-grl
```
对于 windows，直接上官网下载后，按 JDK 配置环境变量的方式进行配置即可

2.  安装 Native-Image
```shell
gu install native-image
```
gu 是 GraalVM 提供的用于安装相关支持的工具，比如如果想在 GraalVM 编译 Python 代码，则只需要使用`gu install python`即可添加 python 支持，其他语言类似

3. 编写年轻人的第一个 Java 程序 -- Hello World
```java title='HelloWorld.java'
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}
```
4. 在终端执行命令编译运行 Java 代码
```shell
javac HelloWorld.java
java HelloWorld
```
此时，终端就会出现 Hello World! 的字样

5. 这是再使用`native-image HelloWorld`即可将 java 代码编译成可执行程序，对应在 windows 上的，就是`helloworld.exe`，对应在 linux/macos 上的就是`helloworld`的二进制文件。通过在命令行使用`helloworld.exe`或者`./helloworld`既可运行这个 HelloWorld 程序

### 小结
1. 通过 GraalVM 和 native-image 技术，我的可以摆脱 JVM 的依赖来运行 Java 编写的程序
2. 通过队代码的静态分析编译和摈弃了原有的 JIT 机制，能让程序拥有更快的的冷启动速度和更小内存占用（后文体现）

## Spring 的努力——Spring Native
> Spring Native provides support for compiling Spring applications to native executables using the GraalVM native-image compiler.

在 Graal Native 技术出来之后，Spring 也不断的在尝试将 Spring 程序编译成本地的可执行的程序。那么他当前的现况如下
1. Beta 阶段（2021.3.11），没有正式的 release 版本，支持了自家很多类库
2. Jdk11 编译出来的程序文件特别大，有 bug，官方还未完全修复
3. Spring Boot 兼容性并不够，不适合在生产环境使用
4. 支持 JDK Proxy，不支持 CGLIB 代理，且反射涉及的类需要额外配置（反射需要相关配置是 Native-Image 技术目前的通病）
但是仍然可以看到 Spring 项目对 native 技术不断的努力。
以下是使用一个基于 Spring Boot 生成一个空项目做简单的对比。
### 启动对比
使用 native image 技术编译后的 Spring Boot 项目
![](/images/1627232557072.png)
使用 mvn package 编译后，使用 java -jar 启动
![](/images/1627232588562.png)
可以看到 native-image 技术下的 Spring Boot 项目有更好的启动速度和更低的内存占用。
其中更好的启动速度是因为 AOT 已经提前编译好了代码，不存在像 JIT 之类的动态类加载机制，避免了相关的耗时，直接启动即可。而更低的内存占用也是因为摈弃了 JIT 机制，减少了像需要管理动态的类加载之类的线程；同时 native 下的 Java 服务，其方法区只是简单的存储一下类的相关元数据，而不像 JVM 下需要保留整个类加载的数据。
### 缺点
编译速度十分慢（1. Native-Image 编译本身慢，2 Spring Native 优化没做好），且编译需要大内存。
使用 native-image 技术编译`mvn package -Pnative`，使用了 4 分半
![](/images/1627232858645.png)
使用原来的 mvn package 只需要 22s
![](/images/1627232908556.png)

### 小结
0. Spring Native 技术让 Spring 有了很好的冷启动速度和减少的内存占用
1. Spring 比较庞大，有很多历史遗留的兼容的原因，兼容的进度不快。
2. 要使用 native 技术，需要放弃很多 Spring 上的动态特性。
3. 编译占用内存大，且编译时间长（native-image 技术通病）

## 未来已来？Quarkus
### 什么是 Quarkus
1. RedHat 开源的一款 Java Framework，最新版本 2.1.1（社区活跃，版本告诉迭代中）
2. 为 Java 虚拟机（JVM）和原生编译而设计的全堆栈 Kubernetes 原生 Java 框架
3. 专门针对容器优化 Java，并使其成为 Serverless、Cloud 和 Kubernetes 环境的高效平台。
4. Quarkus 可与常用 Java 标准、框架和库协同工作，支持诸如 Eclipse MicroProfile、Spring、Apache Kafka、RESTEasy (JAX-RS)、Hibernate ORM (JPA)、Infinispan、Camel 等等类库
5. 支持依赖注入（基于 CDI），且包含一个扩展框架来扩展功能并将其配置、引导并集成到您的应用中。添加扩展就像添加依赖项一样容易
6. 向 GraalVM 提供正确信息，以便对应用进行原生编译。

### 优点
搭配 native-image 技术，冷启动速度快，内存占用小，磁盘占用小
![](/images/1628407267476.png)
![](/images/1628407271839.png)
支持命令式和 reactive 模式编码（图中 @Inject 即为依赖注入）
![](/images/1628407322271.png)
拥有 LiveReload 机制，可以一边开发，一边检验成果。提高开发效率
![](/images/1628407684587.png)
idea 支持好，可以直接生成 Quarkus 项目
![](/images/1628408377420.png)
容器化支持好，新建的项目直接包含 dockerfile
![](/images/1628408430637.png)

### 如何进行使用
1. idea 可直接生成 Quarkus 框架的项目
2. 下一步可以直接选择你项目需要的依赖库，比如 Spring Web Api（可以使用 Spring Web 注解的方式开发程序）、Redis Client（用于连接 Redis）
3. 创建项目后，使用 `./mvnw compile quarkus:dev` 即可启动。
4. 启动后，支持 LiveReload 机制，直接修改代码后保存即可生效
5. 如果要编译成可执行程序，只需要使用 `./mvnw package -Pnatvie` 编译即可。

### 缺点
1. 新框架，更新迭代速度快，经常需要升级版本修复 BUG，对许多类库支持仍在 PREVIEW 或者 EXPERIMENTAL 阶段，不保证稳定。
2. 由于技术太新，市面上还没有大公司落地 native 技术的实践，还需要进一步观察。
3. 为了速度，抛弃了很多 Java 技术的动态特性。

## 总结
通过构建`native image`解决了传统 Java 程序的几个痛点
1、放弃了 Java 的动态类加载特性，内存占用大大减小
2、通过编译成可执行文件，冷启动速度大大加快
3、特别适合容器化 (docker、k8s) 部署（构建出来的 docker image 小巧）
与传统的 Java 虚拟机不同，Native Image 是封闭式的静态分析和编译，不支持 class 的动态加载，程序运行所需要的所有依赖项均在静态分析阶段完成。
缺点：
1、打包之后就不能用传统的 java 调试工具了，要调试只能用 gdb，调试过程比较复杂，Arthas 等不可用。（好在 idea 提供了开发调试方面的支持，GraalVM 也提供了导出程序 Heap 的工具）
2、反射涉及类加载，需要额外的配置文件，不是很方便
3、传统的 JVMTI、java agent、JMX 等等功能都用不了
4、编译时间长且编译时内存占用较大


## 参考链接
1. native-image：https://www.graalvm.org/reference-manual/native-image/#install-native-image  
2. Spring Native：https://docs.spring.io/spring-native/docs/current/reference/htmlsingle/#overview  
3. Quarkus: https://quarkus.io/  
4. Springboot 和 quarkus 的对比文章：https://www.sokube.ch/post/why-i-use-quarkus-rather-than-spring-boot  
5. Pros and Cons for Using GraalVM Native-Images：https://dzone.com/articles/profiling-native-images-in-java  

