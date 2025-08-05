---
title: '【Unity】告别手动修改：用脚本自动化 Xcode 项目配置'
published: 2025-08-05 00:00:00
tags: [iOS,Unity,xcode]
draft: false
description: '告别令人抓狂的重复劳动'
image: ''
category: 'Unity'
---
## 用途：解决了什么问题

每次从 Unity 构建 iOS 项目后，我都需要手动打开 Xcode 修改`Info.plist`文件，来开启文件共享等功能。这个过程**耗时、重复且容易出错**。

这段代码的作用，就是**在Unity构建完成后，自动修改`Info.plist`文件**，将这个手动步骤变为全自动化。

## 代码与核心解析

```cs
using System.IO;
using UnityEditor;
using UnityEditor.Callbacks;
using UnityEditor.iOS.Xcode;

public class EnableFileSharingPostBuildProcessor
{
    // [PostProcessBuild] 让此方法在Unity构建完成后自动执行
    [PostProcessBuild]
    public static void ChangeXcodePlist(BuildTarget buildTarget, string pathToBuiltProject)
    {
        // 确保只在构建iOS平台时生效
        if (buildTarget == BuildTarget.iOS)
        {
            // 找到并读取Info.plist文件
            string plistPath = pathToBuiltProject + "/Info.plist";
            PlistDocument plist = new PlistDocument();
            plist.ReadFromString(File.ReadAllText(plistPath));
            PlistElementDict rootDict = plist.root;

            // 核心操作：自动添加或修改以下两个关键设置
            // 1. 允许通过iTunes/Finder进行文件共享
            rootDict.SetBoolean("UIFileSharingEnabled", true);
            // 2. 允许在iOS的“文件”App中直接打开应用内的文档
            rootDict.SetBoolean("LSSupportsOpeningDocumentsInPlace", true);

            // 保存修改
            File.WriteAllText(plistPath, plist.WriteToString());
        }
    }
}
```

*   **`[PostProcessBuild]`**: Unity的内置功能，会自动在项目构建后调用这个方法。
*   **`PlistDocument` API**: Unity提供的专用工具，用于安全、方便地读写`.plist`文件。
*   **`UIFileSharingEnabled` & `LSSupportsOpeningDocumentsInPlace`**: 这两个是iOS系统的关键Key，用于开启文件共享和系统文件集成功能。

## **使用方法**

将 EnableFileSharingPostBuildProcessor.cs 放在 Unity 的 Editor 文件夹下。
设置完成。下次构建iOS项目时，配置将自动生效。

## **核心价值**

*   **提高效率：** 告别重复的手动修改，一劳永逸。
*   **保证可靠：** 避免人为遗忘或拼写错误，确保每次配置都正确无误。
