# UX Table React

[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://react.dev/)

UX Table React 是一个基于 React 开发的高性能表格组件库。它专为大数据量和复杂交互场景设计，内置了丰富的数据网格（DataGrid）功能，在保持轻量级的同时提供极致的渲染性能。

## ✨ 简介 (核心特性)

- 🚀 **极致性能**：内置虚拟滚动（Virtual Scrolling）与 Web Worker 数据处理，轻松应对十万级甚至百万级数据渲染。
- 🛠 **功能丰富**：
  - **列操作**：支持固定列（左/右）、列宽拖拽调整（Resizing）、列排序（Sorting）。
  - **数据交互**：支持单元格内联编辑（Editing）、行列/多单元格选中（Selection）。
  - **Excel 级体验**：支持剪贴板带蚂蚁线动画复制粘贴（Clipboard），支持撤销重做（Undo/Redo），按键导航（键盘上下左右、ESC 取消选中、Delete 删除数据等）。
- 📦 **开箱即用**：零额外配置，支持按需引入，包含完善的类型推导。
- 🛡️ **TypeScript 支持**：代码库 100% 使用 TypeScript 编写，杜绝 `any`，提供极佳的开发体验。

## 📦 安装

推荐使用 `pnpm` 进行安装：

```bash
pnpm add ux-table-react
```

或者使用 `npm` / `yarn`：

```bash
npm install ux-table-react
# 或
yarn add ux-table-react
```

> **注意**：本项目依赖 `react` 和 `react-dom`（>=18.0.0），请确保你的项目中已安装相关对等依赖。

## 💻 在线预览

[👉 点击查看在线预览](https://ytxeternal.github.io/ux-table-react/example)

## 🚀 使用文档 (快速上手)

[📖 使用文档](https://ytxeternal.github.io/ux-table-react/)

## 👨‍💻 贡献代码

我们非常欢迎你参与到 `ux-table-react` 的开发中来！

### 常用命令

- **启动开发环境（组件库预览）**
  ```bash
  pnpm dev
  ```
- **构建生产包**
  ```bash
  pnpm build
  ```
- **运行测试**
  项目包含了详尽的单元测试和 E2E 测试，确保代码质量：
  ```bash
  pnpm test         # 运行单元测试 (Jest)
  pnpm test:e2e     # 运行 E2E 测试 (Cypress)
  ```
- **启动文档开发环境**
  ```bash
  pnpm docs:dev
  ```
- **代码提交**
  本项目遵循 GitFlow 工作流及 Angular 提交规范。请使用 `pnpm commit` 替代 `git commit`，并确保提交信息**以中文为主**。

### 提交流程

1. 基于 `master` 切换分支，功能开发使用 `feat/*`，修复使用 `hotfix/*`
2. 提交您的更改 (`pnpm commit`) - 务必遵守中文为主的提交规范！
3. 推送至分支
4. 开启一个 Pull Request

> **代码规范提示**：
> - 必须采用 JSDoc 格式进行注释
> - 注释、测试的 `it` / `describe` 等任务描述必须是中文
> - 避免冗余代码，尽量减少嵌套深度，避免直接使用过多的 `if-else`（可采用策略模式、卫语句优化）
> - TypeScript 中禁止使用 `any` 类型

## 📄 协议

本项目基于 [MIT](https://github.com/YTXEternal/ux-table-react/blob/develop/LICENSE.txt) 协议开源。
