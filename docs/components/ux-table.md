# UxTable 高性能交互表格

`UxTable` 是一款专为大规模数据和复杂交互设计的 React 表格组件。它深度借鉴了 Excel 的交互体验，内置虚拟滚动与 Web Worker 异步处理，使得在处理海量数据、复杂选区和频繁编辑时依然能保持丝滑的性能表现。

## 核心特性

- 🚀 **极致性能**：基于虚拟滚动（行/列双向）架构，并结合 Web Worker 处理大规模复制/粘贴等耗时任务，拒绝主线程阻塞。
- 📊 **Excel 级交互**：支持任意区域框选、单元格双击编辑、键盘方向键导航、以及基于快捷键的复制（`Ctrl+C`）、剪切（`Ctrl+X`）、粘贴（`Ctrl+V`）与删除（`Delete`）操作。
- ♾️ **无限画布**：支持空网格补齐与边缘无限滚动扩充，轻松实现类似 Excel 的无限画布体验。
- ⏪ **撤销与恢复**：内置状态栈管理，完美支持 `Ctrl+Z` 撤销和 `Ctrl+Y` 恢复，最大可记录 20 次操作。
- 🖱️ **边缘自动滚动**：拖拽选区至表格边缘时，平滑触发自动滚动扩大选区。
- 🎨 **主题定制**：支持通过单一的 `primaryColor` 属性一键切换表格主色调。

## 安装

推荐使用 `pnpm` 进行安装：

```bash
pnpm add ux-table-react
```

## 快速上手

::: tip 💡 样式引入提示
在使用组件前，请务必确保已经引入了核心样式文件 `import 'ux-table-react/style.css'`。
:::

```tsx
import React, { useState } from 'react';
import { UxTable } from 'ux-table-react';
import type { UxTableColumn } from 'ux-table-react/types';
import 'ux-table-react/style.css'; // 务必引入样式文件

// 1. 定义数据类型
interface RecordType {
  id: string;
  name: string;
  age: number;
  address: string;
}

// 2. 定义列配置
const columns: UxTableColumn<RecordType>[] = [
  { title: '姓名', dataIndex: 'name', width: 150, editable: true, resizable: true },
  { title: '年龄', dataIndex: 'age', width: 100, sorter: true },
  { title: '地址', dataIndex: 'address', width: 300, editable: true }
];

// 3. 初始数据
const initialData: RecordType[] = [
  { id: '1', name: '张三', age: 28, address: '杭州市西湖区' },
  { id: '2', name: '李四', age: 32, address: '杭州市滨江区' },
  { id: '3', name: '王五', age: 24, address: '杭州市余杭区' },
];

export default function BasicTable() {
  const [data, setData] = useState<RecordType[]>(initialData);
  
  return (
    <div style={{ height: 400, width: '100%' }}>
      <UxTable 
        columns={columns} 
        data={data} 
        rowKey="id" 
        onDataChange={setData}
        recordNum={10} // 开启操作历史记录，支持 Ctrl+Z / Ctrl+Y
        primaryColor="#722ed1" // 自定义主题色
      />
    </div>
  );
}
```

## 进阶功能与场景

### 1. 无限画布与空网格补齐 (Grid & Infinite)

通过配置 `gridConfig`，即使传入的真实数据较少，表格也会像 Excel 一样补齐到指定的行列数。配合 `infinite` 配置，当用户滚动到边缘时，可以自动触发无限扩充网格大小。

```tsx
<UxTable
  // ... 其他基础配置
  gridConfig={{ rows: 50, cols: 20 }} // 初始化至少渲染 50 行 20 列的网格画布
  infinite={{
    row: 10,     // 纵向触底时自动扩充 10 行
    col: 5,      // 横向触底时自动扩充 5 列
    gap: 3,      // 距离边缘还剩 3 行/列时提前触发扩充
    headerText: (index) => `扩展列 ${index + 1}` // 自定义扩充列的表头文本
  }}
/>
```

### 2. 异步高性能剪贴板处理 (Web Worker)

::: info 🚀 Worker 性能优化
`UxTable` 在处理海量单元格的复制、剪切和粘贴时，默认开启了 `isWorker: true`。这会将复杂的数据提取、行列矩阵计算以及字符串解析下发到 Web Worker 线程执行，从而极大保障了主线程界面的流畅度。
:::

你还可以通过生命周期钩子函数精确拦截或监听剪贴板行为：

```tsx
<UxTable
  // ... 其他基础配置
  beforeCopy={async ({ selectedData, columns }) => {
    console.log('准备复制，当前选中的数据:', selectedData);
    // 返回 false 即可阻止此次复制操作
    return true; 
  }}
  afterPaste={({ text, newData }) => {
    console.log('粘贴完成！受影响的新数据源:', newData);
  }}
/>
```

### 3. 键盘与拖拽导航

`UxTable` 完全拥抱键盘与鼠标重度用户：
- **键盘导航**：支持 `ArrowUp`、`ArrowDown`、`ArrowLeft`、`ArrowRight` 随意移动焦点。
- **编辑激活**：选中单元格后，直接敲击键盘任意字符，或按下 `Enter` 键，或双击鼠标即可无缝进入编辑状态。
- **拖拽边缘自动滚动**：通过 `autoScrollEdgeThreshold` 配置（默认 `5`，即 5% 阈值）。在按住鼠标左键拖拽选区至表格视口边缘时，表格将高频通过 `requestAnimationFrame` 平滑自动滚动，以持续扩大你的选区。

