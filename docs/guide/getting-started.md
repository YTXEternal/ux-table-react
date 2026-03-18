# 快速开始

## 安装

```bash
pnpm add ux-table-react
```

## 使用

```tsx
import { UxTable } from 'ux-table-react'
import 'ux-table-react/style.css'

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '年龄', dataIndex: 'age', key: 'age' },
  { title: '住址', dataIndex: 'address', key: 'address' },
];

const data = [
  { key: '1', name: '胡彦祖', age: 32, address: '西湖区湖底公园1号' },
  { key: '2', name: '胡彦祖', age: 42, address: '西湖区湖底公园1号' },
];

function App() {
  return <UxTable columns={columns} data={data} rowKey="key" />
}
```
