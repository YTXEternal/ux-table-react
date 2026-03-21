import type React from 'react';
import type { UxTableColumn } from '../../types';
import type { EditingState } from '../../hooks/useEditing/types';

/**
 * 表格数据体组件的属性接口
 * @template RecordType 数据记录的类型
 */
export interface BodyProps<RecordType> {
    /** 当前展示的数据源数组 */
    data: RecordType[];
    /** 表格的列配置数组 */
    columns: UxTableColumn<RecordType>[];
    /** 获取数据行唯一键值的配置，可以是字符串字段名或函数 */
    rowKey: string | ((record: RecordType) => string) | undefined;
    /** 固定列的偏移量配置及边缘标记数组，与列配置一一对应 */
    fixedOffsets: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean }[];
    /** 判断指定单元格是否处于被选中状态的函数 */
    isCellSelected: (rowIndex: number, colIndex: number) => boolean;
    /** 判断指定单元格是否为当前活动状态的函数 */
    isCellActive: (rowIndex: number, colIndex: number) => boolean;
    /** 当前正在编辑的单元格状态，如果没有则为 null */
    editingCell: EditingState | null;
    /** 正在编辑时的输入框值 */
    editValue: string;
    /** 表格容器的引用，用于事件处理时的聚焦等操作 */
    tableRef: React.RefObject<HTMLDivElement | null>;
    /** 鼠标按下单元格时的回调函数 */
    onCellMouseDown: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
    /** 鼠标进入单元格时的回调函数，用于拖拽框选 */
    onCellMouseEnter: (rowIndex: number, colIndex: number) => void;
    /** 鼠标双击单元格时的回调函数，用于触发编辑模式 */
    onCellDoubleClick: (rowIndex: number, colIndex: number, initialValue?: string) => void;
    /** 编辑输入框值发生变化时的回调 */
    onEditChange: (value: string) => void;
    /** 保存编辑内容的回调 */
    onEditSave: () => void;
    /** 取消编辑的回调 */
    onEditCancel: () => void;
}