---

## API 参考

### UxTableProps

表格组件主体配置：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `columns` | 表格列的配置描述 | `[UxTableColumn](#uxtablecolumn)<DataSource[number]>[]` | 必填 |
| `data` | 数据源数组 | `DataSource` (泛型) | 必填 |
| `rowKey` | 行唯一标识的 key，支持字符串或取值函数 | `string \| ((record: Record) => string)` | - |
| `onDataChange` | 内部数据变化（编辑、粘贴、删除、撤销恢复）触发的回调，用于受控更新外部数据 | `(newData: DataSource) => void` | - |
| `gridConfig` | 网格基础大小配置。若实际行列不足将自动补全空单元格 | `[GridConfig](#gridconfig)` | - |
| `infinite` | 无限滚动扩充配置 | `[InfiniteConfig](#infiniteconfig)` | - |
| `isWorker` | 是否开启 Web Worker 进行耗时任务处理，关闭后退化为主线程处理 | `boolean` | `true` |
| `recordNum` | 支持撤销/恢复的历史记录最大次数（最大上限为 20） | `number` | `5` |
| `primaryColor` | 表格主色调（影响选中框边框、焦点框及激活背景色等） | `string` | - |
| `autoScrollEdgeThreshold`| 拖拽选区时，触发自动滚动的边缘距离阈值（百分比 1-20） | `[AutoScrollEdgeThreshold](#autoscrolledgethreshold)` | `5` |
| `beforeCopy` | 复制前的拦截钩子，返回 false/Promise 阻止默认行为 | `(params: [BeforeCopyParams](#beforecopyparams)) => boolean \| void \| Promise` | - |
| `afterCopy` | 复制成功后的回调 | `(params: [AfterCopyParams](#aftercopyparams)) => void` | - |
| `beforePaste` | 粘贴前的拦截钩子，返回 false/Promise 阻止默认行为 | `(params: [BeforePasteParams](#beforepasteparams)) => boolean \| void \| Promise` | - |
| `afterPaste` | 粘贴完成并成功应用数据后的回调 | `(params: [AfterPasteParams](#afterpasteparams)) => void` | - |
| `className` | 容器外层附加类名 | `string` | - |
| `style` | 容器外层附加样式 | `React.CSSProperties` | - |

#### GridConfig
| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `rows` | 网格行数 | `number` | 必填 |
| `cols` | 网格列数 | `number` | 必填 |

#### InfiniteConfig
| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `row` | 每次自动扩充的行数 | `number` | 必填 |
| `col` | 每次自动扩充的列数 | `number` | 必填 |
| `gap` | 触发扩充的边缘距离（剩余多少行列时触发） | `number` | 必填 |
| `headerText` | 格式化扩充列的表头文本，默认使用当前列索引 + 1 | `(index: number) => string` | - |

#### AutoScrollEdgeThreshold
`Range<1, 20>`
定义了自动滚动的边缘距离阈值（百分比），范围 1-20。

#### BeforeCopyParams
| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `selectedData` | 当前选中的数据 | `DataSource[number][]` |
| `columns` | 对应的列信息 | `UxTableColumn<DataSource[number]>[]` |

#### AfterCopyParams
| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `text` | 复制到剪贴板的纯文本内容 | `string` |
| `selectedData` | 复制的原始数据 | `DataSource[number][]` |
| `columns` | 对应的列信息 | `UxTableColumn<DataSource[number]>[]` |

#### BeforePasteParams
| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `text` | 剪贴板中读取到的纯文本内容 | `string` |
| `startRow` | 粘贴起始行索引 | `number` |
| `startCol` | 粘贴起始列索引 | `number` |

#### AfterPasteParams
| 属性 | 说明 | 类型 |
| --- | --- | --- |
| `text` | 粘贴的纯文本内容 | `string` |
| `newData` | 粘贴应用后产生的全新数据源 | `DataSource` |
| `startRow` | 粘贴区域起始行索引 | `number` |
| `startCol` | 粘贴区域起始列索引 | `number` |
| `maxRowIdx` | 粘贴区域最大行索引 | `number` |
| `maxColIdx` | 粘贴区域最大列索引 | `number` |

### UxTableColumn

用于定义 `columns` 数组中的每一列规则：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 列头显示文字 | `ReactNode` | 必填 |
| `dataIndex` | 列对应数据项的属性 key | `keyof RecordType` | 必填 |
| `key` | React 的 key 值，缺省时自动使用 `dataIndex` | `React.Key` | - |
| `width` | 列宽度 | `number \| string` | - |
| `render` | 自定义单元格渲染函数 | `(value, record, index) => ReactNode` | - |
| `editable` | 是否允许双击/按键进入内联编辑模式 | `boolean` | `false` |
| `resizable` | 是否允许通过表头拖拽调整列宽 | `boolean` | `false` |
| `sorter` | 排序配置。为 `true` 启用默认比较；传入函数则使用自定义排序逻辑 | `boolean \| ((a, b) => number)` | - |
| `fixed` | 是否将该列冻结在左侧或右侧（支持多列固定） | `'left' \| 'right'` | - |

### 实例方法 (UxTableRef)

通过传入 `ref` 获取表格实例，支持以下指令式操作：

| 方法 | 说明 | 类型 |
| --- | --- | --- |
| `focusArea` | 以编程方式强制表格聚焦，并高亮指定行列范围的选区 | `(area: { row: [number, number]; cols: [number, number] }) => void` |
