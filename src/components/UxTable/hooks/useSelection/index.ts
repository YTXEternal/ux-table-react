import { useState, useEffect, useRef } from 'react';
import type { SelectionState, UseSelectionReturn } from './types';

/**
 * 用于管理表格单元格和行列选择状态的 Hook
 * 
 * @param {React.RefObject<HTMLDivElement | null>} tableRef 表格容器的引用，用于在选中后自动聚焦以接收键盘事件
 * @returns {UseSelectionReturn} 包含选择状态和事件处理函数的对象
 */
export const useSelection = (tableRef: React.RefObject<HTMLDivElement | null>): UseSelectionReturn => {
    // 当前的选区状态
    const [selection, setSelection] = useState<SelectionState | null>(null);
    // 是否正在进行框选拖拽的标志
    const isSelecting = useRef<boolean>(false);

    /**
     * 设置是否正在进行框选
     * 
     * @param {boolean} value 是否正在框选
     * @returns {void}
     */
    const setIsSelecting = (value: boolean) => {
        isSelecting.current = value;
    }

    useEffect(() => {
        // 全局鼠标抬起事件处理，结束框选状态
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
        }
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    /**
     * 处理单元格的鼠标按下事件（开始框选或单选）
     * 
     * @param {React.MouseEvent} e 鼠标事件对象
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @param {number} colCount 总列数
     * @param {boolean} [isLineNumberCol=false] 是否点击了行号列（如果是，则选中整行）
     * @returns {void}
     */
    const handleCellMouseDown = (e: React.MouseEvent, rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
        if (e.button !== 0) return; // 仅响应鼠标左键点击
        setIsSelecting(true);

        /*
        * 基于 isLineNumberCol 判断当前行是否需要全选
        */
        if (isLineNumberCol) {
            setSelection({
                start: { row: rowIndex, col: 0 },
                end: { row: rowIndex, col: Math.max(0, colCount - 1) }
            });
        } else {
            setSelection({
                start: { row: rowIndex, col: colIndex },
                end: { row: rowIndex, col: colIndex }
            });
        }
        // 聚焦表格以使键盘事件能够生效
        tableRef.current?.focus();
    };

    /**
     * 处理单元格的鼠标进入事件（拖拽框选过程中的区域更新）
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @param {number} colCount 总列数
     * @param {boolean} [isLineNumberCol=false] 是否经过了行号列
     * @returns {void}
     */
    const handleCellMouseEnter = (rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
        if (isSelecting.current && selection) {
            if (isLineNumberCol) {
                setSelection({
                    ...selection,
                    end: { row: rowIndex, col: Math.max(0, colCount - 1) }
                });
            } else {
                setSelection({
                    ...selection,
                    end: { row: rowIndex, col: colIndex }
                });
            }
        }
    };

    /**
     * 处理列头的鼠标按下事件（选中整列）
     *
     * @param {React.MouseEvent} e 鼠标事件对象
     * @param {number} colIndex 被点击的列索引
     * @param {number} rowCount 数据总行数
     * @returns {void}
     */
    const handleColHeaderMouseDown = (e: React.MouseEvent, colIndex: number, rowCount: number) => {
        if (e.button !== 0) return; // 仅响应鼠标左键点击
        setIsSelecting(true);
        setSelection({
            start: { row: 0, col: colIndex },
            end: { row: Math.max(0, rowCount - 1), col: colIndex }
        });
        tableRef.current?.focus();
    };

    /**
     * 处理列头的鼠标进入事件（拖拽列头进行多列选择）
     *
     * @param {number} colIndex 当前进入的列索引
     * @param {number} rowCount 数据总行数
     * @returns {void}
     */
    const handleColHeaderMouseEnter = (colIndex: number, rowCount: number) => {
        if (isSelecting.current && selection) {
            setSelection({
                ...selection,
                end: { row: Math.max(0, rowCount - 1), col: colIndex }
            });
        }
    };

    /**
     * 判断指定的单元格是否在当前选区内
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @returns {boolean} 是否被选中
     */
    const isCellSelected = (rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);
        return rowIndex >= r1 && rowIndex <= r2 && colIndex >= c1 && colIndex <= c2;
    };

    /**
     * 判断指定的单元格是否为选区的起始活动单元格
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @returns {boolean} 是否为活动单元格
     */
    const isCellActive = (rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        return selection.start.row === rowIndex && selection.start.col === colIndex;
    };

    return {
        selection,
        setSelection,
        isSelecting,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleColHeaderMouseDown,
        handleColHeaderMouseEnter,
        isCellSelected,
        isCellActive
    };
};
