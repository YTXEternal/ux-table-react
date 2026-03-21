import React, { memo } from 'react';
import type { UxTableColumn } from '../types';
import { CellEditor } from './CellEditor';
import styles from '../styles.module.css';

interface BodyCellProps<DataSource extends unknown[]> {
    rowIndex: number;
    colIndex: number;
    virtualStart: number;
    virtualSize: number;
    record: DataSource[number];
    value: unknown;
    column: UxTableColumn<DataSource[number]>;
    isFixed: 'left' | 'right' | false | undefined;
    offset: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean } | undefined;
    isSelected: boolean;
    isActive: boolean;
    isEditing: boolean;
    isLineNumberCol: boolean;
    columnsLength: number;
    selectionBounds: { top: number; bottom: number; left: number; right: number } | null;
    isRowSelectionMode: boolean;
    
    // Ant properties
    isAntsTop: boolean;
    isAntsBottom: boolean;
    isAntsLeft: boolean;
    isAntsRight: boolean;
    isCut: boolean;

    // Handlers
    handleCellMouseDown: (e: React.MouseEvent, rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean) => void;
    handleCellMouseEnter: (rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean) => void;
    handleRowResizeMouseDown: (e: React.MouseEvent, rowIndex: number) => void;
    startEditing: (rowIndex: number, colIndex: number) => void;
    saveEdit: (value: string) => void;
    cancelEdit: () => void;
    initialEditValue: string;
}

const BodyCellInner = <DataSource extends unknown[]>({
    rowIndex,
    colIndex,
    virtualStart,
    virtualSize,
    record,
    value,
    column,
    isFixed,
    offset,
    isSelected,
    isActive,
    isEditing,
    isLineNumberCol,
    columnsLength,
    selectionBounds,
    isRowSelectionMode,
    isAntsTop,
    isAntsBottom,
    isAntsLeft,
    isAntsRight,
    isCut,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleRowResizeMouseDown,
    startEditing,
    saveEdit,
    cancelEdit,
    initialEditValue
}: BodyCellProps<DataSource>) => {
    const colKey = column.key || String(column.dataIndex) || colIndex;

    const buildBoxShadow = () => {
        let shadow = '';
        if (isSelected && selectionBounds?.top === rowIndex) shadow += 'inset 0 2px 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.bottom === rowIndex) shadow += 'inset 0 -2px 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.left === colIndex) shadow += 'inset 2px 0 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.right === colIndex) shadow += 'inset -2px 0 0 0 #1890ff, ';
        if (isActive && (!selectionBounds || (selectionBounds.top === selectionBounds.bottom && selectionBounds.left === selectionBounds.right))) shadow += 'inset 0 0 0 2px #1890ff, ';
        if (offset?.isLastLeft) shadow += '6px 0 6px -4px rgba(0,0,0,0.1), ';
        if (offset?.isFirstRight) shadow += '-6px 0 6px -4px rgba(0,0,0,0.1), ';
        
        return shadow ? shadow.slice(0, -2) : 'none';
    };

    return (
        <div
            key={colKey}
            data-testid={`ux-table-cell-${rowIndex}-${colIndex}`}
            onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex, columnsLength, isLineNumberCol)}
            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex, columnsLength, isLineNumberCol || isRowSelectionMode)}
            onDoubleClick={() => {
                if (column.editable !== false) {
                    startEditing(rowIndex, colIndex);
                }
            }}
            style={{
                position: isFixed ? 'sticky' : 'absolute',
                left: isFixed === 'left' ? offset?.left : undefined,
                right: isFixed === 'right' ? offset?.right : undefined,
                transform: isFixed ? undefined : `translateX(${virtualStart}px)`,
                width: `${virtualSize}px`,
                height: '100%',
                zIndex: isFixed ? (isActive ? 6 : (isSelected ? 5 : 4)) : (isActive ? 3 : (isSelected ? 2 : 1)),
                backgroundColor: isSelected ? (isActive ? '#ffffff' : '#e6f7ff') : '#ffffff',
                borderBottom: '1px solid #e8e8e8',
                borderRight: '1px solid #e8e8e8',
                boxShadow: buildBoxShadow(),
                padding: isEditing || isLineNumberCol ? 0 : '8px 16px',
                boxSizing: 'border-box',
                overflow: isEditing ? 'visible' : 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'cell',
                display: 'flex',
                alignItems: 'center',
                opacity: isCut ? 0.5 : 1
            }}
        >
            {isAntsTop && <div className={styles['marching-ants-top']} />}
            {isAntsBottom && <div className={styles['marching-ants-bottom']} />}
            {isAntsLeft && <div className={styles['marching-ants-left']} />}
            {isAntsRight && <div className={styles['marching-ants-right']} />}

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
                <CellEditor
                    initialValue={initialEditValue}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                />
            ) : (
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'flex', justifyContent: isLineNumberCol ? 'center' : 'flex-start' }}>
                    {column.render ? column.render(value, record, rowIndex) : (value as React.ReactNode)}
                </div>
            )}
        </div>
    );
};

export const BodyCell = memo(BodyCellInner, (prevProps, nextProps) => {
    return (
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.colIndex === nextProps.colIndex &&
        prevProps.virtualStart === nextProps.virtualStart &&
        prevProps.virtualSize === nextProps.virtualSize &&
        prevProps.value === nextProps.value &&
        prevProps.isFixed === nextProps.isFixed &&
        prevProps.offset?.left === nextProps.offset?.left &&
        prevProps.offset?.right === nextProps.offset?.right &&
        prevProps.offset?.isLastLeft === nextProps.offset?.isLastLeft &&
        prevProps.offset?.isFirstRight === nextProps.offset?.isFirstRight &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.isLineNumberCol === nextProps.isLineNumberCol &&
        prevProps.columnsLength === nextProps.columnsLength &&
        prevProps.selectionBounds?.top === nextProps.selectionBounds?.top &&
        prevProps.selectionBounds?.bottom === nextProps.selectionBounds?.bottom &&
        prevProps.selectionBounds?.left === nextProps.selectionBounds?.left &&
        prevProps.selectionBounds?.right === nextProps.selectionBounds?.right &&
        prevProps.isRowSelectionMode === nextProps.isRowSelectionMode &&
        prevProps.isAntsTop === nextProps.isAntsTop &&
        prevProps.isAntsBottom === nextProps.isAntsBottom &&
        prevProps.isAntsLeft === nextProps.isAntsLeft &&
        prevProps.isAntsRight === nextProps.isAntsRight &&
        prevProps.isCut === nextProps.isCut &&
        prevProps.initialEditValue === nextProps.initialEditValue
    );
}) as typeof BodyCellInner;
