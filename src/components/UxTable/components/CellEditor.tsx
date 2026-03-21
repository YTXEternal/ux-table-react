import React, { useState, useRef, useEffect } from 'react';

interface CellEditorProps {
    initialValue: string;
    onSave: (value: string) => void;
    onCancel: () => void;
}

export const CellEditor: React.FC<CellEditorProps> = ({ initialValue, onSave, onCancel }) => {
    const [editValue, setEditValue] = useState(initialValue);
    const isCancelingRef = useRef(false);

    useEffect(() => {
        setEditValue(initialValue);
    }, [initialValue]);

    return (
        <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
                if (!isCancelingRef.current) {
                    onSave(editValue);
                }
                isCancelingRef.current = false;
            }}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    onSave(editValue);
                } else if (e.key === 'Escape') {
                    isCancelingRef.current = true;
                    onCancel();
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
    );
};
