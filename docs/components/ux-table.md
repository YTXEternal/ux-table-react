# UxTable 表格

高性能的 React 表格组件，支持列排序、编辑、固定列等功能。

## 基础用法

```tsx
import { UxTable } from 'ux-table-react'
import 'ux-table-react/style.css'

const columns = [
  { title: '姓名', dataIndex: 'name', width: 100 },
  { title: '年龄', dataIndex: 'age', width: 100 },
  { title: '地址', dataIndex: 'address', width: 200 }
];

const data = [
  { key: '1', name: '张三', age: 32, address: '西湖区湖底公园1号' },
  { key: '2', name: '李四', age: 42, address: '西湖区湖底公园2号' },
];

export default () => <UxTable columns={columns} data={data} rowKey="key" />
```

## API

### UxTable

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 表格列的配置描述 | `UxTableColumn[]` | - |
| data | 数据数组 | `any[]` | - |
| rowKey | 表格行 key 的取值 | `string \| ((record: any) => string)` | - |
| className | 类名 | `string` | - |
| style | 样式 | `CSSProperties` | - |
| onDataChange | 数据发生变化时的回调 | `(newData: any[]) => void` | - |
| gridConfig | 网格配置，用于补齐空单元格 | `{ rows: number; cols: number; }` | - |

### UxTableColumn

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 列头显示文字 | `ReactNode` | - |
| dataIndex | 列数据在数据项中对应的 key | `string` | - |
| key | React key | `Key` | dataIndex |
| render | 自定义渲染函数 | `(value, record, index) => ReactNode` | - |
| width | 列宽度 | `number \| string` | - |
| resizable | 是否允许调整列宽 | `boolean` | false |
| editable | 是否可编辑 | `boolean` | false |
| sorter | 排序函数 | `(a, b) => number` | - |
| fixed | 冻结列 | `'left' \| 'right'` | - |
