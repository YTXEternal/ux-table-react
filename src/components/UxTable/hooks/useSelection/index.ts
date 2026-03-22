import { useState, useEffect, useRef, useCallback } from 'react';
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
    // 节流标志，防止高频触发鼠标移动事件
    const rafId = useRef<number | null>(null);

    /**
     * 设置是否正在进行框选
     * 
     * @param {boolean} value 是否正在框选
     * @returns {void}
     */
    const setIsSelecting = useCallback((value: boolean) => {
        isSelecting.current = value;
    }, []);

    useEffect(() => {
        // 全局鼠标抬起事件处理，结束框选状态
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        };

        // 点击表格外部取消选中状态
        const handleGlobalMouseDown = (e: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
                setSelection(null);
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousedown', handleGlobalMouseDown);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousedown', handleGlobalMouseDown);
        };
    }, [setIsSelecting, tableRef]);

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
    const handleCellMouseDown = useCallback((e: React.MouseEvent, rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
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
    }, [tableRef, setIsSelecting]);

    /**
     * 处理单元格的鼠标进入事件（拖拽框选过程中的区域更新）
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @param {number} colCount 总列数
     * @param {boolean} [isLineNumberCol=false] 是否经过了行号列
     * @returns {void}
     */
    const handleCellMouseEnter = useCallback((rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
        if (!isSelecting.current) return;

        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        // 使用 requestAnimationFrame 节流，并使用函数式更新解决闭包陷阱
        rafId.current = requestAnimationFrame(() => {
            setSelection(prev => {
                if (!prev) return prev;

                // 检查是否真正发生变化，避免无意义的渲染
                const newEndRow = rowIndex;
                const newEndCol = isLineNumberCol ? Math.max(0, colCount - 1) : colIndex;

                if (prev.end.row === newEndRow && prev.end.col === newEndCol) {
                    return prev;
                }

                return {
                    ...prev,
                    end: { row: newEndRow, col: newEndCol }
                };
            });
        });
    }, []);

    /**
     * 处理列头的鼠标按下事件（选中整列）
     *
     * @param {React.MouseEvent} e 鼠标事件对象
     * @param {number} colIndex 被点击的列索引
     * @param {number} rowCount 数据总行数
     * @returns {void}
     */
    const handleColHeaderMouseDown = useCallback((e: React.MouseEvent, colIndex: number, rowCount: number) => {
        if (e.button !== 0) return; // 仅响应鼠标左键点击
        setIsSelecting(true);
        setSelection({
            start: { row: -1, col: colIndex },
            end: { row: Math.max(0, rowCount - 1), col: colIndex }
        });
        tableRef.current?.focus();
    }, [tableRef, setIsSelecting]);

    /**
     * 处理列头的鼠标进入事件（拖拽列头进行多列选择）
     *
     * @param {number} colIndex 当前进入的列索引
     * @param {number} rowCount 数据总行数
     * @returns {void}
     */
    const handleColHeaderMouseEnter = useCallback((colIndex: number, rowCount: number) => {
        if (!isSelecting.current) return;

        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }

        rafId.current = requestAnimationFrame(() => {
            setSelection(prev => {
                if (!prev) return prev;

                const newEndRow = Math.max(0, rowCount - 1);
                if (prev.end.row === newEndRow && prev.end.col === colIndex) {
                    return prev;
                }

                return {
                    ...prev,
                    end: { row: newEndRow, col: colIndex }
                };
            });
        });
    }, []);

    /**
     * 判断指定的单元格是否在当前选区内
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @returns {boolean} 是否被选中
     */
    const isCellSelected = useCallback((rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);
        return rowIndex >= r1 && rowIndex <= r2 && colIndex >= c1 && colIndex <= c2;
    }, [selection]);

    /**
     * 判断指定的单元格是否为选区的起始活动单元格
     * 
     * @param {number} rowIndex 行索引
     * @param {number} colIndex 列索引
     * @returns {boolean} 是否为活动单元格
     */
    const isCellActive = useCallback((rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        return selection.start.row === rowIndex && selection.start.col === colIndex;
    }, [selection]);

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
