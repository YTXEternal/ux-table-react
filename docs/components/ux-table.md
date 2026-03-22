# UxTable 表格

高性能的 React 表格组件，专为大数据量与复杂交互设计。支持列排序、内联编辑、固定列、列宽拖拽调整、无限滚动加载、网格空位补齐，以及 Excel 级别的选区、复制粘贴与撤销重做功能。

## 安装

推荐使用 `pnpm` 安装：

```bash
pnpm add ux-table-react
```

## 基础用法

```tsx
import { useState } from 'react'
import { UxTable } from 'ux-table-react'
import 'ux-table-react/style.css' // 必须引入样式文件

const columns = [
  { title: '姓名', dataIndex: 'name', width: 100, editable: true },
  { title: '年龄', dataIndex: 'age', width: 100, sorter: true },
  { title: '地址', dataIndex: 'address', width: 200, editable: true }
];

const initialData = [
  { key: '1', name: '张三', age: 32, address: '西湖区湖底公园1号' },
  { key: '2', name: '李四', age: 42, address: '西湖区湖底公园2号' },
];

export default () => {
  const [data, setData] = useState(initialData)
  
  return (
    <div style={{ height: 400, width: '100%' }}>
      <UxTable 
        columns={columns} 
        data={data} 
        rowKey="key" 
        onDataChange={setData}
        recordNum={10} // 开启撤销重做支持，并记录 10 次历史
      />
    </div>
  )
}
```

## API

### UxTable Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `columns` | 表格列的配置描述 | `UxTableColumn[]` | 必填 |
| `data` | 数据数组 | `DataSource` (泛型数组) | 必填 |
| `rowKey` | 表格行 key 的取值，可以是字符串或一个函数 | `string \| ((record: DataSource[number]) => string)` | `'id'` |
| `ref` | 组件引用，提供暴露的实例方法 (如 `focusArea`) | `React.Ref<UxTableRef>` | - |
| `className` | 容器的自定义类名 | `string` | - |
| `style` | 容器的自定义样式 | `CSSProperties` | - |
| `onDataChange` | 数据发生变化时的回调 (例如编辑单元格后、粘贴后、撤销恢复后) | `(newData: DataSource) => void` | - |
| `gridConfig` | 网格配置，如果指定了 rows 和 cols，即使 data 和 columns 不足也会补齐空单元格，类似 Excel 画布 | `{ rows: number; cols: number; }` | - |
| `infinite` | 无限滚动配置，在 x 轴和 y 轴快要滚动到尽头时（间隔 gap 距离），自动扩充表格的行列 | `{ row: number; col: number; gap: number; headerText?: (index: number) => string; }` | - |
| `isWorker` | 是否开启 Web Worker 进行耗时任务处理 (例如大数据量的复制和粘贴) | `boolean` | `true` |
| `recordNum` | 记录多少次操作历史，用于 ctrl+z/ctrl+y 撤销重做功能。最大上限为 20 次 | `number` | `5` |
| `beforeCopy` | 复制前触发，返回 false 或 Promise 可以阻止默认的复制行为 | `(params: { selectedData: any[]; columns: UxTableColumn[] }) => boolean \| void \| Promise&lt;boolean \| void&gt;` | - |
| `afterCopy` | 复制后触发 | `(params: { text: string; selectedData: any[]; columns: UxTableColumn[] }) => void` | - |
| `beforePaste` | 粘贴前触发，返回 false 或 Promise 可以阻止默认的粘贴行为 | `(params: { text: string; startRow: number; startCol: number }) => boolean \| void \| Promise&lt;boolean \| void&gt;` | - |
| `afterPaste` | 粘贴后触发 | `(params: { text: string; newData: DataSource; startRow: number; startCol: number; maxRowIdx: number; maxColIdx: number }) => void` | - |

### UxTableColumn

列配置属性描述：

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 列头显示文字 | `ReactNode` | 必填 |
| `dataIndex` | 列数据在数据项中对应的 key | `string \| number \| symbol` | 必填 |
| `key` | React key，如果不传默认使用 dataIndex | `Key` | `dataIndex` |
| `render` | 自定义渲染函数 | `(value: unknown, record: RecordType, index: number) => ReactNode` | - |
| `width` | 列宽度 | `number \| string` | - |
| `resizable` | 是否允许拖拽调整列宽 | `boolean` | `false` |
| `editable` | 是否可双击内联编辑 | `boolean` | `false` |
| `sorter` | 排序函数或布尔值，为 `true` 时使用内置的通用排序（支持 string/number/null），为函数时使用自定义排序（返回 &gt;0, &lt;0, 0） | `boolean \| ((a: RecordType, b: RecordType) => number)` | - |
| `fixed` | 冻结列在左侧或右侧 | `'left' \| 'right'` | - |

### 暴露的实例方法 (UxTableRef)

可以通过 `ref` 调用表格暴露的方法：

| 方法名 | 说明 | 类型 |
| --- | --- | --- |
| `focusArea` | 聚焦指定区域，并自动滚动到该区域 | `(area: { row: [number, number]; cols: [number, number] }) => void` |
