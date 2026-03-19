import { useState, useEffect } from 'react';

export interface SelectionState {
    start: { row: number; col: number };
    end: { row: number; col: number };
}

export const useSelection = (tableRef: React.RefObject<HTMLDivElement | null>) => {
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsSelecting(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const handleCellMouseDown = (e: React.MouseEvent, rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
        if (e.button !== 0) return; // Only left click
        setIsSelecting(true);
        
        if (isLineNumberCol) {
            setSelection({
                start: { row: rowIndex, col: 0 },
                end: { row: rowIndex, col: Math.max(0, colCount - 1) }
            });
        } else {
            setSelection({
                start: { row: rowIndex, col: colIndex },
                end: { row: rowIndex, col: colIndex }
            });
        }
        
        // Focus table for keyboard events
        tableRef.current?.focus();
    };

    const handleCellMouseEnter = (rowIndex: number, colIndex: number, colCount: number, isLineNumberCol: boolean = false) => {
        if (isSelecting && selection) {
            if (isLineNumberCol) {
                setSelection({
                    ...selection,
                    end: { row: rowIndex, col: Math.max(0, colCount - 1) }
                });
            } else {
                setSelection({
                    ...selection,
                    end: { row: rowIndex, col: colIndex }
                });
            }
        }
    };

    const handleColHeaderMouseDown = (e: React.MouseEvent, colIndex: number, rowCount: number) => {
        if (e.button !== 0) return; // Only left click
        setIsSelecting(true);
        setSelection({
            start: { row: 0, col: colIndex },
            end: { row: Math.max(0, rowCount - 1), col: colIndex }
        });
        tableRef.current?.focus();
    };

    const handleColHeaderMouseEnter = (colIndex: number, rowCount: number) => {
        if (isSelecting && selection) {
            setSelection({
                ...selection,
                end: { row: Math.max(0, rowCount - 1), col: colIndex }
            });
        }
    };

    const isCellSelected = (rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        const r1 = Math.min(selection.start.row, selection.end.row);
        const r2 = Math.max(selection.start.row, selection.end.row);
        const c1 = Math.min(selection.start.col, selection.end.col);
        const c2 = Math.max(selection.start.col, selection.end.col);
        return rowIndex >= r1 && rowIndex <= r2 && colIndex >= c1 && colIndex <= c2;
    };

    const isCellActive = (rowIndex: number, colIndex: number) => {
        if (!selection) return false;
        return selection.start.row === rowIndex && selection.start.col === colIndex;
    };

    return {
        selection,
        setSelection,
        isSelecting,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleColHeaderMouseDown,
        handleColHeaderMouseEnter,
        isCellSelected,
        isCellActive
    };
};
