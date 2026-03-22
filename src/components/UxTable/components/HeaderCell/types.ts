import type React from 'react';
import type { UxTableColumn } from '../../types';

/**
 * 虚拟滚动表头单元格的属性接口
 * @template RecordType 数据记录的类型
 */
export interface HeaderCellProps<RecordType> {
    /** 单元格所在的列索引 */
    index: number;
    /** 当前列的配置信息 */
    column: UxTableColumn<RecordType>;
    /** 虚拟滚动计算得出的列水平偏移量 */
    virtualStart: number;
    /** 虚拟滚动计算得出的列宽度 */
    virtualSize: number;
    /** 是否为固定列配置 ('left' | 'right' | false | undefined) */
    isFixed: 'left' | 'right' | false | undefined;
    /** 固定列的偏移量及边缘状态标记 */
    offset: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean } | undefined;
    /** 当前列的排序方向 ('asc' | 'desc' | undefined) */
    sortOrder: 'asc' | 'desc' | undefined;
    /** 当前列是否处于排序激活状态 */
    isSorted: boolean;
    /** 表格数据的总长度（用于全选等操作判断） */
    dataLength: number;
    /** 鼠标按下表头时的回调函数（用于选中整列） */
    handleColHeaderMouseDown: (e: React.MouseEvent, index: number, dataLength: number) => void;
    /** 鼠标进入表头时的回调函数（用于拖拽选列） */
    handleColHeaderMouseEnter: (index: number, dataLength: number) => void;
    /** 点击排序指示器时的回调函数 */
    handleSort: (index: number) => void;
    /** 是否被选中（用于多列或列头选择） */
    isSelected?: boolean;
    /** 是否为选中区域的左边界 */
    isSelectionLeft?: boolean;
    /** 是否为选中区域的右边界 */
    isSelectionRight?: boolean;
    /** 顶部是否为蚂蚁线（正在复制/剪切） */
    isAntsTop?: boolean;
    /** 鼠标按下调整列宽手柄时的回调函数 */
    handleResizeMouseDown: (e: React.MouseEvent, index: number) => void;
}
