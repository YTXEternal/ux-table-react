export const processCopy = (
    selectedData: Record<string, unknown>[], 
    columns: { key?: string | number | symbol; dataIndex: string | number | symbol }[]
) => {
    const rows: string[] = [];
    for (let i = 0; i < selectedData.length; i++) {
        const rowData: string[] = [];
        const record = selectedData[i];
        for (let j = 0; j < columns.length; j++) {
            if (columns[j].key === '_line_number_') continue;
            const val = record[columns[j].dataIndex as string];
            rowData.push(val !== null && val !== undefined ? String(val) : '');
        }
        if (rowData.length > 0) {
            rows.push(rowData.join('\t'));
        }
    }
    return rows.join('\n');
};

export const processPasteParse = (text: string) => {
    const rows = text.split(/\r\n|\n|\r/).filter((row: string) => row.length > 0);
    return rows.map((row: string) => row.split('\t'));
};

export const processPaste = (
    text: string,
    finalData: Record<string, unknown>[],
    sortedData: Record<string, unknown>[],
    columns: { editable?: boolean; dataIndex: string | number | symbol }[],
    startRow: number,
    startCol: number
) => {
    const parsedRows = processPasteParse(text);
    if (!parsedRows || parsedRows.length === 0) {
        return null;
    }

    const newData = [...finalData];
    let changed = false;

    let maxRowIdx = startRow;
    let maxColIdx = startCol;

    parsedRows.forEach((cells: string[], rIdx: number) => {
        const targetRowIdx = startRow + rIdx;
        if (targetRowIdx >= sortedData.length) return; // 卫语句：越界跳过

        maxRowIdx = Math.max(maxRowIdx, targetRowIdx);

        const record = sortedData[targetRowIdx];
        const originalIndex = finalData.indexOf(record);
        if (originalIndex === -1) return; // 卫语句：找不到原数据索引跳过

        const newRecord = { ...finalData[originalIndex] };

        cells.forEach((cellStr: string, cIdx: number) => {
            const targetColIdx = startCol + cIdx;
            if (targetColIdx >= columns.length) return; // 卫语句：越界跳过

            maxColIdx = Math.max(maxColIdx, targetColIdx);

            const column = columns[targetColIdx];
            if (column.editable === false) return; // 卫语句：不可编辑跳过

            newRecord[column.dataIndex as string] = cellStr;
            changed = true;
        });
        
        newData[originalIndex] = newRecord;
    });

    if (!changed) {
        return null;
    }

    return {
        newData,
        maxRowIdx,
        maxColIdx
    };
};