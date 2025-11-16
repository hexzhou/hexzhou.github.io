---
title: '瞎折腾之如何准确地输入游戏王卡名'
published: 2025-11-16 00:00:00
tags: [Python,深蓝词库转换]
draft: false
description: ''
image: '/images/0011-0.png'
category: 'Python'
---

### 前言
大家好，我是 hex@T³。经常写游戏王文章的小伙伴都知道，游戏王卡名的输入是非常头痛的问题。  
首先游戏王卡名的翻译就有许多种，包含官方简体中文、MD译名、NW译名、CNOCG译名等，而且朋友间又会经常使用黑话来称呼。  
作为文章作者来说，更希望使用更规范统一的译名来进行称呼，这样无论是新手老手，通过官方的查卡都能更好地查询到卡片的效果。  
推荐大家使用 百鸽(https://ygocdb.com/) 和 游戏王卡片游戏数据库(https://db.yugioh-card-cn.com/index.html) 来进行卡片检索。  


### 如何准确地输入游戏王卡名
回到正题，我希望我在撰写文章时  
1. 能通过输入【bing'jian'long】的时候提示出【冰剑龙 镜翠幻种】  
2. 能通过输入【luo'yin'yu'sheng'nv】的时候提示出【落胤与圣女】  
3. 能通过输入【yinfuhexian】的时候提输出【音服和弦】的相关卡片  
因此我想到了输入法的【词库】功能。  
![](/images/0011-1.png)
可当我研究过后发现，无论是搜狗输入法还是 QQ 拼音输入法，上面的关于【游戏王】的词库都太过久远，大部分在 2017、18 年最后更新。因此许多最新的翻译卡片都没有收录、更不用谈简中翻译了。  
于是乎，我想到了需要自己来创建这个词库，然后导入进输入法。  

### 如何获取较全的简中卡名
首先是如何获取较全的简中卡名。  
百鸽是支持使用简中卡名来进行展示和搜索卡片的。  
![](/images/0011-2.png)
同时，百鸽也提供了 API(https://ygocdb.com/api) 可以下载所有卡片的名称和效果  
![](/images/0011-3.png)
下载过后解压得到的 cards.json 文件就包含了近期所有卡片的信息。  
之后，我需要提取出来 json 文件里面的 sc_name。  
为此，我编写了以下 python 脚本（注意，并不是每张卡片都有简中译名，因为这 1w3 张卡片里面，只有 6000 张在简中已发售）。  
```python
import json

def extract_cn_names_simple():
    # 读取JSON文件
    with open('/path/to/cards.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 提取所有cn_name
    sc_names = [item['sc_name'] for item in data.values() if 'sc_name' in item]

    # 写入到ANSI格式文件
    with open('sc_names.txt', 'w') as f:
        for name in sc_names:
            f.write(name + '\n')

    print(f"提取完成！共 {len(sc_names)} 个名称")
# 执行
extract_cn_names_simple()
```

输出结果如下：  
![](/images/0011-4.png)
之后就是找寻如何构建词库导入输入法的办法了。  

### 如何构建词库
经过一番搜索，我发现了深蓝词库转换(https://github.com/studyzy/imewlconverter/tree/master)  
![](/images/0011-5.png)
经过一番折腾，我发现使用 3.3 版本无法进行转换，但是使用 3.0 版本可以将“无拼音纯汉字”进行转换。  
但是转换过后，导入搜狗和 QQ 拼音都没有实际生效。  
最终我改用了 Rime（小狼毫），再配置了 【雾凇拼音包 (https://github.com/iDvel/rime-ice) 】  之后，我导入了使用深蓝词库转换的 Rime 的词库，如下：  
![](/images/0011-6.png)
![](/images/0011-7.png)

可以发现有 200 多个卡名因为某些原因无法转换，被过滤掉了，检查发现是一些带了奇怪字符的卡名，如纠罪巧相关的。
然后在小狼毫的【用户字典管理】-【导入文本码表】如下：  
![](/images/0011-8.png)
![](/images/0011-9.png)
![](/images/0011-10.png)
![](/images/0011-11.png)


### 最终效果
![](/images/0011-12.png)
![](/images/0011-13.png)
![](/images/0011-15.png)
![](/images/0011-16.png)
![](/images/0011-17.png)




### 问题
效果上比较满意，但仍然存在以下问题：  
1. 没有提取游戏王的字段，我需要有时候只输入字段名，如【音服和弦】、【黯蜜】等；  
2. 需要完整记住卡名，因为生成的拼音编码是从前到后的完整拼音，无法从部分中间开头去找到卡名，如【哆音服和弦・克理娅】等，需要从 duo'yin'fu'he'xian 开始敲起；  
3. 部分卡名确实，如被过滤掉了【纠罪巧α’－愤怒“orgIA”】【纠罪巧β’－傲慢“alazoneIA”】等；  
4. 没在常用的搜狗输入法上处理成功，被迫需要更换 Rime 输入法。  