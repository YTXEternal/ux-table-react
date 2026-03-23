import React, { memo } from 'react';
import type { HeaderCellProps } from './types';

/**
 * 虚拟滚动表头单元格内部组件
 * 负责渲染单个表头单元格，处理其定位、排序指示、列宽拖拽以及选列交互
 * @template RecordType 记录数据的类型
 * @param {HeaderCellProps<RecordType>} props 单元格的属性
 * @returns {React.ReactElement} 渲染的表头单元格 div 元素
 */
const HeaderCellInner = <RecordType,>({
    index,
    column,
    virtualStart,
    virtualSize,
    isFixed,
    offset,
    sortOrder,
    isSorted,
    dataLength,
    isSelected,
    isSelectionLeft,
    isSelectionRight,
    isAntsTop,
    isAntsBottom,
    isAntsLeft,
    isAntsRight,
    handleColHeaderMouseDown,
    handleColHeaderMouseEnter,
    handleSort,
    handleResizeMouseDown
}: HeaderCellProps<RecordType>) => {
    // 确定列的唯一键值
    const key = column.key || String(column.dataIndex) || index;

    /**
     * 计算表头单元格的 className 组合
     */
    const classNames = [
        'ux-table-cell-base',
        'ux-table-header-cell',
        isFixed ? 'sticky' : 'absolute',
        offset?.isLastLeft ? 'ux-table-shadow-left' : '',
        offset?.isFirstRight ? 'ux-table-shadow-right' : '',
        isSelected ? 'ux-table-cell-selected' : '',
        isSelected ? 'ux-table-selection-border' : ''
    ].filter(Boolean).join(' ');

    const borderVars = {} as React.CSSProperties & Record<string, string>;
    if (isSelected) {
        if (!isAntsTop) borderVars['--sel-top'] = '2px';
        if (isSelectionLeft) borderVars['--sel-left'] = '2px';
        if (isSelectionRight) borderVars['--sel-right'] = '-2px';
    }

    return (
        <div
            key={key}
            data-testid={`ux-table-header-cell-${index}`}
            className={classNames}
            onMouseDown={(e) => handleColHeaderMouseDown(e, index, dataLength)}
            onMouseEnter={() => handleColHeaderMouseEnter(index, dataLength)}
            style={{
                left: isFixed === 'left' ? offset?.left : undefined,
                right: isFixed === 'right' ? offset?.right : undefined,
                transform: isFixed ? undefined : `translateX(${virtualStart}px)`,
                width: `${virtualSize}px`,
                height: '100%',
                zIndex: isFixed ? 4 : 3,
                ...borderVars
            }}
        >
            {/* 渲染复制/剪切操作时的蚂蚁线效果 */}
            {isAntsTop && <div className="marching-ants-top" />}
            {isAntsBottom && <div className="marching-ants-bottom" />}
            {isAntsLeft && <div className="marching-ants-left" />}
            {isAntsRight && <div className="marching-ants-right" />}

            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {column.title as React.ReactNode}
            </span>
            {/* 渲染排序指示器（仅在列配置了 sorter 时显示） */}
            {column.sorter && (
                <div
                    data-testid={`ux-table-sorter-${index}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSort(index);
                    }}
                    style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', marginLeft: '8px', cursor: 'pointer' }}
                >
                    <span style={{ color: isSorted && sortOrder === 'asc' ? 'var(--ux-primary-color, #1890ff)' : '#bfbfbf', lineHeight: '10px' }}>▲</span>
                    <span style={{ color: isSorted && sortOrder === 'desc' ? 'var(--ux-primary-color, #1890ff)' : '#bfbfbf', lineHeight: '10px' }}>▼</span>
                </div>
            )}
            {/* 渲染列宽拖拽调整手柄（如果列配置未禁用 resizable） */}
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

/**
 * 带有性能优化 (React.memo) 的表头单元格组件
 * 通过自定义对比函数，仅在关键属性发生变化时重新渲染
 */
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
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isSelectionLeft === nextProps.isSelectionLeft &&
        prevProps.isSelectionRight === nextProps.isSelectionRight &&
        prevProps.isAntsTop === nextProps.isAntsTop &&
        prevProps.isAntsBottom === nextProps.isAntsBottom &&
        prevProps.isAntsLeft === nextProps.isAntsLeft &&
        prevProps.isAntsRight === nextProps.isAntsRight &&
        prevProps.dataLength === nextProps.dataLength &&
        prevProps.column.title === nextProps.column.title &&
        prevProps.column.width === nextProps.column.width &&
        prevProps.column.resizable === nextProps.column.resizable &&
        prevProps.column.sorter === nextProps.column.sorter
    );
}) as typeof HeaderCellInner;
