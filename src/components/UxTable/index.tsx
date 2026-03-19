import React, { useRef, useImperativeHandle } from 'react';
import type { UxTableProps, UxTableColumn } from './types';
import { useResizing } from './hooks/useResizing';
import { useSorting } from './hooks/useSorting';
import { useSelection } from './hooks/useSelection';
import { useEditing } from './hooks/useEditing';
import { useFixedColumns } from './hooks/useFixedColumns';
import { useClipboard } from './hooks/useClipboard';
import { useVirtualizer, defaultRangeExtractor } from '@tanstack/react-virtual';
import styles from './styles.module.css';
import { CELL_HEIGHT } from './constants';

/**
 * 根据索引生成类似 Excel 的列名 A, B, C... Z, AA...
 * @param {number} index 列索引
 * @returns {string} 列名
 */
const getExcelColumnName = (index: number): string => {
    let temp = index;
    let colName = '';
    while (temp >= 0) {
        colName = String.fromCharCode((temp % 26) + 65) + colName;
        temp = Math.floor(temp / 26) - 1;
    }
    return colName;
};

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
 * @returns {UxTableColumn<DataSource[number]>[]} 格式化后的列配置
 */
const fillGridColumns = <DataSource extends unknown[]>(
    columns: UxTableColumn<DataSource[number]>[],
    targetCols: number
): UxTableColumn<DataSource[number]>[] => {
    if (columns.length >= targetCols) return columns;

    const newColumns = [...columns];
    for (let i = columns.length; i < targetCols; i++) {
        newColumns.push({
            title: getExcelColumnName(i),
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
    const { columns: propColumns, data: propData, rowKey, className, onDataChange, gridConfig, ref, lineShow = true } = props;
    const tableRef = useRef<HTMLDivElement>(null);

    // 补齐 data 和 columns
    const { finalColumns, finalData } = React.useMemo(() => {
        let columns = [...propColumns];
        
        // 如果开启 lineShow，在最前面插入行号列
        if (lineShow) {
            columns.unshift({
                title: '',
                dataIndex: '_line_number_' as keyof DataSource[number],
                key: '_line_number_',
                width: 50,
                fixed: 'left',
                editable: false,
                resizable: false,
                render: (_: unknown, __: DataSource[number], index: number) => <div style={{ textAlign: 'center', color: '#bfbfbf', userSelect: 'none', width: '100%' }}>{index + 1}</div>
            } as unknown as UxTableColumn<DataSource[number]>);
        }

        let targetRows = propData.length;

        if (gridConfig) {
            columns = fillGridColumns(columns, gridConfig.cols);
            targetRows = Math.max(propData.length, gridConfig.rows);
        }

        const data = fillGridData(propData, columns, targetRows, rowKey);

        return { finalColumns: columns, finalData: data };
    }, [propColumns, propData, gridConfig, rowKey, lineShow]);

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
        editValue,
        setEditValue,
        startEditing,
        saveEdit
    } = useEditing(finalData, columns, sortedData, onDataChange);
    const fixedOffsets = useFixedColumns(columns);
    const { copyToClipboard } = useClipboard();

    const [copiedBounds, setCopiedBounds] = React.useState<{top: number, bottom: number, left: number, right: number} | null>(null);

    // 行高管理
    const [rowHeights, setRowHeights] = React.useState<Record<number, number>>({});
    const resizingRowRef = useRef<{ index: number; startY: number; startHeight: number } | null>(null);

    React.useEffect(() => {
        if (editingCell) {
            setCopiedBounds(null);
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
    const isCancelingRef = useRef(false);

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

    // 滚动同步复用
    const handleMainScroll = () => syncScroll(parentRef.current, scrollbarRef.current);
    const handleBottomScroll = () => syncScroll(scrollbarRef.current, parentRef.current);

    // 支持触控板横向滚动
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaX !== 0 && parentRef.current) {
            parentRef.current.scrollLeft += e.deltaX;
        }
    };

    // 行高调整相关处理
    const handleRowResizeMouseDown = (e: React.MouseEvent, rowIndex: number) => {
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
    };

    // 键盘事件策略模式处理
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
        if (strategy) {
            e.preventDefault();
            strategy();
            return true;
        }

        return false;
    };

    // Keyboard & Paste Handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (copiedBounds) {
                setCopiedBounds(null);
                e.preventDefault();
                return;
            }
        }
        if (editingCell || !selection) return; // 卫语句：正在编辑或没有选区时直接返回

        const { start } = selection;
        
        // 1. 尝试执行方向键和回车键策略
        if (executeKeyboardStrategy(e, start.row, start.col)) return;

        // 2. 复制操作 (Ctrl/Cmd + C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            handleCopy();
            return;
        }

        // 3. 直接输入 (单字符且无修饰键)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            startEditing(start.row, start.col, e.key);
        }

        // 4. 全选 (Ctrl/Cmd + A)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            setSelection({
                start: { row: 0, col: 0 },
                end: { row: sortedData.length - 1, col: columns.length - 1 }
            });
        }
    };

    const handleCopy = () => {
        if (!selection) return; // 卫语句：防止无选区时复制
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        setCopiedBounds({ top: r1, bottom: r2, left: c1, right: c2 });

        const rows = [];
        for (let i = r1; i <= r2; i++) {
            const rowData = [];
            const record = sortedData[i] as Record<string, unknown>;
            for (let j = c1; j <= c2; j++) {
                // 跳过行号列
                if (columns[j].key === '_line_number_') {
                    continue;
                }
                const val = record[columns[j].dataIndex as string];
                rowData.push(val ?? '');
            }
            // 如果只有行号列被选中，可能会产生空行，这里过滤掉完全没有有效数据的行
            if (rowData.length > 0) {
                rows.push(rowData.join('\t'));
            }
        }
        
        if (rows.length > 0) {
            copyToClipboard(rows.join('\n'));
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (!selection || !onDataChange) return; // 卫语句：无选区或无回调时返回
        setCopiedBounds(null);
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        if (!text) return; // 卫语句：无粘贴内容时返回

        const rows = text.split(/\r\n|\n|\r/).filter(row => row.length > 0);
        if (rows.length === 0) return; // 卫语句：无有效行时返回

        const startRow = Math.min(selection.start.row, selection.end.row);
        const startCol = Math.min(selection.start.col, selection.end.col);
        const newData = [...finalData] as DataSource;
        let changed = false;

        let maxRowIdx = startRow;
        let maxColIdx = startCol;

        rows.forEach((rowStr, rIdx) => {
            const targetRowIdx = startRow + rIdx;
            if (targetRowIdx >= sortedData.length) return; // 卫语句：越界跳过

            maxRowIdx = Math.max(maxRowIdx, targetRowIdx);

            const cells = rowStr.split('\t');
            const record = sortedData[targetRowIdx];
            const originalIndex = finalData.indexOf(record);
            if (originalIndex === -1) return; // 卫语句：找不到原数据索引跳过

            const newRecord = { ...finalData[originalIndex] as object };

            cells.forEach((cellStr, cIdx) => {
                const targetColIdx = startCol + cIdx;
                if (targetColIdx >= columns.length) return; // 卫语句：越界跳过

                maxColIdx = Math.max(maxColIdx, targetColIdx);

                const column = columns[targetColIdx];
                if (column.editable === false) return; // 卫语句：不可编辑跳过

                (newRecord as Record<string, unknown>)[column.dataIndex as string] = cellStr;
                changed = true;
            });
            
            newData[originalIndex] = newRecord as DataSource[number];
        });

        if (changed) {
            onDataChange(newData);
        }

        setSelection({
            start: { row: startRow, col: startCol },
            end: { row: maxRowIdx, col: maxColIdx }
        });
        tableRef.current?.focus();
    };

    return (
        <div
            className={`${styles['ux-table-wrapper']} ${className || ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                width: 'auto',
                borderTop: '1px solid #e8e8e8',
                borderLeft: '1px solid #e8e8e8',
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
                className={styles['ux-table-main']}
            >
                <div style={{
                    height: `${rowVirtualizer.getTotalSize() + (1* CELL_HEIGHT)}px`,
                    width: `${colVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                }}>
                    {/* 渲染表头 */}
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 3,
                        display: 'flex',
                        height: '40px', // 固定表头高度
                    }} data-testid="ux-table-header-row">
                        {colVirtualizer.getVirtualItems().map((virtualCol) => {
                            const index = virtualCol.index;
                            const column = columns[index];
                            const key = column.key || String(column.dataIndex) || index;
                            const isFixed = column.fixed;
                            const offset = fixedOffsets[index];

                            return (
                                <div
                                    key={key}
                                    data-testid={`ux-table-header-cell-${index}`}
                                    onMouseDown={(e) => handleColHeaderMouseDown(e, index, sortedData.length)}
                                    onMouseEnter={() => handleColHeaderMouseEnter(index, sortedData.length)}
                                    style={{
                                        position: isFixed ? 'sticky' : 'absolute',
                                        left: isFixed === 'left' ? offset?.left : undefined,
                                        right: isFixed === 'right' ? offset?.right : undefined,
                                        transform: isFixed ? undefined : `translateX(${virtualCol.start}px)`,
                                        width: `${virtualCol.size}px`,
                                        height: '100%',
                                        zIndex: isFixed ? 4 : 3,
                                        backgroundColor: '#fafafa',
                                        borderBottom: '1px solid #e8e8e8',
                                        borderRight: '1px solid #e8e8e8',
                                        boxShadow: offset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : (offset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'),
                                        padding: '8px 16px',
                                        boxSizing: 'border-box',
                                        textAlign: 'left',
                                        userSelect: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {column.title as React.ReactNode}
                                    </span>
                                    {column.sorter && (
                                        <div 
                                            data-testid={`ux-table-sorter-${index}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSort(index);
                                            }}
                                            style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', marginLeft: '8px', cursor: 'pointer' }}
                                        >
                                            <span style={{ color: sortState?.colIndex === index && sortState.order === 'asc' ? '#1890ff' : '#bfbfbf', lineHeight: '10px' }}>▲</span>
                                            <span style={{ color: sortState?.colIndex === index && sortState.order === 'desc' ? '#1890ff' : '#bfbfbf', lineHeight: '10px' }}>▼</span>
                                        </div>
                                    )}
                                    {column.resizable !== false && (
                                        <div
                                            data-testid={`ux-table-resizer-${index}`}
                                            onMouseDown={(e) => handleResizeMouseDown(e, index)}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '5px',
                                                cursor: 'col-resize',
                                                zIndex: 1
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
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
                                data-testid={`ux-table-row-${rowIndex}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start + 40}px)`, // +40 为表头高度
                                    display: 'flex',
                                    zIndex: rowVirtualizer.getVirtualItems().some(vCol => {
                                        const rIdx = virtualRow.index;
                                        const cIdx = vCol.index;
                                        return isCellActive(rIdx, cIdx) || isCellSelected(rIdx, cIdx);
                                    }) ? 2 : 1 // 提升包含选中单元格的行的层级
                                }}
                            >
                                {colVirtualizer.getVirtualItems().map((virtualCol) => {
                                    const colIndex = virtualCol.index;
                                    const column = columns[colIndex];
                                    const colKey = column.key || String(column.dataIndex) || colIndex;
                                    const isFixed = column.fixed;
                                    const offset = fixedOffsets[colIndex];
                                    const isSelected = isCellSelected(rowIndex, colIndex);
                                    const isActive = isCellActive(rowIndex, colIndex);
                                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
                                    const value = (record as Record<string, unknown>)[column.dataIndex as string];

                                    const isCopied = copiedBounds && 
                                        rowIndex >= copiedBounds.top && rowIndex <= copiedBounds.bottom && 
                                        colIndex >= copiedBounds.left && colIndex <= copiedBounds.right;
                                    const isCopiedTop = isCopied && rowIndex === copiedBounds.top;
                                    const isCopiedBottom = isCopied && rowIndex === copiedBounds.bottom;
                                    const isCopiedLeft = isCopied && colIndex === copiedBounds.left;
                                    const isCopiedRight = isCopied && colIndex === copiedBounds.right;

                                    return (
                                        <div
                                            key={colKey}
                                            data-testid={`ux-table-cell-${rowIndex}-${colIndex}`}
                                            onMouseDown={(e) => {
                                                if (column.key === '_line_number_') {
                                                    handleCellMouseDown(e, rowIndex, colIndex, columns.length, true);
                                                } else {
                                                    handleCellMouseDown(e, rowIndex, colIndex, columns.length, false);
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (column.key === '_line_number_') {
                                                    handleCellMouseEnter(rowIndex, colIndex, columns.length, true);
                                                } else {
                                                    handleCellMouseEnter(rowIndex, colIndex, columns.length, false);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (column.editable !== false) {
                                                    startEditing(rowIndex, colIndex);
                                                }
                                            }}
                                            style={{
                                                position: isFixed ? 'sticky' : 'absolute',
                                                left: isFixed === 'left' ? offset?.left : undefined,
                                                right: isFixed === 'right' ? offset?.right : undefined,
                                                transform: isFixed ? undefined : `translateX(${virtualCol.start}px)`,
                                                width: `${virtualCol.size}px`,
                                                height: '100%',
                                                zIndex: isActive ? 4 : (isSelected ? 3 : (isFixed ? 2 : 1)),
                                                backgroundColor: isSelected ? (isActive ? '#ffffff' : '#e6f7ff') : '#ffffff',
                                                borderBottom: '1px solid #e8e8e8',
                                                borderRight: '1px solid #e8e8e8',
                                                boxShadow: [
                                                    (isSelected && selectionBounds?.top === rowIndex) ? 'inset 0 2px 0 0 #1890ff' : 'none',
                                                    (isSelected && selectionBounds?.bottom === rowIndex) ? 'inset 0 -2px 0 0 #1890ff' : 'none',
                                                    (isSelected && selectionBounds?.left === colIndex) ? 'inset 2px 0 0 0 #1890ff' : 'none',
                                                    (isSelected && selectionBounds?.right === colIndex) ? 'inset -2px 0 0 0 #1890ff' : 'none',
                                                    (isActive && (!selectionBounds || (selectionBounds.top === selectionBounds.bottom && selectionBounds.left === selectionBounds.right))) ? 'inset 0 0 0 2px #1890ff' : 'none',
                                                    offset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : 'none',
                                                    offset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'
                                                ].filter(s => s !== 'none').join(', ') || 'none',
                                                padding: isEditing || column.key === '_line_number_' ? 0 : '8px 16px',
                                                boxSizing: 'border-box',
                                                overflow: isEditing ? 'visible' : 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                cursor: 'cell',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {isCopiedTop && <div className={styles['marching-ants-top']} />}
                                            {isCopiedBottom && <div className={styles['marching-ants-bottom']} />}
                                            {isCopiedLeft && <div className={styles['marching-ants-left']} />}
                                            {isCopiedRight && <div className={styles['marching-ants-right']} />}
                                            
                                            {colIndex === 0 && (
                                                <div
                                                    onMouseDown={(e) => handleRowResizeMouseDown(e, rowIndex)}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '5px',
                                                        cursor: 'row-resize',
                                                        zIndex: 5
                                                    }}
                                                    data-testid={`ux-table-row-resizer-${rowIndex}`}
                                                />
                                            )}

                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => {
                                                        if (!isCancelingRef.current) {
                                                            saveEdit();
                                                        }
                                                        isCancelingRef.current = false;
                                                    }}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === 'Enter') {
                                                            saveEdit();
                                                        } else if (e.key === 'Escape') {
                                                            isCancelingRef.current = true;
                                                            setEditingCell(null);
                                                            tableRef.current?.focus();
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        boxSizing: 'border-box',
                                                        border: '2px solid #1890ff',
                                                        padding: '6px 14px',
                                                        outline: 'none',
                                                        fontFamily: 'inherit',
                                                        fontSize: 'inherit'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'flex', justifyContent: column.key === '_line_number_' ? 'center' : 'flex-start' }}>
                                                    {column.render ? column.render(value, record, rowIndex) : (value as React.ReactNode)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 底部标签页与滚动条区域 */}
            <div className={styles['ux-table-bottom-bar']}>
                {/* 左侧：标签页 (暂作示例) */}
                <div className={styles['ux-table-tabs']}>
                </div>

                {/* 右侧：同步横向滚动条 */}
                <div
                    ref={scrollbarRef}
                    className={styles['ux-table-scrollbar-x']}
                    onScroll={handleBottomScroll}
                >
                    <div style={{ width: `${colVirtualizer.getTotalSize()}px`, height: '1px' }} />
                </div>
            </div>
        </div>
    );
};
