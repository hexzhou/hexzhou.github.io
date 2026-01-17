---
title: 'ygocdb - 游戏王查卡器 iOS 版'
published: 2026-01-17 13:23:00
tags: [iOS,SwiftUI,ygo]
draft: false
description: '一款专为 iOS 用户打造的简中游戏王查卡工具'
image: ''
category: 'iOS'
---

## 前言
大家好，我是 hex@T³。  
这一次做的是纯原生 iOS 应用——**游戏王查卡器（ygocdb）**。

## 为什么要做这个？

目前在 iOS 上查卡的路径都太长，不方便：

1. **打开微信 → 打开查卡器（跳过广告）→ 输入文字搜索**（还有可能第一下搜索失败）
2. **打开浏览器 → 进入百鸽 → 输入文字搜索**
3. **打开 KoishiPro2iOS → 打开编辑卡组 → 编辑卡组 → 输入文字搜索**（字在左侧不方便查看）

其中 1、3 还**无法查看简体中文卡名**。

作为一个经常需要查卡的 OCG/简中 玩家，这个痛点实在是太痛了！

所以，这个版本的查卡器应运而生。

## 功能特性

- 🔍 **全文搜索**：支持中/日/英多语言卡名、密码、效果文本搜索
- 📜 **搜索历史**：自动保存近 5 条搜索记录，支持一键清空
- 🎯 **高级筛选**：按卡片类型（怪兽/魔法/陷阱）、种族、属性等筛选
- ⭐ **先行卡查看**：实时获取最新的先行卡片信息
- 🖼️ **多语言卡图**：支持 YGOPRO/简中/日文/英文卡图切换
- 📝 **多来源译名**：YGOPRO/简中/Master Duel/NWBBS/CNOCG 译名可选
- ⚡ **自动更新**：支持自动/手动更新策略，可配置更新间隔
- 📵 **离线支持**：下载后可完全离线使用

## 技术架构

采用 **SwiftUI + MVVM** 架构模式开发，纯原生 iOS 应用。

- **最低支持**：iOS 15.0+
- **开发工具**：Xcode 14.0+、Swift 5.0+
- **架构模式**：MVVM (Model-View-ViewModel)

核心模块包括：
- **Models**：卡片数据模型、设置管理
- **Repository**：卡片数据仓库，支持全文搜索
- **Services**：API 封装、图片缓存服务
- **Views**：搜索、详情、设置等界面组件

## 数据来源

卡片数据来源于 [百鸽（ygocdb.com）](https://ygocdb.com)，感谢百鸽提供的优质数据！

## 下载安装

**IPA 下载地址**：  
[下载链接](https://cdntx.moecube.com/ex/koishipro2-hex/release/ygocdb-ios_1.0.0.ipa)

> ⚠️ 注意：笔者只提供 IPA 包，请读者自行自签安装。

## 开源链接

CodeMoeNext：https://code.moenext.com/hex/ygocdb-ios
GitHub：https://github.com/hexzhou/ygocdb-ios


## 最后

分享与热爱，下次见。
