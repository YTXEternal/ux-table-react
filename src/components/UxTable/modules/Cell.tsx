import React from 'react';
import type { UxTableColumn } from '../types';

interface CellProps<DataSource extends unknown[]> {
    record: DataSource[number];
    column: UxTableColumn<DataSource[number]>;
    rowIndex: number;
    colIndex: number;
    fixedOffset?: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean };
    isSelected: boolean;
    isActive: boolean;
    isEditing: boolean;
    editValue: string;
    tableRef: React.RefObject<HTMLDivElement | null>;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onDoubleClick: () => void;
    onEditChange: (value: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
}

export const Cell = <DataSource extends unknown[]>({
    record,
    column,
    rowIndex,
    fixedOffset,
    isSelected,
    isActive,
    isEditing,
    editValue,
    onMouseDown,
    onMouseEnter,
    onDoubleClick,
    onEditChange,
    onEditSave,
    onEditCancel
}: CellProps<DataSource>) => {
    const value = (record as Record<string, unknown>)[column.dataIndex as string];
    const isFixed = column.fixed;

    const isCancelingRef = React.useRef(false);

    return (
        <td 
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onDoubleClick={onDoubleClick}
            style={{
                position: isFixed ? 'sticky' : 'relative',
                left: isFixed === 'left' ? fixedOffset?.left : undefined,
                right: isFixed === 'right' ? fixedOffset?.right : undefined,
                zIndex: isFixed ? 1 : undefined,
                backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : '#ffffff',
                borderBottom: '1px solid #e8e8e8',
                borderRight: '1px solid #e8e8e8',
                boxShadow: fixedOffset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : (fixedOffset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'),
                padding: isEditing ? 0 : '8px 16px',
                overflow: 'visible',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'cell',
                outline: isActive ? '2px solid #1890ff' : 'none',
                outlineOffset: '-2px'
            }}
        >
            {isEditing ? (
                <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onBlur={() => {
                        if (isCancelingRef.current) {
                            isCancelingRef.current = false;
                            return;
                        }
                        onEditSave();
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation(); 
                        if (e.key === 'Enter') {
                            onEditSave();
                        } else if (e.key === 'Escape') {
                            isCancelingRef.current = true;
                            onEditCancel();
                            // tableRef focus is handled by onEditCancel callback in parent or here?
                            // In UxTable.tsx, onEditCancel does focus.
                            // But let's keep it consistent.
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
                column.render
                    ? column.render(value, record, rowIndex)
                    : (value as React.ReactNode)
            )}
        </td>
    );
};
