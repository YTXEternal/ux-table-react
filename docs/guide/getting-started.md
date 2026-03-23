# 快速开始

本指南将带你从零开始，在 React 项目中安装并运行你的第一个 `ux-table-react` 高性能表格。

## 环境准备

请确保你的项目环境满足以下版本要求：
- **React**: `>= 18.0.0`
- **Node.js**: `>= 18.0.0`

## 安装

我们推荐使用 `pnpm` 进行依赖管理：

```bash
pnpm add ux-table-react
```

或者使用 `npm` / `yarn`：

```bash
npm install ux-table-react
# 或
yarn add ux-table-react
```

## 基础使用

使用 `UxTable` 非常简单，你只需要准备好**列配置（columns）**和**数据源（data）**，并**务必引入组件的样式文件**。

下面是一个包含列排序、列宽调整、固定列和单元格编辑的完整示例：

```tsx
import React, { useState } from 'react';
// 1. 引入组件与类型
import { UxTable } from 'ux-table-react';
import type { UxTableColumn } from 'ux-table-react/types';
// 2. 引入核心样式（必须）
import 'ux-table-react/style.css';

// 定义业务数据接口
interface UserRecord {
  id: string;
  name: string;
  age: number;
  role: string;
  address: string;
}

export default function App() {
  // 初始化数据源
  const [data, setData] = useState<UserRecord[]>([
    { id: '1', name: '张三', age: 32, role: '研发工程师', address: '杭州市西湖区' },
    { id: '2', name: '李四', age: 28, role: '产品经理', address: '杭州市滨江区' },
    { id: '3', name: '王五', age: 24, role: 'UI设计师', address: '杭州市余杭区' },
  ]);

  // 配置列属性
  const columns: UxTableColumn<UserRecord>[] = [
    { 
      title: '姓名', 
      dataIndex: 'name', 
      width: 120, 
      fixed: 'left', // 固定在左侧
      editable: true // 允许双击编辑
    },
    { 
      title: '年龄', 
      dataIndex: 'age', 
      width: 100, 
      sorter: true, // 开启默认排序
      resizable: true // 允许拖拽表头边缘调整列宽
    },
    { 
      title: '职位', 
      dataIndex: 'role', 
      width: 150,
      editable: true
    },
    { 
      title: '住址', 
      dataIndex: 'address', 
      width: 300,
      editable: true
    },
  ];

  return (
    // 外层容器必须有明确的高度，因为底层使用了虚拟滚动引擎
    <div style={{ height: 500, width: '100%' }}>
      <UxTable 
        columns={columns} 
        data={data} 
        rowKey="id" // 指定数据中作为唯一标识的字段名
        onDataChange={setData} // 当表格内部发生编辑、粘贴等修改时，同步到外部状态
        recordNum={10} // 开启操作历史记录，支持 Ctrl+Z 撤销和 Ctrl+Y 恢复
        primaryColor="#1677ff" // 自定义表格主色调（如焦点框颜色）
      />
    </div>
  );
}
```

## 注意事项

::: warning ⚠️ 必看：容器高度
由于 `ux-table-react` 底层采用的是绝对定位的虚拟滚动架构，因此包裹 `<UxTable />` 的**父容器必须具有明确的高度**（如 `height: 500px` 或 `height: 100vh`），否则表格可能无法正常渲染或显示为空白。
:::

::: danger ⚠️ 必看：样式引入
千万不要忘记在项目入口或使用的地方引入样式文件：
```ts
import 'ux-table-react/style.css';
```
否则所有的交互与排版都会失效。
:::

::: info 🔄 数据同步
`UxTable` 在处理编辑和粘贴等行为时，内部会产生新数据。你需要通过 `onDataChange` 回调函数将新数据同步回你的 React State 中，以实现单向数据流闭环。
:::

## 下一步

- 了解更多高级配置与 API，请查阅 [组件 API 文档](../components/ux-table.md)。
