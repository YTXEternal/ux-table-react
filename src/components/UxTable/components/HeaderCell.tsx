import React, { memo } from 'react';
import type { UxTableColumn } from '../types';

interface HeaderCellProps<DataSource extends unknown[]> {
    index: number;
    column: UxTableColumn<DataSource[number]>;
    virtualStart: number;
    virtualSize: number;
    isFixed: 'left' | 'right' | false | undefined;
    offset: { left?: number; right?: number; isLastLeft?: boolean; isFirstRight?: boolean } | undefined;
    sortOrder: 'asc' | 'desc' | undefined;
    isSorted: boolean;
    dataLength: number;
    handleColHeaderMouseDown: (e: React.MouseEvent, index: number, dataLength: number) => void;
    handleColHeaderMouseEnter: (index: number, dataLength: number) => void;
    handleSort: (index: number) => void;
    handleResizeMouseDown: (e: React.MouseEvent, index: number) => void;
}

const HeaderCellInner = <DataSource extends unknown[]>({
    index,
    column,
    virtualStart,
    virtualSize,
    isFixed,
    offset,
    sortOrder,
    isSorted,
    dataLength,
    handleColHeaderMouseDown,
    handleColHeaderMouseEnter,
    handleSort,
    handleResizeMouseDown
}: HeaderCellProps<DataSource>) => {
    const key = column.key || String(column.dataIndex) || index;

    return (
        <div
            key={key}
            data-testid={`ux-table-header-cell-${index}`}
            onMouseDown={(e) => handleColHeaderMouseDown(e, index, dataLength)}
            onMouseEnter={() => handleColHeaderMouseEnter(index, dataLength)}
            style={{
                position: isFixed ? 'sticky' : 'absolute',
                left: isFixed === 'left' ? offset?.left : undefined,
                right: isFixed === 'right' ? offset?.right : undefined,
                transform: isFixed ? undefined : `translateX(${virtualStart}px)`,
                width: `${virtualSize}px`,
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
                    <span style={{ color: isSorted && sortOrder === 'asc' ? '#1890ff' : '#bfbfbf', lineHeight: '10px' }}>▲</span>
                    <span style={{ color: isSorted && sortOrder === 'desc' ? '#1890ff' : '#bfbfbf', lineHeight: '10px' }}>▼</span>
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
};

export const HeaderCell = memo(HeaderCellInner, (prevProps, nextProps) => {
    return (
        prevProps.index === nextProps.index &&
        prevProps.virtualStart === nextProps.virtualStart &&
        prevProps.virtualSize === nextProps.virtualSize &&
        prevProps.isFixed === nextProps.isFixed &&
        prevProps.offset?.left === nextProps.offset?.left &&
        prevProps.offset?.right === nextProps.offset?.right &&
        prevProps.offset?.isLastLeft === nextProps.offset?.isLastLeft &&
        prevProps.offset?.isFirstRight === nextProps.offset?.isFirstRight &&
        prevProps.sortOrder === nextProps.sortOrder &&
        prevProps.isSorted === nextProps.isSorted &&
        prevProps.dataLength === nextProps.dataLength &&
        prevProps.column.title === nextProps.column.title &&
        prevProps.column.width === nextProps.column.width &&
        prevProps.column.resizable === nextProps.column.resizable &&
        prevProps.column.sorter === nextProps.column.sorter
    );
}) as typeof HeaderCellInner;
