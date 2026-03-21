import { useState } from 'react';
import type { UxTableColumn } from '../../types';
import type { EditingState, UseEditingReturn } from './types';

/**
 * 用于管理表格单元格编辑状态的 Hook
 * 
 * @template DataSource 数据源类型，必须是一个数组
 * @param {DataSource} data 原始数据源
 * @param {UxTableColumn<DataSource[number]>[]} columns 表格列配置
 * @param {DataSource} sortedData 经过排序后的当前展示数据
 * @param {(newData: DataSource) => void} [onDataChange] 数据发生变化时的回调函数
 * @returns {UseEditingReturn} 包含编辑状态和操作方法的对象
 */
export const useEditing = <DataSource extends unknown[]>(
    data: DataSource,
    columns: UxTableColumn<DataSource[number]>[],
    sortedData: DataSource,
    onDataChange?: (newData: DataSource) => void
): UseEditingReturn => {
    // 当前正在编辑的单元格状态
    const [editingCell, setEditingCell] = useState<EditingState | null>(null);

    /**
     * 开始编辑指定的单元格
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @param {string} [initialValue] 初始值（例如用户通过键盘直接输入时触发的初始字符）
     * @returns {void}
     */
    const startEditing = (rowIndex: number, colIndex: number, initialValue?: string) => {
        const column = columns[colIndex];
        // 如果该列配置为不可编辑，则直接返回
        if (column.editable === false) return;

        setEditingCell({ rowIndex, colIndex, initialValue });
    };

    /**
     * 保存编辑内容并更新数据
     * 
     * @param {string} value 编辑后的新值
     * @returns {void}
     */
    const saveEdit = (value: string) => {
        if (editingCell && onDataChange) {
            const { rowIndex, colIndex } = editingCell;
            const column = columns[colIndex];
            const newData = [...data] as DataSource;

            // 获取当前编辑行对应的真实数据记录
            const record = sortedData[rowIndex];
            const originalIndex = data.indexOf(record);

            // 如果找到了原始数据索引并且该列有 dataIndex 配置，则更新数据
            if (originalIndex !== -1 && column.dataIndex) {
                const newRecord = { ...data[originalIndex] as object };
                (newRecord as Record<string, unknown>)[column.dataIndex as string] = value;
                newData[originalIndex] = newRecord as DataSource[number];
                onDataChange(newData);
            }
        }
        // 保存后清空编辑状态
        setEditingCell(null);
    };

    return {
        editingCell,
        setEditingCell,
        startEditing,
        saveEdit
    };
};
