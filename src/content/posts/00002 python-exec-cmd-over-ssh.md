---
title: '使用 Python 批量 SSH 登录服务器执行命令'
published: 2019-07-16 16:00:59
tags: [MySQL]
draft: false
description: '有多台服务器运行着实例代码，需要登录上去抓取指定日志，然后进行分析'
image: ''
category: 'Python'
---

### 目的
有多台服务器运行着实例代码，需要登录上去抓取指定日志，然后进行分析。如果一台一台机器登录拿日志处理太过费时间，所以要写一个脚本来处理。

### Paramiko 模块
paramiko 是用 python 语言写的一个模块，遵循 SSH2 协议，支持以加密和认证的方式，进行远程服务器的连接。paramiko 支持 Linux, Solaris, BSD, MacOS X, Windows 等平台通过 SSH 从一个平台连接到另外一个平台。利用该模块，可以方便的进行 ssh 连接和 sftp 协议进行 sftp 文件传输。
```shell
// 安装
pip install paramiko 
```

### 示例代码
```python
#!/usr/bin/python
# -*- coding:utf-8 -*-

import paramiko

# 登录服务器，并执行代码
def sshclient_execmd(hostname, port, username, key, execmd):
	# paramiko 的操作日志，方便排查问题
	paramiko.util.log_to_file("paramiko.log")

	# 创建 SSHClient
	s = paramiko.SSHClient()
	s.set_missing_host_key_policy(paramiko.AutoAddPolicy())

	# 这里是使用 rsa 登录的方式要传一个 privateKey 进来
	# 通过 key = paramiko.RSAKey.from_private_key_file(pkey)
	# 也可以使用账号密码的登录方式
	s.connect(hostname=hostname, port=port, username=username, pkey=key)

	#`执行命令得到输出
	stdin, stdout, stderr = s.exec_command(execmd)

	# 有些时候可能需要输入 Y 确定操作
	# stdin.write("Y")  # Generally speaking, the first connection, need a simple interaction.

	## 读取输出
	output = stdout.read()

	### 操作完毕需要关闭 client
	s.close()

	return output

	# 这里是根据输出做统计分析的代码
def statics(output):
	pass

def main():
	# 服务器相关的 SSH 信息
	hostnames = ['xxx', 'xxx', 'xxx']
	port = 22
	username = 'username'

	# 通过 RSA PrivateKey 文件读取 Key
	pkey = 'D:/id_rsa'
	key = paramiko.RSAKey.from_private_key_file(pkey)

	# 要执行的命令
	execmd = """free -h"""
	output = ""
	for hostname in hostnames:
			output += sshclient_execmd(hostname, port, username, key, execmd).
	# 将输出做分析处理
	statics(output)

if __name__ == "__main__":
	main()
```

## 其他工具 Polysh

[Polysh](http://guichaz.free.fr/polysh/) 可以同时登陆多台服务器，然后批量执行命令