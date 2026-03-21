import React from 'react';
import { Cell } from '../Cell';
import type { BodyProps } from './types';

/**
 * 表格数据体组件
 * 负责渲染表格的数据行及单元格，处理单元格的选中、活动和编辑状态
 * @template RecordType 记录数据的类型
 * @param {BodyProps<RecordType>} props 表格数据体的属性
 * @returns {React.ReactElement} 渲染的数据体 tbody 元素
 */
export const Body = <RecordType,>({
    data,
    columns,
    rowKey,
    fixedOffsets,
    isCellSelected,
    isCellActive,
    editingCell,
    editValue,
    tableRef,
    onCellMouseDown,
    onCellMouseEnter,
    onCellDoubleClick,
    onEditChange,
    onEditSave,
    onEditCancel
}: BodyProps<RecordType>) => {
    return (
        <tbody>
            {data.map((record, rowIndex) => {
                // 确定行的唯一键值
                let key: React.Key = rowIndex;
                if (typeof rowKey === 'function') {
                    key = rowKey(record);
                } else if (typeof rowKey === 'string') {
                    key = (record as Record<string, unknown>)[rowKey] as React.Key;
                }

                return (
                    <tr key={key}>
                        {columns.map((column, colIndex) => {
                            // 确定列的唯一键值
                            const colKey = column.key || String(column.dataIndex) || colIndex;
                            // 判断当前单元格是否处于编辑状态
                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;

                            return (
                                <Cell
                                    key={colKey}
                                    record={record}
                                    column={column}
                                    rowIndex={rowIndex}
                                    colIndex={colIndex}
                                    fixedOffset={fixedOffsets[colIndex]}
                                    isSelected={isCellSelected(rowIndex, colIndex)}
                                    isActive={isCellActive(rowIndex, colIndex)}
                                    isEditing={isEditing}
                                    editValue={editValue}
                                    tableRef={tableRef}
                                    onMouseDown={(e) => onCellMouseDown(e, rowIndex, colIndex)}
                                    onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
                                    onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
                                    onEditChange={onEditChange}
                                    onEditSave={onEditSave}
                                    onEditCancel={onEditCancel}
                                />
                            );
                        })}
                    </tr>
                );
            })}
        </tbody>
    );
};
