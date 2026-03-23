import type { ReactNode, CSSProperties, Key } from 'react';

export interface UxTableColumn<RecordType> {
  /**
   * 列头显示文字
   */
  title: ReactNode;
  /**
   * 列数据在数据项中对应的 key
   */
  dataIndex: keyof RecordType;
  /**
   * React key，默认使用 dataIndex
   */
  key?: Key;
  /**
   * 自定义渲染函数
   */
  render?: (value: unknown, record: RecordType, index: number) => ReactNode;
  /**
   * 列宽度
   */
  width?: number | string;
  /**
   * 是否允许调整列宽
   */
  resizable?: boolean;
  /**
   * 是否可编辑
   */
  editable?: boolean;
  /**
   * 排序函数或布尔值，为 true 时使用内置的通用排序（支持 string | number | null），为函数时使用自定义排序
   * 返回 > 0 表示 a > b，< 0 表示 a < b，0 表示 a == b
   */
  sorter?: boolean | ((a: RecordType, b: RecordType) => number);
  /**
   * 冻结列
   */
  fixed?: 'left' | 'right';
}

export interface UxTableRef {
  /**
   * 聚焦指定区域
   */
  focusArea: (area: { row: [number, number]; cols: [number, number] }) => void;
}

export interface UxTableProps<DataSource extends unknown[]> {
  /**
   * 引用
   */
  ref?: React.Ref<UxTableRef>;
  /**
   * 表格列的配置描述
   */
  columns: UxTableColumn<DataSource[number]>[];
  /**
   * 数据数组
   */
  data: DataSource;
  /**
   * 表格行 key 的取值，可以是字符串或一个函数
   */
  rowKey?: string | ((record: DataSource[number]) => string);
  /**
   * 类名
   */
  className?: string;
  /**
   * 样式
   */
  style?: CSSProperties;
  /**
   * 数据发生变化时的回调 (例如编辑单元格后)
   */
  onDataChange?: (newData: DataSource) => void;
  /**
   * 网格配置，如果指定了 rows 和 cols，即使 data 和 columns 不足也会补齐空单元格，类似 Excel 画布
   */
  gridConfig?: {
    rows: number;
    cols: number;
  };
  /**
   * 无限滚动配置，在x轴和y轴快要滚动到尽头时（间隔gap列/行的距离），根据row和col扩充表格的行列
   */
  infinite?: {
    row: number;
    col: number;
    gap: number;
    /** 格式化扩充列的表头文本，默认使用当前列索引 + 1 */
    headerText?: (index: number) => string;
  };
  /**
   * 是否开启 Web Worker 进行耗时任务处理，默认为 true
   */
  isWorker?: boolean;
  /**
   * 复制前触发，返回 false 或 Promise<false> 可以阻止默认的复制行为
   * @param params 包含被复制的数据和对应的列信息
   * @returns 是否允许复制
   */
  beforeCopy?: (params: { selectedData: DataSource[number][]; columns: UxTableColumn<DataSource[number]>[] }) => boolean | void | Promise<boolean | void>;
  /**
   * 复制后触发
   * @param params 包含复制的文本内容、被复制的数据和对应的列信息
   */
  afterCopy?: (params: { text: string; selectedData: DataSource[number][]; columns: UxTableColumn<DataSource[number]>[] }) => void;
  /**
   * 粘贴前触发，返回 false 或 Promise<false> 可以阻止默认的粘贴行为
   * @param params 包含粘贴的文本内容以及粘贴起始的行列索引
   * @returns 是否允许粘贴
   */
  beforePaste?: (params: { text: string; startRow: number; startCol: number }) => boolean | void | Promise<boolean | void>;
  /**
   * 粘贴后触发
   * @param params 包含粘贴的文本内容、更新后的完整数据、以及粘贴区域的起始和最大行列索引
   */
  afterPaste?: (params: { text: string; newData: DataSource; startRow: number; startCol: number; maxRowIdx: number; maxColIdx: number }) => void;
  /**
   * 记录多少次操作记录，用于撤销/恢复功能。默认为 5 次。最大上限为 20 次。
   */
  recordNum?: number;
  /**
   * 主色调，默认为 #1890ff
   */
  primaryColor?: string;
}
