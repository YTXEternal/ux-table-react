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