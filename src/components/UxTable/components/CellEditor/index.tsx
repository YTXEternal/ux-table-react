import React, { useState, useRef, useEffect } from 'react';
import type { CellEditorProps } from './types';

/**
 * 单元格编辑器组件
 * 渲染一个输入框用于修改单元格数据，支持回车保存、Esc 取消，并在失焦时自动保存
 * @param {CellEditorProps} props 编辑器组件属性
 * @returns {React.ReactElement} 渲染的输入框元素
 */
export const CellEditor: React.FC<CellEditorProps> = ({ initialValue, onSave, onCancel }) => {
    // 内部维护编辑框的当前值
    const [editValue, setEditValue] = useState(initialValue);
    // 用于标记是否正在执行取消操作，防止在取消时触发 onBlur 的保存逻辑
    const isCancelingRef = useRef(false);

    // 当传入的初始值发生变化时，同步更新内部状态
    useEffect(() => {
        setEditValue(initialValue);
    }, [initialValue]);

    return (
        <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
                // 如果不是因为按下 Escape 键触发的失焦，则自动保存当前编辑内容
                if (!isCancelingRef.current) {
                    onSave(editValue);
                }
                // 重置取消标记
                isCancelingRef.current = false;
            }}
            onKeyDown={(e) => {
                // 阻止事件冒泡，避免触发外部表格的其他快捷键逻辑
                e.stopPropagation();
                if (e.key === 'Enter') {
                    // 按下回车键保存修改
                    onSave(editValue);
                } else if (e.key === 'Escape') {
                    // 按下 Esc 键取消修改，并设置标记以阻止 onBlur 的保存
                    isCancelingRef.current = true;
                    onCancel();
                }
            }}
            style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                border: '2px solid var(--ux-primary-color, #1890ff)',
                padding: '6px 14px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '13px',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 0 2px var(--ux-primary-color-bg, rgba(24, 144, 255, 0.2))'
            }}
        />
    );
};
