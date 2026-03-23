import React from 'react';
import type { HeaderProps } from './types';

/**
 * 表头组件
 * 负责渲染表格的列标题、排序指示器以及列宽调整手柄
 * @template RecordType 记录数据的类型
 * @param {HeaderProps<RecordType>} props 表头组件的属性
 * @returns {React.ReactElement} 渲染的表头 thead 元素
 */
export const Header = <RecordType,>({
    columns,
    sortState,
    fixedOffsets,
    onSort,
    onResizeMouseDown
}: HeaderProps<RecordType>) => {
    return (
        <thead>
            <tr>
                {columns.map((column, index) => {
                    const key = column.key || String(column.dataIndex) || index;
                    const isFixed = column.fixed;
                    const offset = fixedOffsets[index];

                    return (
                        <th
                            key={key}
                            onClick={() => onSort(index)}
                            style={{
                                width: column.width,
                                position: isFixed ? 'sticky' : 'relative',
                                left: isFixed === 'left' ? offset?.left : undefined,
                                right: isFixed === 'right' ? offset?.right : undefined,
                                zIndex: isFixed ? 2 : 1,
                                backgroundColor: '#fafafa',
                                borderBottom: '0.5px solid #e5e7eb',
                                borderRight: '0.5px solid #e5e7eb',
                                boxShadow: offset?.isLastLeft ? '6px 0 6px -4px rgba(0,0,0,0.1)' : (offset?.isFirstRight ? '-6px 0 6px -4px rgba(0,0,0,0.1)' : 'none'),
                                padding: '8px 16px',
                                textAlign: 'left',
                                cursor: column.sorter ? 'pointer' : 'default',
                                userSelect: 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{column.title as React.ReactNode}</span>
                                {/* 排序指示器，显示上下箭头 */}
                                {column.sorter && (
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', marginLeft: '8px' }}>
                                        <span style={{ color: sortState?.colIndex === index && sortState.order === 'asc' ? 'var(--ux-primary-color, #1890ff)' : '#bfbfbf', lineHeight: '10px' }}>▲</span>
                                        <span style={{ color: sortState?.colIndex === index && sortState.order === 'desc' ? 'var(--ux-primary-color, #1890ff)' : '#bfbfbf', lineHeight: '10px' }}>▼</span>
                                    </div>
                                )}
                            </div>
                            {/* 列宽调整手柄 */}
                            {column.resizable !== false && (
                                <div
                                    onMouseDown={(e) => onResizeMouseDown(e, index)}
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
                        </th>
                    );
                })}
            </tr>
        </thead>
    );
};
