import React, { memo } from 'react';
import { CellEditor } from '../CellEditor';
import type { BodyCellProps } from './types';

/**
 * 虚拟滚动数据体单元格内部组件
 * 负责渲染单个数据单元格，处理其定位、样式、编辑模式以及选区（如蚂蚁线）和拖拽交互
 * @template RecordType 记录数据的类型
 * @param {BodyCellProps<RecordType>} props 单元格的属性
 * @returns {React.ReactElement} 渲染的单元格 div 元素
 */
const BodyCellInner = <RecordType,>({
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
}: BodyCellProps<RecordType>) => {
    // 确定列的唯一键值
    const colKey = column.key || String(column.dataIndex) || colIndex;

    /**
     * 计算单元格的 className 组合
     */
    const classNames = [
        'ux-table-cell-base',
        'ux-table-body-cell',
        isFixed ? 'sticky' : 'absolute',
        isActive ? 'ux-table-cell-active' : (isSelected ? 'ux-table-cell-selected' : ''),
        offset?.isLastLeft ? 'ux-table-shadow-left' : '',
        offset?.isFirstRight ? 'ux-table-shadow-right' : '',
        isSelected || isActive ? 'ux-table-selection-border' : '',
        isCut ? 'ux-table-cell-cut' : ''
    ].filter(Boolean).join(' ');

    /**
     * 计算选区边框内阴影变量
     */
    const borderVars = {} as React.CSSProperties & Record<string, string>;
    if (isSelected || isActive) {
        if (isSelected && selectionBounds?.top === rowIndex && !isAntsTop) borderVars['--sel-top'] = '2px';
        if (isSelected && selectionBounds?.bottom === rowIndex && !isAntsBottom) borderVars['--sel-bottom'] = '-2px';
        if (isSelected && selectionBounds?.left === colIndex && !isAntsLeft) borderVars['--sel-left'] = '2px';
        if (isSelected && selectionBounds?.right === colIndex && !isAntsRight) borderVars['--sel-right'] = '-2px';
        if (isActive && (!selectionBounds || (selectionBounds.top === selectionBounds.bottom && selectionBounds.left === selectionBounds.right))) {
            if (!isAntsTop) borderVars['--sel-top'] = '2px';
            if (!isAntsBottom) borderVars['--sel-bottom'] = '-2px';
            if (!isAntsLeft) borderVars['--sel-left'] = '2px';
            if (!isAntsRight) borderVars['--sel-right'] = '-2px';
        }
    }

    return (
        <div
            key={colKey}
            data-testid={`ux-table-cell-${rowIndex}-${colIndex}`}
            className={classNames}
            onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex, columnsLength, isLineNumberCol)}
            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex, columnsLength, isLineNumberCol || isRowSelectionMode)}
            onDoubleClick={() => {
                if (column.editable !== false) {
                    startEditing(rowIndex, colIndex);
                }
            }}
            style={{
                left: isFixed === 'left' ? offset?.left : undefined,
                right: isFixed === 'right' ? offset?.right : undefined,
                transform: isFixed ? undefined : `translateX(${virtualStart}px)`,
                width: `${virtualSize}px`,
                height: '100%',
                zIndex: isFixed ? (isActive ? 6 : (isSelected ? 5 : 4)) : (isActive ? 3 : (isSelected ? 2 : 1)),
                padding: isEditing || isLineNumberCol ? 0 : '8px 16px',
                overflow: isEditing ? 'visible' : 'hidden',
                ...borderVars
            }}
        >
            {/* 渲染复制/剪切操作时的蚂蚁线效果 */}
            {isAntsTop && <div className="marching-ants-top" />}
            {isAntsBottom && <div className="marching-ants-bottom" />}
            {isAntsLeft && <div className="marching-ants-left" />}
            {isAntsRight && <div className="marching-ants-right" />}

            {/* 渲染行高调整手柄（仅在第一列显示） */}
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

            {/* 根据是否编辑状态渲染编辑器或内容展示 */}
            {isEditing ? (
                <CellEditor
                    initialValue={initialEditValue}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                />
            ) : (
                <div className={`ux-table-body-cell-inner ${isLineNumberCol ? 'ux-table-body-cell-line-number' : 'ux-table-body-cell-content'}`}>
                    {column.render ? column.render(value, record, rowIndex) : (value as React.ReactNode)}
                </div>
            )}
        </div>
    );
};

/**
 * 带有性能优化 (React.memo) 的数据体单元格组件
 * 通过自定义对比函数，仅在关键属性发生变化时重新渲染
 */
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
