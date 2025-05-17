---
title: 'SpringMVC 项目中，通过 Maven 使用本地 Jar 包'
published: 2017-01-18 16:13:48
tags: [Java,Maven,Spring]
draft: false
description: ''
image: ''
category: 'Java'
---
## 起因
项目所有的 jar 包都使用 maven repository 私服，所以如果有新的第三方包，就需要先上传上去私服才能使用，但是需要
一些时间。可是开发进度不等人，所以要想办法直接在项目中使用第三方包。
<!-- more -->

## 解决办法一
在 pom.xml 文件中添加
```xml title='pom.xml'
<dependency>
    <groupId>com.yourgroup</groupId>
    <artifactId>yourartifactId</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/lib/xxx.jar</systemPath>
</dependency>
```
其中 groupId、artifactId 和 version 对应的值都可以随便填写，然后 systemPath 填写 jar 对应的路径  
```
${project.basedir}/lib/xxx.jar
对应的文件目录架构如下
- |project
-- |src
--- |main
-- |lib
--- | xxx.jar
```
添加了这个依赖之后，intelliJ 就可以在开发的时候，索引到依赖。   
可是，当运行项目和用 maven 进行打包时，无法将该 jar 包打到项目内，导致无法找到对应的类。  
解决办法是在 pom.xml 中加入
```xml title='pom.xml'
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-war-plugin</artifactId>
    <version>2.6</version>
    <configuration>
        <warName>${project.artifactId}</warName>
        <webResources>
            <resource>
                <directory>/lib</directory>
                <targetPath>WEB-INF/lib</targetPath>
                <includes>
                    <include>**/*.jar</include>
                </includes>
            </resource>
         </webResources>
    </configuration>
</plugin>
```
意思是增加一个 maven 打包的插件，把 /lib 目录下的 jar 文件都进行打包。

## 解决办法二
可以把 jar 包放到`src/main/java/webapp/WEB-INF/lib/`下，然后在 pom.xml 中加入
```xml title='pom.xml'
<dependency>
    <groupId>com.yourgroup</groupId>
    <artifactId>yourartifactId</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/src/main/webapp/WEB-INF/lib/xxx.jar</systemPath>
</dependency>
```
这样子，就可以不需要像方法一一样加入 maven 打包插件了



## 后记
其实在 pom.xml 声明 system 级别的 scope 是十分不推荐的行为，是 evil 的。
> System scope was only designed to deal with 'system' files; files sitting in some fixed location. Files in  /usr/lib, or ${java.home} (e.g. tools.jar). It wasn't designed to support miscellaneous .jar files in your project.

后面将 jar 包导入到私服后，就可以将上面的配置删除掉了。