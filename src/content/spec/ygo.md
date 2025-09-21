# KoishiPro2 iOS 个人修改版 Release Notes

## 📦 IPA 下载
### 2025-09-21
- **下载地址**：[koishi.pro](https://cdntx.moecube.com/ex/koishipro2-hex/release/KoishiPro2-1.036.2-TCube-0921.ipa)  
- **更新内容**：
  1. 修复 iOS 18 后的字体缺失的问题，由于打包了整个字体库安装包又大了一点；
  2. 增加加速动画效果的开关，目前默认是加速 1.5 倍。
  3. 优化抽卡后有两排卡且有连锁的摄像头切换；
  4. 限制可展示的禁卡表为 OCG 和 TCG 最近三个，之前太多了展示不了最新的表，所以我改了一下；
  5. 继续优化刘海屏适配处理。
 
建议更新前备份一下自己的 ygopro2 文件夹。重新安装后复制迁移数据。
PS：加速动画效果在 Koishi 服会看起来没效，在其他服和录像时是会正常加速；
PS2：我个人测试是加速 1.5 倍效果比较好（不会太快也不会太慢）。
如果想更快，可以自己修改 config.conf, 增加一行配置”speedUp->2“，即加速 2 倍，以此类推。

---

### 2025-08-22
- **下载地址**：[koishi.pro](https://koishi.pro/download/)  
- **更新内容**：
  - 增加iPad 用的分辨率：2100x1400；  
  - 修复⚡️加速导致卡片无法选中的问题；  
  - 增加滚动列表项间的间隔，美观点。  

---


### 2025-08-08
- **下载地址**：[koishi.pro](https://koishi.pro/download/)  
- **更新内容**：
  - 优化“超先行卡”更新下载。  
  - 添加“立绘资源“更新下载，目前卡图立绘有 10000+，建议首次自行导入完整包（最下方提供立绘资源下载），后续再更新下载，否则首次下载 10000+ 要很久。  
  - 部分 UI 优化：如聊天记录信息字体加大，卡片搜索框加大，立绘特写完整展示等。  
  - 场地背景图自动下载使用。  

---

### 2025-08-03
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1wPX6qHSqq-GNQF9Rs0Bb2g?pwd=j2ng)  
  **提取码**：`j2ng`
- **更新内容**：
  - 添加“超先行卡”更新下载按钮
  - 简单优化特写立绘大小

---

### 2025-07-28
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1WoY0Z44_GPmxPrLdTEVXfQ?pwd=1944)  
  **提取码**：`1944`
- **更新内容**：
  - 异形屏 UI 适配，UI 布局优化。包括以前的消息记录界面、工具栏位置、卡片搜索区域等等，都进行了一些优化。
  - 修复被我干掉了的装备特效
  - 修复被我干掉了的鼠标点击特效

---

### 2025-07-23
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1gebCMbFMjPvM3e4sKinM3w?pwd=bhef)  
  **提取码**：`bhef`
- **更新内容**：
  - 主要是一些流畅性的优化，功能没改变。**如果有问题，建议重装 0710 版本**。
  - **高刷新率支持：90Hz 和 120Hz**，前提是机器支持高刷新率（iPhone13 开始的 Pro 及 ProMax 机型才支持 120Hz 刷新率）。
  - **增加卡片数据库下载前检查**，服务器资源有更新才会下载（之前每次启动都会下载7mb的卡片数据文件）。
  - **边缘防误触优化**：防止滑到边缘就出通知栏这种情况。
  - **图片下载优化**：之前是同步下载的，不重试，失败需要重启游戏；现在是异步下载，且会重试。
  - **其他**：终于把项目从 Unity2017 更新到了 Unity2021，后续可以支持更多现代化的改造和优化。升级之后打包的体积比原来大一点，37MB -> 42MB。

---

### 2025-07-10
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1AqTVj6rsJ-d7AaffqmP8RQ?pwd=bgpd)  
  **提取码**：`bgpd`
- **修复内容**：
  - 修复动画效果，部分动画加快（如投骰子、投硬币等）
  - 修复 G3 换 SIDE 异常
  - 修复 MC 匹配进房间闪退异常

---

### 2025-07-04
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1XxjjC7LZWpiXX1sOJRJIwg?pwd=52qr)  
  **提取码**：`52qr`

- **修复内容**：
  - 修复换 SIDE 异常

---

### 2025-07-02
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1SazPfvPCoj_OkdEOQLfgFw?pwd=cgjg)  
  **提取码**：`cgjg`
- **修复内容**：
  - 协议升级：兼容 1.036.2 版本服务器协议。
  - UI修复： 解决窗口UI概率性消失的Bug，启动后将自动居中。
  - 新增服务器：内置“编年史”与“2Pick轮抽”服务器。
  - 系统兼容： iOS系统要求降低至 13.0 及以上
  - 功能优化：自定义服务器地址将自动保存至历史记录，方便切换。

---

### 2025-06-23
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1lpDHhSkYnrkAvyW8iy2irA?pwd=m55d)  
  **提取码**：`m55d`
- **修复内容**：
  - 修复 iOS 文件夹权限（0620 手动打包漏了文件夹权限）

---

### 2025-06-20
- **下载地址**：[百度网盘](https://pan.baidu.com/s/19XpeszJYkC9RT9pffAyRpg?pwd=adbi)  
  **提取码**：`adbi`
- **新增特性**：
  1. 简单适配 iOS 刘海屏，左侧卡片描述区域在刘海屏上减少遮挡
  2. 盖放前场卡片时，增加**二次确认**
  3. 修复 MYGO 服务器地址的错误

---

### 2025-06-14
- **下载地址**：[百度网盘](https://pan.baidu.com/s/1Byf4LHb22tYzg0wVov-ZSQ?pwd=cy23)  
  **提取码**：`cy23`
- **新增特性**：
  1. 结算界面卡顿问题修复
  2. 主界面卡顿问题修复，启动速度加快
  3. 分辨率设置会保存，启动后默认使用上一次的分辨率设置。默认分辨率调整为 1600x900
  4. 服务器列表增加 EXP 服和 MYGO 超先行服
  5. “设置”界面乱点无法关闭问题修复
  6. 双击添加卡牌修改为**长按添加卡牌**（腱鞘炎福音）
  7. 下载代码规范化，使用官方异步下载写法，不影响主线程，让界面更流畅

---

## 💻 开源代码

- [https://code.moenext.com/hex/ygopro2](https://code.moenext.com/hex/ygopro2)

---

## 🛠 Xcode 工程文件下载
- [KoishiPro2-1.036.2-TCube-0921_src](http://cdntx.moecube.com/ex/koishipro2-hex/release/KoishiPro2-1.036.2-TCube-0921_src.zip)  
- [KoishiPro2-1.036.2-TCube-0808_src](http://cdntx.moecube.com/ex/koishipro2-hex/release/KoishiPro2-1.036.2-TCube-0808_src.zip)  

---

## 🖼️ 立绘资源
- [20250808 约250MB](http://cdntx.moecube.com/ex/koishipro2-hex/release/closeup_v1.zip)  

---

## 🙏 特别鸣谢

- KoishiPro: [https://koishi.pro/download/](https://koishi.pro/download/)

