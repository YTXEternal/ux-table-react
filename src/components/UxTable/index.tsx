import React, { useRef } from 'react';
import type { UxTableProps, UxTableColumn } from './types';
import { useResizing } from './hooks/useResizing';
import { useSorting } from './hooks/useSorting';
import { useSelection } from './hooks/useSelection';
import { useEditing } from './hooks/useEditing';
import { useFixedColumns } from './hooks/useFixedColumns';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './styles.module.css';

export const UxTable = <DataSource extends unknown[]>(props: UxTableProps<DataSource>) => {
    const { columns: propColumns, data: propData, rowKey, className, onDataChange, gridConfig } = props;
    const tableRef = useRef<HTMLDivElement>(null);

    // 补齐 data 和 columns
    const { finalColumns, finalData } = React.useMemo(() => {
        const columns = [...propColumns];
        const data = [...propData] as DataSource;

        if (gridConfig) {
            const { rows, cols } = gridConfig;
            
            // 补齐列
            if (columns.length < cols) {
                for (let i = columns.length; i < cols; i++) {
                    // 生成类似 Excel 的列名 A, B, C... Z, AA...
                    let temp = i;
                    let colName = '';
                    while (temp >= 0) {
                        colName = String.fromCharCode((temp % 26) + 65) + colName;
                        temp = Math.floor(temp / 26) - 1;
                    }

                    columns.push({
                        title: colName,
                        dataIndex: `_grid_col_${i}` as keyof DataSource[number],
                        key: `_grid_col_${i}`,
                        width: 100,
                        editable: true,
                    } as unknown as UxTableColumn<DataSource[number]>);
                }
            }

            // 补齐行
            if (data.length < rows) {
                for (let i = data.length; i < rows; i++) {
                    const newRow: Record<string, unknown> = {};
                    if (typeof rowKey === 'string') {
                        newRow[rowKey] = `_grid_row_${i}`;
                    }
                    data.push(newRow as DataSource[number]);
                }
            }
        }

        return { finalColumns: columns, finalData: data };
    }, [propColumns, propData, gridConfig, rowKey]);

    // Hooks
    const { columns, handleResizeMouseDown } = useResizing(finalColumns);
    const { sortState, handleSort, sortedData } = useSorting(finalData, columns);
    const { 
        selection, 
        setSelection, 
        handleCellMouseDown, 
        handleCellMouseEnter, 
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
        estimateSize: () => 40, // 默认行高
        overscan: 5,
    });

    const colVirtualizer = useVirtualizer({
        horizontal: true,
        count: columns.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const width = columns[index].width;
            return typeof width === 'number' ? width : parseInt(width as unknown as string, 10) || 100;
        },
        overscan: 2,
    });

    // Notify virtualizer when column widths change
    React.useEffect(() => {
        colVirtualizer.measure();
    }, [columns, colVirtualizer]);

    // 滚动同步 (按比例同步，因为底部滚动条和主表格的可视宽度不同)
    const handleMainScroll = () => {
        if (scrollbarRef.current && parentRef.current) {
            const main = parentRef.current;
            const scroll = scrollbarRef.current;
            
            const mainMax = main.scrollWidth - main.clientWidth;
            const scrollMax = scroll.scrollWidth - scroll.clientWidth;
            
            if (mainMax <= 0 || scrollMax <= 0) return;
            
            const percentage = main.scrollLeft / mainMax;
            const targetScrollLeft = percentage * scrollMax;
            
            if (Math.abs(scroll.scrollLeft - targetScrollLeft) > 1) {
                scroll.scrollLeft = targetScrollLeft;
            }
        }
    };

    const handleBottomScroll = () => {
        if (scrollbarRef.current && parentRef.current) {
            const main = parentRef.current;
            const scroll = scrollbarRef.current;
            
            const mainMax = main.scrollWidth - main.clientWidth;
            const scrollMax = scroll.scrollWidth - scroll.clientWidth;
            
            if (mainMax <= 0 || scrollMax <= 0) return;

            const percentage = scroll.scrollLeft / scrollMax;
            const targetScrollLeft = percentage * mainMax;

            if (Math.abs(main.scrollLeft - targetScrollLeft) > 1) {
                main.scrollLeft = targetScrollLeft;
            }
        }
    };

    // 支持触控板横向滚动
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaX !== 0 && parentRef.current) {
            parentRef.current.scrollLeft += e.deltaX;
        }
    };

    // Keyboard & Paste Handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (editingCell) return; // Handled in Cell input

        if (!selection) return;

        const { start } = selection;
        const currentRow = start.row;
        const currentCol = start.col;
        const rowCount = sortedData.length;
        const colCount = columns.length;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newRow = Math.max(0, currentRow - 1);
            setSelection({ start: { row: newRow, col: currentCol }, end: { row: newRow, col: currentCol } });
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newRow = Math.min(rowCount - 1, currentRow + 1);
            setSelection({ start: { row: newRow, col: currentCol }, end: { row: newRow, col: currentCol } });
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newCol = Math.max(0, currentCol - 1);
            setSelection({ start: { row: currentRow, col: newCol }, end: { row: currentRow, col: newCol } });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newCol = Math.min(colCount - 1, currentCol + 1);
            setSelection({ start: { row: currentRow, col: newCol }, end: { row: currentRow, col: newCol } });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            startEditing(currentRow, currentCol);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Direct input
            startEditing(currentRow, currentCol, e.key);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            handleCopy();
        }
    };

    const handleCopy = () => {
        if (!selection) return;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);

        const rows = [];
        for (let i = r1; i <= r2; i++) {
            const rowData = [];
            const record = sortedData[i] as Record<string, unknown>;
            for (let j = c1; j <= c2; j++) {
                const val = record[columns[j].dataIndex as string];
                rowData.push(val ?? '');
            }
            rows.push(rowData.join('\t'));
        }
        navigator.clipboard.writeText(rows.join('\n'));
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (!selection || !onDataChange) return;
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const rows = text.split(/\r\n|\n|\r/).filter(row => row.length > 0);
        
        const startRow = Math.min(selection.start.row, selection.end.row);
        const startCol = Math.min(selection.start.col, selection.end.col);

        const newData = [...finalData] as DataSource;
        let changed = false;

        rows.forEach((rowStr, rIdx) => {
            const targetRowIdx = startRow + rIdx;
            if (targetRowIdx >= sortedData.length) return;
            
            const cells = rowStr.split('\t');
            const record = sortedData[targetRowIdx];
            const originalIndex = finalData.indexOf(record);
            if (originalIndex === -1) return;

            const newRecord = { ...finalData[originalIndex] as object };
            
            cells.forEach((cellStr, cIdx) => {
                const targetColIdx = startCol + cIdx;
                if (targetColIdx >= columns.length) return;
                
                const column = columns[targetColIdx];
                if (column.editable !== false) {
                    (newRecord as Record<string, unknown>)[column.dataIndex as string] = cellStr;
                    changed = true;
                }
            });
            newData[originalIndex] = newRecord as DataSource[number];
        });

        if (changed) {
            onDataChange(newData);
        }
    };

    return (
        <div 
            className={`${styles['ux-table-wrapper']} ${className || ''}`}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                width: '100%', 
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
                    flex: 1,
                    position: 'relative', 
                    outline: 'none',
                    userSelect: 'none', // 防止拖拽时选中文本
                }}
                className={styles['ux-table-main']}
            >
                <div style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
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
                                onClick={() => handleSort(index)}
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
                                    cursor: column.sorter ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {column.title as React.ReactNode}
                                </span>
                                {column.sorter && (
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', marginLeft: '8px' }}>
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

                                return (
                                    <div
                                        key={colKey}
                                        data-testid={`ux-table-cell-${rowIndex}-${colIndex}`}
                                        onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                                        onDoubleClick={() => startEditing(rowIndex, colIndex)}
                                        style={{
                                            position: isFixed ? 'sticky' : 'absolute',
                                            left: isFixed === 'left' ? offset?.left : undefined,
                                            right: isFixed === 'right' ? offset?.right : undefined,
                                            transform: isFixed ? undefined : `translateX(${virtualCol.start}px)`,
                                            width: `${virtualCol.size}px`,
                                            height: '100%',
                                            zIndex: isActive ? 4 : (isSelected ? 3 : (isFixed ? 2 : 1)),
                                            backgroundColor: isSelected ? (isActive ? '#ffffff' : 'rgba(24, 144, 255, 0.1)') : '#ffffff',
                                            // 统一使用 border 绘制基础网格
                                            borderBottom: '1px solid #e8e8e8',
                                            borderRight: '1px solid #e8e8e8',
                                            // 使用 box-shadow 模拟边框
                                            // 注意：为了实现类似 Excel 的外围边框，我们需要在四周分别绘制内阴影
                                            // 这里通过调整 inset 大小确保边缘可见
                                            boxShadow: [
                                                // 选中区域边界高亮 (仅当 isSelected 时才渲染外边框，取消 !isActive 限制，让包含 active 的边缘也能渲染选中边框)
                                                (isSelected && selectionBounds?.top === rowIndex) ? 'inset 0 2px 0 0 #1890ff' : 'none',
                                                (isSelected && selectionBounds?.bottom === rowIndex) ? 'inset 0 -2px 0 0 #1890ff' : 'none',
                                                (isSelected && selectionBounds?.left === colIndex) ? 'inset 2px 0 0 0 #1890ff' : 'none',
                                                (isSelected && selectionBounds?.right === colIndex) ? 'inset -2px 0 0 0 #1890ff' : 'none',
                                                // active 单元格的内边框 (如果它也在边缘，会被上面的 2px 覆盖或叠加，这里保持为 1px 以示区别，或者不加)
                                                // 实际上 Excel 中 active 单元格没有单独的蓝框，除非它不是多选区。
                                                // 但为了明确当前光标，我们给它一个稍弱的内阴影，或者依赖 backgroundColor: #fff 来区分
                                                // 修正：如果只是单个单元格选中，它应该有 2px 边框；如果是多选区，active 单元格不需要四周的边框，只需要背景色为白即可
                                                (isActive && (!selectionBounds || (selectionBounds.top === selectionBounds.bottom && selectionBounds.left === selectionBounds.right))) ? 'inset 0 0 0 2px #1890ff' : 'none',
                                                // 固定列阴影
                                                offset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : 'none',
                                                offset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'
                                            ].filter(s => s !== 'none').join(', ') || 'none',
                                            padding: isEditing ? 0 : '8px 16px',
                                            boxSizing: 'border-box',
                                            overflow: isEditing ? 'visible' : 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            cursor: 'cell',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
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
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                {column.render ? column.render(value, record, rowIndex) : (value as React.ReactNode)}
                                            </span>
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
                <div className={`${styles['ux-table-tab']} ${styles['active']}`}>Sheet1</div>
                <div className={styles['ux-table-tab']}>+</div>
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
