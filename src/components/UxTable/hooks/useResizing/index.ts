import { useState, useRef } from 'react';
import type { UxTableColumn } from '../../types';
import type { UseResizingReturn } from './types';

/**
 * 用于管理表格列宽拖拽调整的 Hook
 * 
 * @template DataSource 数据源类型
 * @param {UxTableColumn<DataSource[number]>[]} propColumns 外部传入的初始列配置
 * @returns {UseResizingReturn<DataSource[number]>} 包含当前列配置及鼠标事件处理函数的对象
 */
export const useResizing = <DataSource extends unknown[]>(
    propColumns: UxTableColumn<DataSource[number]>[]
): UseResizingReturn<DataSource[number]> => {
    // 内部维护的列配置状态，主要用于更新列宽
    const [columns, setColumns] = useState<UxTableColumn<DataSource[number]>[]>(() => propColumns.map(col => ({
        ...col,
        width: typeof col.width === 'number' ? col.width : (col.width ? parseInt(col.width as string, 10) : undefined)
    })));

    const [prevPropColumns, setPrevPropColumns] = useState(propColumns);

    // 当外部传入的列配置发生变化时，同步更新内部状态
    if (propColumns !== prevPropColumns) {
        setPrevPropColumns(propColumns);
        setColumns(propColumns.map(col => ({
            ...col,
            width: typeof col.width === 'number' ? col.width : (col.width ? parseInt(col.width as string, 10) : undefined)
        })));
    }

    // 记录正在调整宽度的列索引
    const resizingColIndexRef = useRef<number | null>(null);
    // 记录鼠标按下时的 X 坐标
    const startXRef = useRef<number>(0);
    // 记录开始调整时的列宽
    const startWidthRef = useRef<number>(0);

    /**
     * 处理列头拖拽手柄的鼠标按下事件
     * 
     * @param {React.MouseEvent} e 鼠标事件对象
     * @param {number} index 列索引
     * @returns {void}
     */
    const handleResizeMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        resizingColIndexRef.current = index;
        startXRef.current = e.clientX;
        startWidthRef.current = columns[index].width as number || (e.target as HTMLElement).parentElement?.offsetWidth || 100;

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    /**
     * 处理鼠标移动事件，动态计算并更新列宽
     * 
     * @param {MouseEvent} e 鼠标事件对象
     * @returns {void}
     */
    const handleResizeMouseMove = (e: MouseEvent) => {
        if (resizingColIndexRef.current === null) return;
        const deltaX = e.clientX - startXRef.current;
        // 限制列的最小宽度为 50px
        const newWidth = Math.max(50, startWidthRef.current + deltaX);
        setColumns(prev => {
            const next = [...prev];
            next[resizingColIndexRef.current as number] = {
                ...next[resizingColIndexRef.current as number],
                width: newWidth
            };
            return next;
        });
    };

    /**
     * 处理鼠标抬起事件，结束列宽调整
     * 
     * @returns {void}
     */
    const handleResizeMouseUp = () => {
        resizingColIndexRef.current = null;
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
    };

    return {
        columns,
        handleResizeMouseDown
    };
};
