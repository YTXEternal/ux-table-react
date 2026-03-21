import type React from 'react';
import type { UxTableColumn } from '../../types';

/**
 * 单元格组件的属性接口
 * @template RecordType 数据记录的类型
 */
export interface CellProps<RecordType> {
    /** 当前行的数据记录 */
    record: RecordType;
    /** 当前列的配置信息 */
    column: UxTableColumn<RecordType>;
    /** 当前单元格所在的行索引 */
    rowIndex: number;
    /** 当前单元格所在的列索引 */
    colIndex: number;
    /** 固定列的偏移量配置及边缘标记 */
    fixedOffset?: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean };
    /** 当前单元格是否处于被选中状态（在选区内） */
    isSelected: boolean;
    /** 当前单元格是否为活动状态（选区的起点） */
    isActive: boolean;
    /** 当前单元格是否处于编辑模式 */
    isEditing: boolean;
    /** 正在编辑时的输入框值 */
    editValue: string;
    /** 表格容器的引用，用于事件处理时的聚焦等操作 */
    tableRef: React.RefObject<HTMLDivElement | null>;
    /** 鼠标按下事件回调，用于处理选中逻辑 */
    onMouseDown: (e: React.MouseEvent) => void;
    /** 鼠标进入事件回调，用于处理拖拽框选逻辑 */
    onMouseEnter: () => void;
    /** 鼠标双击事件回调，用于触发编辑模式 */
    onDoubleClick: () => void;
    /** 编辑输入框值发生变化时的回调 */
    onEditChange: (value: string) => void;
    /** 保存编辑内容的回调 */
    onEditSave: () => void;
    /** 取消编辑的回调 */
    onEditCancel: () => void;
}
