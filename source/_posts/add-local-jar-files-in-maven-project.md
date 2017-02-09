---
title: springmvc项目中，通过maven使用本地jar包
---
## 起因
项目所有的jar包都使用maven repository私服，所以如果有新的第三方包，就需要先上传上去私服才能使用，但是需要
一些时间。可是开发进度不等人，所以要想办法直接在项目中使用第三方包。

## 解决办法一
在pom.xml文件中添加
```
<dependency>
    <groupId>com.yourgroup</groupId>
    <artifactId>yourartifactId</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/lib/xxx.jar</systemPath>
</dependency>
```
其中groupId、artifactId和version对应的值都可以随便填写，然后systemPath填写jar对应的路径  
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
可是，当运行项目和用maven进行打包时，无法将该jar包打到项目内，导致无法找到对应的类。
解决办法是在pom.xml中加入
```
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
意思是增加一个maven打包的插件，把/lib目录下的jar文件都进行打包。

## 解决办法二
可以把jar包放到`src/main/java/webapp/WEB-INF/lib/`下，然后在pom.xml中加入
```
<dependency>
    <groupId>com.yourgroup</groupId>
    <artifactId>yourartifactId</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/src/main/webapp/WEB-INF/lib/xxx.jar</systemPath>
</dependency>
```
这样子，就可以不需要像方法一一样加入maven打包插件了



## 后记
其实在pom.xml声明system级别的scope是十分不推荐的行为，是evil的。
> System scope was only designed to deal with 'system' files; files sitting in some fixed location. Files in  /usr/lib, or ${java.home} (e.g. tools.jar). It wasn't designed to support miscellaneous .jar files in your project.  

后面将jar包导入到私服后，就可以将上面的配置删除掉了。