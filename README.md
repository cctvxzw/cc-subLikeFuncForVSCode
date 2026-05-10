# Sublime Search for Lua

VS Code 扩展，为 Lua / tolua 项目提供类似 Sublime Text 的方法级导航体验。

## 功能

- **跨文件方法跳转** — 像 Sublime Text 一样在项目范围内搜索方法
- **悬停查看引用** — 鼠标悬停在方法上，弹出定义位置和所有引用位置
- **实时索引** — 文件保存时自动增量更新索引，支持大型代码库
- **tolua 支持** — 识别 `class("Name", Base)` 类定义和 C# 绑定方法
- **自定义路径** — 通过配置指定包含/排除的文件 glob 规则

## 快捷键

| 功能 | 快捷键 |
|------|--------|
| 转到文件中符号 | `Ctrl + R` |
| 转到工作区中符号 | `Ctrl + Shift + R` |

## 安装

1. 在 VS Code 中按 `Ctrl+Shift+X` 打开扩展面板
2. 搜索 "Sublime Search for Lua"
3. 点击安装

或者本地安装：

```bash
npm install
npm run compile
```

然后在 VS Code 中按 `F5` 启动 Extension Host 调试。

## 配置

在 `settings.json` 中配置：

```json
{
  "sublimeSearch.lua.include": ["**/*.lua"],
  "sublimeSearch.lua.exclude": [
    "**/lua52/**",
    "**/tolua/**",
    "**/node_modules/**"
  ],
  "sublimeSearch.csharp.include": ["**/*.cs"],
  "sublimeSearch.csharp.exclude": ["**/Editor/**"],
  "sublimeSearch.enableCSharp": true,
  "sublimeSearch.indexOnStartup": true
}
```

## 支持的方法模式

- 显式函数定义：`function Foo:Bar()`、`function Baz()`
- 类方法调用：`UIPanel.new()`、`obj:method()`
- tolua 类定义：`class("BattleSystem", BaseClass)`

## 依赖

- VS Code ^1.80.0
- Node.js + TypeScript
- esbuild

## License

MIT