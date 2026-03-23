import React, { useRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { act } from 'react';
const isTestEnv = process.env.NODE_ENV === 'test';
import type { UxTableProps, UxTableColumn } from './types';
import { useFixedColumns } from './hooks/useFixedColumns';
import { useClipboard } from './hooks/useClipboard';
import { useWebWorker } from './hooks/useWebWorker';
import { processCopy, processPasteParse, processPaste, processDelete } from './workers/workerLogic';
import type { WorkerPayload, WorkerResult } from './workers/types';
import { createTableWorker } from './workers/createWorker';
import { useVirtualizer, defaultRangeExtractor } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import { CELL_HEIGHT } from './constants';
import { HeaderCell } from './components/HeaderCell';
import { BodyCell } from './components/BodyCell';

import { useResizing } from './hooks/useResizing';
import { useSelection } from './hooks/useSelection';
import { useEditing } from './hooks/useEditing';
import { useSorting } from './hooks/useSorting';


/**
 * 同步滚动条位置，复用滚动逻辑
 * @param {HTMLElement | null} source 源滚动容器
 * @param {HTMLElement | null} target 目标滚动容器
 * @returns {void}
 */
const syncScroll = (source: HTMLElement | null, target: HTMLElement | null): void => {
    if (!source || !target) return; // 卫语句：校验 DOM 元素是否存在

    const sourceMax = source.scrollWidth - source.clientWidth;
    const targetMax = target.scrollWidth - target.clientWidth;

    if (sourceMax <= 0 || targetMax <= 0) return; // 卫语句：校验是否需要滚动

    const percentage = source.scrollLeft / sourceMax;
    const targetScrollLeft = percentage * targetMax;

    if (Math.abs(target.scrollLeft - targetScrollLeft) > 1) {
        target.scrollLeft = targetScrollLeft;
    }
};

/**
 * 补齐并格式化表格列配置
 * @template {unknown[]} DataSource
 * @param {UxTableColumn<DataSource[number]>[]} columns 原始列配置
 * @param {number} targetCols 目标列数
 * @param {((index: number) => string) | undefined} headerText 标题文本格式化函数
 * @returns {UxTableColumn<DataSource[number]>[]} 格式化后的列配置
 */
const fillGridColumns = <DataSource extends unknown[]>(
    columns: UxTableColumn<DataSource[number]>[],
    targetCols: number,
    headerText?: (index: number) => string
): UxTableColumn<DataSource[number]>[] => {
    if (columns.length >= targetCols) return columns;

    const newColumns = [...columns];
    for (let i = columns.length; i < targetCols; i++) {
        // 如果有行号列，那么实际显示的数据列索引可能需要偏移（取决于外部传入的 headerText 怎么定义，这里把原始列的长度传递给它）
        // 为了方便用户，传入的 index 就是当前的列总数（也就是接下来要生成的列的索引，包含可能已经加在最前面的行号列）
        newColumns.push({
            title: headerText ? headerText(i) : String(i + 1),
            dataIndex: `_grid_col_${i}` as keyof DataSource[number],
            key: `_grid_col_${i}`,
            width: 100,
            editable: true,
        } as unknown as UxTableColumn<DataSource[number]>);
    }
    return newColumns;
};

/**
 * 补齐并格式化表格数据
 * @template {unknown[]} DataSource
 * @param {DataSource} propData 原始数据
 * @param {UxTableColumn<DataSource[number]>[]} columns 列配置
 * @param {number} targetRows 目标行数
 * @param {React.Key | ((record: DataSource[number]) => React.Key)} [rowKey] 行键
 * @returns {DataSource} 格式化后的数据
 */
const fillGridData = <DataSource extends unknown[]>(
    propData: DataSource,
    columns: UxTableColumn<DataSource[number]>[],
    targetRows: number,
    rowKey?: React.Key | ((record: DataSource[number]) => React.Key)
): DataSource => {
    const data = new Array(targetRows) as DataSource;

    for (let i = 0; i < targetRows; i++) {
        const existingRow = propData[i] as Record<string, unknown> | undefined;
        const newRow: Record<string, unknown> = existingRow ? { ...existingRow } : {};

        if (!existingRow && typeof rowKey === 'string') {
            newRow[rowKey] = `_grid_row_${i}`;
        }

        // 确保 dataIndex 对应的值存在，为空则填充 null
        columns.forEach((col) => {
            const dataIndex = col.dataIndex as string;
            if (newRow[dataIndex] === undefined || newRow[dataIndex] === '') {
                newRow[dataIndex] = null;
            }
        });

        data[i] = newRow as DataSource[number];
    }

    return data;
};

/**
 * UxTable 组件
 *
 * @template {unknown[]} DataSource 
 * @param {UxTableProps<DataSource>} props 组件的属性，包含列配置、数据数组、行键、类名、数据变化回调、网格配置等
 * @returns {React.ReactElement}
 */
export const UxTable = <DataSource extends unknown[]>(props: UxTableProps<DataSource>) => {
    const {
        columns: propColumns,
        data: propData,
        rowKey,
        className,
        onDataChange,
        gridConfig,
        ref,
        infinite,
        isWorker = true,
        recordNum = 5,
        beforeCopy,
        afterCopy,
        beforePaste,
        afterPaste,
        primaryColor
    } = props;
    const tableRef = useRef<HTMLDivElement>(null);

    const [expandedRows, setExpandedRows] = React.useState(0);
    const [expandedCols, setExpandedCols] = React.useState(0);

    // 历史记录栈，用于撤销和恢复
    const historyRef = useRef<{ past: DataSource[]; future: DataSource[] }>({ past: [], future: [] });
    // 限制 recordNum 的最大值为 20
    const actualRecordNum = useMemo(() => Math.min(Math.max(0, recordNum), 20), [recordNum]);

    // 封装的 onDataChange，在调用外部 onDataChange 前记录历史
    const handleDataChange = useCallback((newData: DataSource) => {
        if (actualRecordNum > 0) {
            historyRef.current.past.push([...propData] as DataSource);
            if (historyRef.current.past.length > actualRecordNum) {
                historyRef.current.past.shift();
            }
            // 一旦有新操作，清空 future
            historyRef.current.future = [];
        }
        if (onDataChange) {
            onDataChange(newData);
        }
    }, [propData, onDataChange, actualRecordNum]);

    // 当传入的 data 或 columns 发生变化时，如果需要重置扩充状态，可以在这里处理。
    // 但通常我们保持当前的扩充状态，或者在外部数据变大时自动适应。

    // 补齐 data 和 columns
    const { finalColumns, finalData } = useMemo(() => {
        let columns = [...propColumns];

        // 在最前面插入行号列
        columns.unshift({
            title: '行',
            dataIndex: '_line_number_' as keyof DataSource[number],
            key: '_line_number_',
            width: 50,
            fixed: 'left',
            editable: false,
            resizable: false,
            render: (_: unknown, __: DataSource[number], index: number) => <div style={{ textAlign: 'center', color: '#9ca3af', userSelect: 'none', width: '100%', fontSize: '12px' }}>{index + 1}</div>
        } as unknown as UxTableColumn<DataSource[number]>);

        let targetRows = propData.length;
        let targetCols = columns.length;

        if (gridConfig) {
            targetCols = Math.max(targetCols, gridConfig.cols);
            targetRows = Math.max(propData.length, gridConfig.rows);
        }

        if (infinite) {
            targetRows += expandedRows;
            targetCols += expandedCols;
        }

        if (targetCols > columns.length) {
            columns = fillGridColumns(columns, targetCols, infinite?.headerText);
        }

        const data = fillGridData(propData, columns, targetRows, rowKey);

        return { finalColumns: columns, finalData: data };
    }, [propColumns, propData, gridConfig, rowKey, infinite, expandedRows, expandedCols]);

    // Hooks
    const { columns, handleResizeMouseDown } = useResizing(finalColumns);
    const { sortState, handleSort, sortedData } = useSorting(finalData, columns);
    const {
        selection,
        setSelection,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleColHeaderMouseDown,
        handleColHeaderMouseEnter,
        isCellSelected,
        isCellActive
    } = useSelection(tableRef);
    const {
        editingCell,
        setEditingCell,
        startEditing,
        saveEdit
    } = useEditing(finalData, columns, sortedData, handleDataChange);
    const fixedOffsets = useFixedColumns(columns);
    const { copyToClipboard } = useClipboard();

    // 初始化 Web Worker
    /**
     * Web Worker 回调策略处理，使用策略模式优化不同的 worker 任务
     * @param {WorkerPayload} payload 传递给 worker 的数据
     * @returns {Promise<unknown>}
     */
    const workerFallback = React.useCallback(async (payload: WorkerPayload): Promise<WorkerResult> => {
        const strategies: { [K in WorkerPayload['type']]: (data: Extract<WorkerPayload, { type: K }>['data']) => WorkerResult } = {
            COPY: (data) =>
                processCopy(data.selectedData, data.columns),
            PASTE_PARSE: (data) =>
                processPasteParse(data.text),
            PASTE: (data) =>
                processPaste(
                    data.text,
                    data.finalData,
                    data.sortedData,
                    data.columns,
                    data.startRow,
                    data.startCol,
                    data.cutBounds
                ),
            DELETE: (data) =>
                processDelete(
                    data.finalData,
                    data.sortedData,
                    data.columns,
                    data.bounds
                )
        };

        const strategy = strategies[payload.type as keyof typeof strategies];
        if (!strategy) return null; // 卫语句：找不到对应策略时返回 null

        // 根据 payload 的 type，将 payload.data 传递给对应的策略
        return (strategy as (data: unknown) => WorkerResult)(payload.data);
    }, []);

    const workerScript = React.useCallback(() => {
        return createTableWorker();
    }, []);

    const { postMessage: postWorkerMessage } = useWebWorker<WorkerPayload, WorkerResult>(workerScript, workerFallback, isWorker);

    const [copiedBounds, setCopiedBounds] = React.useState<{ top: number, bottom: number, left: number, right: number } | null>(null);
    const [cutBounds, setCutBounds] = React.useState<{ top: number, bottom: number, left: number, right: number } | null>(null);

    // 行高管理
    const [rowHeights, setRowHeights] = React.useState<Record<number, number>>({});
    const resizingRowRef = useRef<{ index: number; startY: number; startHeight: number } | null>(null);

    // 样式变量
    const tableStyleVariables = useMemo(() => {
        if (!primaryColor) return {};

        let bgColor = '#e6f7ff';
        if (primaryColor.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            if (primaryColor.length === 4) {
                r = parseInt(primaryColor[1] + primaryColor[1], 16);
                g = parseInt(primaryColor[2] + primaryColor[2], 16);
                b = parseInt(primaryColor[3] + primaryColor[3], 16);
            } else if (primaryColor.length === 7) {
                r = parseInt(primaryColor.substring(1, 3), 16);
                g = parseInt(primaryColor.substring(3, 5), 16);
                b = parseInt(primaryColor.substring(5, 7), 16);
            }
            bgColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
        } else {
            bgColor = `color-mix(in srgb, ${primaryColor} 10%, transparent)`;
        }

        return {
            '--ux-primary-color': primaryColor,
            '--ux-primary-color-bg': bgColor
        } as React.CSSProperties;
    }, [primaryColor]);

    React.useEffect(() => {
        if (editingCell) {
            setCopiedBounds(null);
            setCutBounds(null);
        }
    }, [editingCell]);

    useImperativeHandle(ref, () => ({
        focusArea: (area: { row: [number, number]; cols: [number, number] }) => {
            setSelection({
                start: { row: area.row[0], col: area.cols[0] },
                end: { row: area.row[1], col: area.cols[1] }
            });
            tableRef.current?.focus();
        }
    }), [setSelection]);

    // 选区边界计算
    const selectionBounds = React.useMemo(() => {
        if (!selection) return null;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);
        return { top: r1, bottom: r2, left: c1, right: c2 };
    }, [selection]);

    // Virtualization
    const parentRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: sortedData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => rowHeights[index] || CELL_HEIGHT, // 使用动态行高
        overscan: 5,
    });

    // Notify virtualizer when row heights change
    React.useEffect(() => {
        rowVirtualizer.measure();
    }, [rowHeights, rowVirtualizer]);

    const colVirtualizer = useVirtualizer({
        horizontal: true,
        count: columns.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const width = columns[index].width;
            return typeof width === 'number' ? width : parseInt(width as unknown as string, 10) || 100;
        },
        overscan: 2,
        rangeExtractor: React.useCallback(
            (range: { startIndex: number; endIndex: number; overscan: number; count: number }) => {
                const defaultRange = new Set(defaultRangeExtractor(range));
                columns.forEach((col, index) => {
                    if (col.fixed) {
                        defaultRange.add(index);
                    }
                });
                return Array.from(defaultRange).sort((a, b) => a - b);
            },
            [columns]
        ),
    });

    // Notify virtualizer when column widths change
    React.useEffect(() => {
        colVirtualizer.measure();
    }, [columns, colVirtualizer]);

    // 无限滚动逻辑
    const rowItems = rowVirtualizer.getVirtualItems();
    const colItems = colVirtualizer.getVirtualItems();
    const lastRowIndex = rowItems.length > 0 ? rowItems[rowItems.length - 1].index : 0;
    const lastColIndex = colItems.length > 0 ? colItems[colItems.length - 1].index : 0;

    React.useEffect(() => {
        if (!infinite) return; // 卫语句：没有配置 infinite 时直接返回

        if (lastRowIndex + infinite.gap >= sortedData.length - 1) {
            setExpandedRows(prev => prev + infinite.row);
        }

        if (lastColIndex + infinite.gap >= columns.length - 1) {
            setExpandedCols(prev => prev + infinite.col);
        }
    }, [lastRowIndex, lastColIndex, infinite, sortedData.length, columns.length]);

    /**
     * 处理主区域滚动，同步到底部滚动条
     * @returns {void}
     */
    const handleMainScroll = () => syncScroll(parentRef.current, scrollbarRef.current);

    /**
     * 处理底部滚动条滚动，同步到主区域
     * @returns {void}
     */
    const handleBottomScroll = () => syncScroll(scrollbarRef.current, parentRef.current);

    /**
     * 支持触控板横向滚动
     * @param {React.WheelEvent} e 滚轮事件对象
     * @returns {void}
     */
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaX !== 0 && parentRef.current) {
            parentRef.current.scrollLeft += e.deltaX;
        }
    };

    /**
     * 行高调整鼠标按下事件处理
     * @param {React.MouseEvent} e 鼠标事件对象
     * @param {number} rowIndex 行索引
     * @returns {void}
     */
    const handleRowResizeMouseDown = useCallback((e: React.MouseEvent, rowIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        const startHeight = rowHeights[rowIndex] || CELL_HEIGHT;
        resizingRowRef.current = {
            index: rowIndex,
            startY: e.clientY,
            startHeight
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingRowRef.current) return;
            const deltaY = moveEvent.clientY - resizingRowRef.current.startY;
            const newHeight = Math.max(20, resizingRowRef.current.startHeight + deltaY); // 最小行高限制

            setRowHeights(prev => ({
                ...prev,
                [rowIndex]: newHeight
            }));
        };

        const handleMouseUp = () => {
            resizingRowRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'row-resize';
    }, [rowHeights]);

    /**
     * 键盘事件策略模式处理
     * @param {React.KeyboardEvent} e 键盘事件对象
     * @param {number} currentRow 当前所在行索引
     * @param {number} currentCol 当前所在列索引
     * @returns {boolean} 是否命中了策略
     */
    const executeKeyboardStrategy = (e: React.KeyboardEvent, currentRow: number, currentCol: number): boolean => {
        const rowCount = sortedData.length;
        const colCount = columns.length;

        const strategies: Record<string, () => void> = {
            ArrowUp: () => {
                const newRow = Math.max(0, currentRow - 1);
                setSelection({ start: { row: newRow, col: currentCol }, end: { row: newRow, col: currentCol } });
            },
            ArrowDown: () => {
                const newRow = Math.min(rowCount - 1, currentRow + 1);
                setSelection({ start: { row: newRow, col: currentCol }, end: { row: newRow, col: currentCol } });
            },
            ArrowLeft: () => {
                const newCol = Math.max(0, currentCol - 1);
                setSelection({ start: { row: currentRow, col: newCol }, end: { row: currentRow, col: newCol } });
            },
            ArrowRight: () => {
                const newCol = Math.min(colCount - 1, currentCol + 1);
                setSelection({ start: { row: currentRow, col: newCol }, end: { row: currentRow, col: newCol } });
            },
            Enter: () => {
                startEditing(currentRow, currentCol);
            }
        };

        const strategy = strategies[e.key];
        if (!strategy) return false; // 卫语句：如果没有对应策略，直接返回 false

        e.preventDefault();
        strategy();
        return true;
    };

    /**
     * 处理键盘按下事件
     * @param {React.KeyboardEvent} e 键盘事件对象
     * @returns {void}
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            let handled = false;
            if (copiedBounds || cutBounds) {
                setCopiedBounds(null);
                setCutBounds(null);
                handled = true;
            }
            if (selection) {
                setSelection(null);
                handled = true;
            }
            if (handled) {
                e.preventDefault();
                return;
            }
        }

        if (editingCell || !selection) return; // 卫语句：正在编辑或没有选区时直接返回

        const { start } = selection;

        // 1. 尝试执行方向键和回车键策略
        if (executeKeyboardStrategy(e, start.row, start.col)) return;

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;

        // 2. 复制操作 (Ctrl/Cmd + C)
        if (isCtrlOrMeta && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            handleCopy();
            return;
        }

        // 剪切操作 (Ctrl/Cmd + X)
        if (isCtrlOrMeta && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            handleCut();
            return;
        }

        // 3. 全选 (Ctrl/Cmd + A)
        if (isCtrlOrMeta && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            setSelection({
                start: { row: 0, col: 0 },
                end: { row: sortedData.length - 1, col: columns.length - 1 }
            });
            return;
        }

        // 删除操作 (Delete)
        if (e.key === 'Delete') {
            e.preventDefault();
            handleDelete();
            return;
        }

        // 撤销操作 (Ctrl/Cmd + Z)
        if (isCtrlOrMeta && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            handleUndo();
            return;
        }

        // 恢复操作 (Ctrl/Cmd + Y)
        if (isCtrlOrMeta && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            handleRedo();
            return;
        }

        // 4. 直接输入 (单字符且无修饰键)
        if (e.key.length === 1 && !isCtrlOrMeta && !e.altKey) {
            startEditing(start.row, start.col, e.key);
        }
    };

    /**
     * 处理复制事件
     * @returns {Promise<void>}
     */
    const handleCopy = async () => {
        if (!selection) return; // 卫语句：防止无选区时复制
        // 复制的时候需要吧之前选中的实线区域清空
        setSelection(null);
        const minRow = Math.min(selection.start.row, selection.end.row);
        const maxRow = Math.max(selection.start.row, selection.end.row);
        const r1 = Math.max(0, minRow);
        const r2 = Math.max(0, maxRow);
        let c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        // 如果选区包含了行号列，则将其排除
        if (columns[c1]?.key === '_line_number_') {
            c1 += 1;
        }
        if (c1 > c2) return; // 如果仅选中了行号列，不执行复制

        const selectedData = sortedData.slice(r1, r2 + 1) as DataSource[number][];
        const selectedColumns = columns.slice(c1, c2 + 1);

        if (beforeCopy) {
            const allowCopy = await beforeCopy({ selectedData, columns: selectedColumns });
            if (allowCopy === false) return; // 卫语句：外部阻止复制
        }

        setCopiedBounds({ top: minRow, bottom: maxRow, left: c1, right: c2 });
        setCutBounds(null); // 互斥

        const sanitizedColumns = selectedColumns.map(col => ({
            key: col.key,
            dataIndex: col.dataIndex
        }));

        try {
            const text = await postWorkerMessage({
                type: 'COPY',
                data: { selectedData: selectedData as Record<string, unknown>[], columns: sanitizedColumns }
            });
            if (typeof text === 'string') {
                copyToClipboard(text);
                if (afterCopy) {
                    afterCopy({ text, selectedData, columns: selectedColumns });
                }
            }
        } catch (error) {
            console.error('Copy worker failed:', error);
        }
    };

    /**
     * 处理剪切事件
     * @returns {Promise<void>}
     */
    const handleCut = async () => {
        if (!selection) return; // 卫语句：防止无选区时剪切
        setSelection(null);
        const minRow = Math.min(selection.start.row, selection.end.row);
        const maxRow = Math.max(selection.start.row, selection.end.row);
        const r1 = Math.max(0, minRow);
        const r2 = Math.max(0, maxRow);
        let c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        // 如果选区包含了行号列，则将其排除
        if (columns[c1]?.key === '_line_number_') {
            c1 += 1;
        }
        if (c1 > c2) return; // 如果仅选中了行号列，不执行剪切

        setCutBounds({ top: minRow, bottom: maxRow, left: c1, right: c2 });
        setCopiedBounds(null); // 互斥

        const selectedData = sortedData.slice(r1, r2 + 1) as Record<string, unknown>[];
        const sanitizedColumns = columns.slice(c1, c2 + 1).map(col => ({
            key: col.key,
            dataIndex: col.dataIndex
        }));

        try {
            const text = await postWorkerMessage({
                type: 'COPY',
                data: { selectedData, columns: sanitizedColumns }
            });
            if (typeof text === 'string') {
                copyToClipboard(text);
            }
        } catch (error) {
            console.error('Cut worker failed:', error);
        }
    };

    /**
     * 处理删除事件
     * @returns {Promise<void>}
     */
    const handleDelete = async () => {
        if (!selection || !onDataChange) return; // 卫语句：无选区或无回调时返回
        const r1 = Math.max(0, Math.min(selection.start.row, selection.end.row));
        const r2 = Math.max(0, Math.max(selection.start.row, selection.end.row));
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        const sanitizedColumns = columns.map(col => ({
            key: col.key,
            editable: col.editable,
            dataIndex: col.dataIndex
        }));

        try {
            const result = await postWorkerMessage({
                type: 'DELETE',
                data: {
                    finalData: finalData as Record<string, unknown>[],
                    sortedData: sortedData as Record<string, unknown>[],
                    columns: sanitizedColumns,
                    bounds: { top: r1, bottom: r2, left: c1, right: c2 }
                }
            }) as { newData: Record<string, unknown>[] } | null;

            if (result && result.newData) {
                handleDataChange(result.newData as DataSource);
            }
        } catch (error) {
            console.error('Delete worker failed:', error);
        }
    };

    /**
     * 处理粘贴事件
     * @param {React.ClipboardEvent} e 剪贴板事件对象
     * @returns {Promise<void>}
     */
    const handlePaste = async (e: React.ClipboardEvent) => {
        if (!selection || !onDataChange) return; // 卫语句：无选区或无回调时返回
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        if (!text) return; // 卫语句：无粘贴内容时返回

        const startRow = Math.max(0, Math.min(selection.start.row, selection.end.row));
        let startCol = Math.min(selection.start.col, selection.end.col);

        // 如果选区起始列为行号列，将其向右偏移一位，以便粘贴到实际数据列中
        if (columns[startCol]?.key === '_line_number_') {
            startCol += 1;
        }
        if (startCol >= columns.length) return; // 防止越界

        if (beforePaste) {
            const allowPaste = await beforePaste({ text, startRow, startCol });
            if (allowPaste === false) return; // 卫语句：外部阻止粘贴
        }

        try {
            const sanitizedColumns = columns.map(col => ({
                key: col.key,
                editable: col.editable,
                dataIndex: col.dataIndex
            }));

            const result = await postWorkerMessage({
                type: 'PASTE',
                data: {
                    text,
                    finalData: finalData as Record<string, unknown>[],
                    sortedData: sortedData as Record<string, unknown>[],
                    columns: sanitizedColumns,
                    startRow,
                    startCol,
                    cutBounds
                }
            }) as { newData: Record<string, unknown>[]; maxRowIdx: number; maxColIdx: number } | null;

            if (result && result.newData) {
                const doPasteUpdate = () => {
                    handleDataChange(result.newData as DataSource);
                    setSelection({
                        start: { row: startRow, col: startCol },
                        end: { row: result.maxRowIdx, col: result.maxColIdx }
                    });
                };
                if (isTestEnv) {
                    await act(async () => {
                        doPasteUpdate();
                    });
                } else {
                    doPasteUpdate();
                }
                tableRef.current?.focus();

                if (afterPaste) {
                    afterPaste({
                        text,
                        newData: result.newData as DataSource,
                        startRow,
                        startCol,
                        maxRowIdx: result.maxRowIdx,
                        maxColIdx: result.maxColIdx
                    });
                }
            }

            const doClearBounds = () => {
                setCutBounds(null);
                setCopiedBounds(null);
            };
            if (isTestEnv) {
                await act(async () => {
                    doClearBounds();
                });
            } else {
                doClearBounds();
            }
        } catch (error) {
            console.error('Paste worker failed:', error);
        }
    };

    /**
     * 处理撤销事件
     */
    const handleUndo = useCallback(() => {
        if (actualRecordNum <= 0 || !onDataChange || historyRef.current.past.length === 0) return;

        const previousState = historyRef.current.past.pop()!;
        historyRef.current.future.push([...propData] as DataSource);
        onDataChange(previousState);
    }, [actualRecordNum, onDataChange, propData]);

    /**
     * 处理恢复事件
     */
    const handleRedo = useCallback(() => {
        if (actualRecordNum <= 0 || !onDataChange || historyRef.current.future.length === 0) return;

        const nextState = historyRef.current.future.pop()!;
        historyRef.current.past.push([...propData] as DataSource);
        onDataChange(nextState);
    }, [actualRecordNum, onDataChange, propData]);

    /**
     * 取消编辑
     * @returns {void}
     */
    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        tableRef.current?.focus();
    }, [setEditingCell]);

    /**
     * 渲染表头单元格
     * @param {VirtualItem} virtualCol 虚拟列数据
     * @returns {React.ReactElement} 表头单元格组件
     */
    const renderHeaderCell = useCallback((virtualCol: VirtualItem) => {
        const index = virtualCol.index;
        const column = columns[index];
        const isFixed = column.fixed;
        const offset = fixedOffsets[index];
        const isSelected = selectionBounds !== null && selectionBounds.top === -1 && index >= selectionBounds.left && index <= selectionBounds.right;
        const isSelectionLeft = isSelected && selectionBounds?.left === index;
        const isSelectionRight = isSelected && selectionBounds?.right === index;

        const isCopied = copiedBounds &&
            copiedBounds.top === -1 &&
            index >= copiedBounds.left && index <= copiedBounds.right;
        const isCut = cutBounds &&
            cutBounds.top === -1 &&
            index >= cutBounds.left && index <= cutBounds.right;

        const isAntsTop = !!((isCopied && copiedBounds.top === -1) || (isCut && cutBounds.top === -1));
        // 表头始终是区域的最上方，只有当仅复制表头时才有 bottom（当前逻辑不允许仅复制表头，所以 bottom 为 false）
        // 但是为了组件的完整性，这里还是计算一下
        const isAntsBottom = !!((isCopied && copiedBounds.bottom === -1) || (isCut && cutBounds.bottom === -1));
        const isAntsLeft = !!((isCopied && index === copiedBounds.left) || (isCut && index === cutBounds.left));
        const isAntsRight = !!((isCopied && index === copiedBounds.right) || (isCut && index === cutBounds.right));

        return (
            <HeaderCell
                key={column.key || String(column.dataIndex) || index}
                index={index}
                column={column}
                virtualStart={virtualCol.start}
                virtualSize={virtualCol.size}
                isFixed={isFixed}
                offset={offset}
                sortOrder={sortState?.order}
                isSorted={sortState?.colIndex === index}
                isSelected={isSelected}
                isSelectionLeft={isSelectionLeft}
                isSelectionRight={isSelectionRight}
                isAntsTop={isAntsTop}
                isAntsBottom={isAntsBottom}
                isAntsLeft={isAntsLeft}
                isAntsRight={isAntsRight}
                dataLength={sortedData.length}
                handleColHeaderMouseDown={handleColHeaderMouseDown}
                handleColHeaderMouseEnter={handleColHeaderMouseEnter}
                handleSort={handleSort}
                handleResizeMouseDown={handleResizeMouseDown}
            />
        );
    }, [columns, fixedOffsets, sortState, selectionBounds, copiedBounds, cutBounds, sortedData.length, handleColHeaderMouseDown, handleColHeaderMouseEnter, handleSort, handleResizeMouseDown]);

    /**
     * 渲染数据体单元格
     * @param {VirtualItem} virtualCol 虚拟列数据
     * @param {number} rowIndex 行索引
     * @param {Record<string, unknown>} record 行数据
     * @returns {React.ReactElement} 数据体单元格组件
     */
    const renderBodyCell = useCallback((virtualCol: VirtualItem, rowIndex: number, record: Record<string, unknown>) => {
        const colIndex = virtualCol.index;
        const column = columns[colIndex];
        const isFixed = column.fixed;
        const offset = fixedOffsets[colIndex];
        const isSelected = isCellSelected(rowIndex, colIndex);
        const isActive = isCellActive(rowIndex, colIndex);
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
        const value = record[column.dataIndex as string];

        const isCopied = copiedBounds &&
            rowIndex >= copiedBounds.top && rowIndex <= copiedBounds.bottom &&
            colIndex >= copiedBounds.left && colIndex <= copiedBounds.right;
        const isCut = cutBounds &&
            rowIndex >= cutBounds.top && rowIndex <= cutBounds.bottom &&
            colIndex >= cutBounds.left && colIndex <= cutBounds.right;

        const isAntsTop = !!((isCopied && rowIndex === copiedBounds.top) || (isCut && rowIndex === cutBounds.top));
        const isAntsBottom = !!((isCopied && rowIndex === copiedBounds.bottom) || (isCut && rowIndex === cutBounds.bottom));
        const isAntsLeft = !!((isCopied && colIndex === copiedBounds.left) || (isCut && colIndex === cutBounds.left));
        const isAntsRight = !!((isCopied && colIndex === copiedBounds.right) || (isCut && colIndex === cutBounds.right));

        const isRowSelectionMode = !!(selection && selection.start.col === 0 && selection.end.col === columns.length - 1);
        const isLineNumberCol = column.key === '_line_number_';

        const initialEditValue = isEditing ? (editingCell.initialValue !== undefined ? editingCell.initialValue : String(value ?? '')) : '';

        return (
            <BodyCell
                key={column.key || String(column.dataIndex) || colIndex}
                rowIndex={rowIndex}
                colIndex={colIndex}
                virtualStart={virtualCol.start}
                virtualSize={virtualCol.size}
                record={record as DataSource[number]}
                value={value}
                column={column}
                isFixed={isFixed}
                offset={offset}
                isSelected={isSelected}
                isActive={isActive}
                isEditing={isEditing}
                isLineNumberCol={isLineNumberCol}
                columnsLength={columns.length}
                selectionBounds={selectionBounds}
                isRowSelectionMode={isRowSelectionMode}
                isAntsTop={isAntsTop}
                isAntsBottom={isAntsBottom}
                isAntsLeft={isAntsLeft}
                isAntsRight={isAntsRight}
                isCut={!!isCut}
                handleCellMouseDown={handleCellMouseDown}
                handleCellMouseEnter={handleCellMouseEnter}
                handleRowResizeMouseDown={handleRowResizeMouseDown}
                startEditing={startEditing}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                initialEditValue={initialEditValue}
            />
        );
    }, [columns, fixedOffsets, isCellSelected, isCellActive, editingCell, copiedBounds, cutBounds, selection, selectionBounds, handleCellMouseDown, handleCellMouseEnter, handleRowResizeMouseDown, startEditing, saveEdit, cancelEdit]);

    return (
        <div
            className={`ux-table-wrapper ${className || ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                width: 'auto',
                borderTop: '1px solid #f0f0f0',
                borderLeft: '1px solid #f0f0f0',
                ...tableStyleVariables,
                ...props.style
            }}
        >
            <div
                ref={(node) => {
                    tableRef.current = node;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore Assigning to read-only ref for virtualizer
                    parentRef.current = node;
                }}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onScroll={handleMainScroll}
                onWheel={handleWheel}
                style={{
                    overflowY: 'auto',
                    overflowX: 'hidden', /* 隐藏横向滚动条，通过底部滚动条控制 */
                    position: 'relative',
                    outline: 'none',
                    userSelect: 'none', // 防止拖拽时选中文本
                }}
                className="scrollbar-thin ux-table-main-scrollbar"
            >
                <div style={{
                    height: `${rowVirtualizer.getTotalSize() + (1 * CELL_HEIGHT)}px`,
                    width: `${colVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                    background: '#fcfcfc', // 表格空白区域背景色
                }}>
                    {/* 渲染表头 */}
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 3,
                        display: 'flex',
                        height: '40px', // 固定表头高度
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)', // 表头底部微弱阴影
                    }} data-testid="ux-table-header-row">
                        {colVirtualizer.getVirtualItems().map(renderHeaderCell)}
                    </div>
                    {/* 渲染数据体 */}
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const rowIndex = virtualRow.index;
                        const record = sortedData[rowIndex];
                        let rowKeyValue: React.Key = rowIndex;
                        if (typeof rowKey === 'function') {
                            rowKeyValue = rowKey(record);
                        } else if (typeof rowKey === 'string') {
                            rowKeyValue = (record as Record<string, unknown>)[rowKey] as React.Key;
                        }
                        return (
                            <div
                                key={rowKeyValue}
                                className="ux-table-row group"
                                data-testid={`ux-table-row-${rowIndex}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start + 40}px)`, // +40 为表头高度
                                    display: 'flex',
                                    zIndex: (selectionBounds && rowIndex >= selectionBounds.top && rowIndex <= selectionBounds.bottom) ? 2 : 1 // 提升包含选中单元格的行的层级
                                }}
                            >
                                {colVirtualizer.getVirtualItems().map(virtualCol => {
                                    return renderBodyCell(virtualCol, rowIndex, record as Record<string, unknown>)
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 底部标签页与滚动条区域 */}
            <div className="ux-table-bottom-bar" style={{ boxShadow: '0 -1px 2px rgba(0,0,0,0.02)', zIndex: 4 }}>
                {/* 左侧：标签页 (暂作示例) */}
                <div className="ux-table-tabs">
                </div>

                {/* 右侧：同步横向滚动条 */}
                <div
                    ref={scrollbarRef}
                    className="ux-table-scrollbar-x-container"
                    onScroll={handleBottomScroll}
                >
                    <div style={{ width: `${colVirtualizer.getTotalSize()}px`, height: '1px' }} />
                </div>
            </div>
        </div>
    );
};
