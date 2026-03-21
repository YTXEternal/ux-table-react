import type React from 'react';
import type { UxTableColumn } from '../../types';

/**
 * 虚拟滚动数据体单元格的属性接口
 * @template RecordType 数据记录的类型
 */
export interface BodyCellProps<RecordType> {
    /** 单元格所在的行索引 */
    rowIndex: number;
    /** 单元格所在的列索引 */
    colIndex: number;
    /** 虚拟滚动计算得出的列水平偏移量 */
    virtualStart: number;
    /** 虚拟滚动计算得出的列宽度 */
    virtualSize: number;
    /** 当前行的数据记录 */
    record: RecordType;
    /** 当前单元格的数据值 */
    value: unknown;
    /** 当前列的配置信息 */
    column: UxTableColumn<RecordType>;
    /** 是否为固定列配置 ('left' | 'right' | false | undefined) */
    isFixed: 'left' | 'right' | false | undefined;
    /** 固定列的偏移量及边缘状态标记 */
    offset: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean } | undefined;
    /** 当前单元格是否处于被选中状态 */
    isSelected: boolean;
    /** 当前单元格是否为活动单元格（选区的起点） */
    isActive: boolean;
    /** 当前单元格是否处于编辑模式 */
    isEditing: boolean;
    /** 当前列是否为行号列 */
    isLineNumberCol: boolean;
    /** 表格的总列数 */
    columnsLength: number;
    /** 当前选区的边界信息，包含上下左右的行列索引 */
    selectionBounds: { top: number; bottom: number; left: number; right: number } | null;
    /** 是否处于整行选择模式 */
    isRowSelectionMode: boolean;
    
    // Ant properties（复制/剪切时的蚂蚁线效果边界判断）
    /** 是否处于蚂蚁线选区的上边缘 */
    isAntsTop: boolean;
    /** 是否处于蚂蚁线选区的下边缘 */
    isAntsBottom: boolean;
    /** 是否处于蚂蚁线选区的左边缘 */
    isAntsLeft: boolean;
    /** 是否处于蚂蚁线选区的右边缘 */
    isAntsRight: boolean;
    /** 当前单元格是否被剪切（用于控制透明度等样式） */
    isCut: boolean;

    // Handlers
    /** 单元格鼠标按下事件的回调，用于处理选区开始 */
    handleCellMouseDown: (e: React.MouseEvent, rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean) => void;
    /** 单元格鼠标进入事件的回调，用于处理拖拽选区 */
    handleCellMouseEnter: (rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean) => void;
    /** 行高调整手柄鼠标按下事件的回调 */
    handleRowResizeMouseDown: (e: React.MouseEvent, rowIndex: number) => void;
    /** 触发单元格编辑模式的回调 */
    startEditing: (rowIndex: number, colIndex: number) => void;
    /** 保存编辑内容的回调 */
    saveEdit: (value: string) => void;
    /** 取消编辑的回调 */
    cancelEdit: () => void;
    /** 编辑模式的初始值（例如直接键盘输入触发时） */
    initialEditValue: string;
}
