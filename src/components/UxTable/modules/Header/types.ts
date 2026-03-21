import type React from 'react';
import type { UxTableColumn } from '../../types';
import type { SortState } from '../../hooks/useSorting/types';

/**
 * 表头组件的属性接口
 * @template RecordType 数据记录的类型
 */
export interface HeaderProps<RecordType> {
    /** 表格的列配置数组 */
    columns: UxTableColumn<RecordType>[];
    /** 当前的排序状态，包含排序列索引和排序方向 */
    sortState: SortState | null;
    /** 固定列的偏移量配置及边缘标记数组，与列配置一一对应 */
    fixedOffsets: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean }[];
    /** 点击列头触发排序的回调函数 */
    onSort: (index: number) => void;
    /** 鼠标按下调整列宽手柄时的回调函数 */
    onResizeMouseDown: (e: React.MouseEvent, index: number) => void;
}
