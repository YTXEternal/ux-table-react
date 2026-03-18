# UX Table React

[![npm version](https://img.shields.io/npm/v/ux-table-react.svg)](https://www.npmjs.com/package/ux-table-react)
[![License](https://img.shields.io/npm/l/ux-table-react.svg)](https://github.com/ux-table/ux-table-react/blob/main/LICENSE)

UX Table React 是一个基于 React 和 UnoCSS 开发的高性能表格组件库。它提供了丰富的功能，如列排序、可编辑单元格、固定列等，同时保持了轻量级和高性能。

## 特性

- 🚀 **高性能**：基于虚拟滚动（未来支持）和优化的渲染机制。
- 🎨 **样式定制**：基于 UnoCSS，样式灵活可配置。
- 🛠 **功能丰富**：支持排序、筛选、编辑、固定列等常用表格功能。
- 📦 **TypeScript**：完全使用 TypeScript 编写，提供完整的类型提示。

## 安装

```bash
pnpm add ux-table-react
# 或者
npm install ux-table-react
# 或者
yarn add ux-table-react
```

## 快速上手

```tsx
import { UxTable } from 'ux-table-react'
import 'ux-table-react/style.css'

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 100 },
  { title: '住址', dataIndex: 'address', key: 'address', width: 200 },
];

const data = [
  { key: '1', name: '张三', age: 32, address: '西湖区湖底公园1号' },
  { key: '2', name: '李四', age: 42, address: '西湖区湖底公园2号' },
];

function App() {
  return <UxTable columns={columns} data={data} rowKey="key" />
}
```

## 文档

更多详细文档和示例请访问 [文档网站](https://ux-table.github.io/ux-table-react/)。

## 开发

### 启动开发服务器

```bash
pnpm dev
```

### 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e
```

### 构建文档

```bash
pnpm docs:build
```

## 贡献

欢迎提交 Pull Request 和 Issue！

## License

MIT
