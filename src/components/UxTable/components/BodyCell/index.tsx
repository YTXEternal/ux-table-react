import React, { memo } from 'react';
import { CellEditor } from '../CellEditor';
import styles from '../../styles.module.css';
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
     * 构建单元格的 box-shadow 样式
     * 用于显示选区的高亮边框（内阴影）以及固定列的边缘阴影
     * @returns {string} 构建好的 box-shadow 字符串
     */
    const buildBoxShadow = () => {
        let shadow = '';
        // 如果处于选区边缘，则添加对应的蓝色内阴影边框
        if (isSelected && selectionBounds?.top === rowIndex) shadow += 'inset 0 2px 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.bottom === rowIndex) shadow += 'inset 0 -2px 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.left === colIndex) shadow += 'inset 2px 0 0 0 #1890ff, ';
        if (isSelected && selectionBounds?.right === colIndex) shadow += 'inset -2px 0 0 0 #1890ff, ';
        // 如果是活动单元格且不是单格选区，则添加全包围蓝色内阴影
        if (isActive && (!selectionBounds || (selectionBounds.top === selectionBounds.bottom && selectionBounds.left === selectionBounds.right))) shadow += 'inset 0 0 0 2px #1890ff, ';
        // 处理固定列的边缘阴影
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
            {/* 渲染复制/剪切操作时的蚂蚁线效果 */}
            {isAntsTop && <div className={styles['marching-ants-top']} />}
            {isAntsBottom && <div className={styles['marching-ants-bottom']} />}
            {isAntsLeft && <div className={styles['marching-ants-left']} />}
            {isAntsRight && <div className={styles['marching-ants-right']} />}

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
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'flex', justifyContent: isLineNumberCol ? 'center' : 'flex-start' }}>
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
