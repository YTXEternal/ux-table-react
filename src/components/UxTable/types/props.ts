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
   * 排序函数，如果存在则表示该列支持排序。
   * 返回 > 0 表示 a > b，< 0 表示 a < b，0 表示 a == b
   */
  sorter?: (a: RecordType, b: RecordType) => number;
  /**
   * 冻结列
   */
  fixed?: 'left' | 'right';
}

export interface UxTableProps<DataSource extends unknown[]> {
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
}
