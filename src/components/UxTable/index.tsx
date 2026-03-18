import React, { useRef } from 'react';
import type { UxTableProps, UxTableColumn } from './types';
import { useResizing } from './hooks/useResizing';
import { useSorting } from './hooks/useSorting';
import { useSelection } from './hooks/useSelection';
import { useEditing } from './hooks/useEditing';
import { useFixedColumns } from './hooks/useFixedColumns';
import { useVirtualizer } from '@tanstack/react-virtual';

export const UxTable = <DataSource extends unknown[]>(props: UxTableProps<DataSource>) => {
    const { columns: propColumns, data: propData, rowKey, className, style, onDataChange, gridConfig } = props;
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

    // Virtualization
    const parentRef = useRef<HTMLDivElement>(null);

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
            return typeof width === 'number' ? width : parseInt(width as string, 10) || 100;
        },
        overscan: 2,
    });

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
            ref={(node) => {
                tableRef.current = node;
                // @ts-expect-error Assigning to read-only ref for virtualizer
                parentRef.current = node;
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{ 
                overflow: 'auto', 
                position: 'relative', 
                borderTop: '1px solid #e8e8e8', 
                borderLeft: '1px solid #e8e8e8',
                outline: 'none',
                height: '100%',
                width: '100%',
                ...style
            }}
            className={className}
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
                }}>
                    {colVirtualizer.getVirtualItems().map((virtualCol) => {
                        const index = virtualCol.index;
                        const column = columns[index];
                        const key = column.key || String(column.dataIndex) || index;
                        const isFixed = column.fixed;
                        const offset = fixedOffsets[index];

                        return (
                            <div
                                key={key}
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
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start + 40}px)`, // +40 为表头高度
                                display: 'flex',
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
                                            zIndex: isFixed ? 2 : 1,
                                            backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : '#ffffff',
                                            borderBottom: '1px solid #e8e8e8',
                                            borderRight: '1px solid #e8e8e8',
                                            boxShadow: offset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : (offset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'),
                                            padding: isEditing ? 0 : '8px 16px',
                                            boxSizing: 'border-box',
                                            overflow: isEditing ? 'visible' : 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            cursor: 'cell',
                                            outline: isActive ? '2px solid #1890ff' : 'none',
                                            outlineOffset: '-2px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation();
                                                    if (e.key === 'Enter') {
                                                        saveEdit();
                                                    } else if (e.key === 'Escape') {
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
    );
};
