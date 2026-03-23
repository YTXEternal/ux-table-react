import type { CopyPayloadData, DeletePayloadData, PastePayloadData } from './types';

/**
 * 处理复制逻辑，将选中的数据转换为制表符分隔的字符串
 * 
 * @param {CopyPayloadData['selectedData']} selectedData 选中的数据行
 * @param {CopyPayloadData['columns']} columns 选中的列配置
 * @returns {string} 格式化后的字符串，用于写入剪贴板
 */
export const processCopy = (
    selectedData: CopyPayloadData['selectedData'],
    columns: CopyPayloadData['columns']
) => {
    const rows: string[] = [];
    for (let i = 0; i < selectedData.length; i++) {
        const rowData: string[] = [];
        const record = selectedData[i];
        for (let j = 0; j < columns.length; j++) {
            // 忽略行号列
            if (columns[j].key === '_line_number_') continue;
            const val = record[columns[j].dataIndex as string];
            rowData.push(val !== null && val !== undefined ? String(val) : '');
        }
        if (rowData.length > 0) {
            rows.push(rowData.join('\t'));
        }
    }
    const text = rows.join('\n');
    return text + '\n';
};

/**
 * 处理删除逻辑，将选中区域内的数据清空（设置为 null）
 * 
 * @param {DeletePayloadData['finalData']} finalData 原始完整数据
 * @param {DeletePayloadData['sortedData']} sortedData 排序后的当前展示数据
 * @param {DeletePayloadData['columns']} columns 完整的列配置
 * @param {DeletePayloadData['bounds']} bounds 选区的边界（行列索引范围）
 * @returns {{ newData: Record<string, unknown>[] } | null} 返回更新后的数据，如果无变化则返回 null
 */
export const processDelete = (
    finalData: DeletePayloadData['finalData'],
    sortedData: DeletePayloadData['sortedData'],
    columns: DeletePayloadData['columns'],
    bounds: DeletePayloadData['bounds']
) => {
    const newData = [...finalData];
    let changed = false;

    for (let rIdx = bounds.top; rIdx <= bounds.bottom; rIdx++) {
        const record = sortedData[rIdx];
        const originalIndex = finalData.indexOf(record);
        if (originalIndex === -1) continue; // 卫语句：找不到原数据索引跳过

        const newRecord = { ...newData[originalIndex] };
        for (let cIdx = bounds.left; cIdx <= bounds.right; cIdx++) {
            const column = columns[cIdx];
            if (column.editable === false || column.key === '_line_number_') continue; // 卫语句：不可编辑或行号列跳过

            newRecord[column.dataIndex as string] = null;
            changed = true;
        }
        newData[originalIndex] = newRecord;
    }

    if (!changed) return null;
    return { newData };
};

/**
 * 解析粘贴的文本数据，按行和制表符分割
 * 
 * @param {string} text 剪贴板中的纯文本
 * @returns {string[][]} 解析后的二维字符串数组
 */
export const processPasteParse = (text: string) => {
    if (!text) return [['']];
    // 移除末尾的单个换行符（兼容 Excel 和 processCopy 的行为）
    const normalizedText = text.replace(/(?:\r\n|\n|\r)$/, '');
    const rows = normalizedText.split(/\r\n|\n|\r/);
    return rows.map((row: string) => row.split('\t'));
};

/**
 * 处理粘贴逻辑，将解析后的数据合并到表格数据中，并支持处理剪切后的清空操作
 * 
 * @param {PastePayloadData['text']} text 剪贴板中的纯文本
 * @param {PastePayloadData['finalData']} finalData 原始完整数据
 * @param {PastePayloadData['sortedData']} sortedData 排序后的当前展示数据
 * @param {PastePayloadData['columns']} columns 完整的列配置
 * @param {PastePayloadData['startRow']} startRow 粘贴起始行索引
 * @param {PastePayloadData['startCol']} startCol 粘贴起始列索引
 * @param {PastePayloadData['cutBounds']} [cutBounds] 如果是剪切操作，则提供被剪切的区域边界
 * @returns {{ newData: Record<string, unknown>[], maxRowIdx: number, maxColIdx: number } | null} 返回更新后的数据和最大行列索引，如果无变化则返回 null
 */
export const processPaste = (
    text: PastePayloadData['text'],
    finalData: PastePayloadData['finalData'],
    sortedData: PastePayloadData['sortedData'],
    columns: PastePayloadData['columns'],
    startRow: PastePayloadData['startRow'],
    startCol: PastePayloadData['startCol'],
    cutBounds?: PastePayloadData['cutBounds']
) => {
    const parsedRows = processPasteParse(text);
    if (!parsedRows || parsedRows.length === 0) {
        return null;
    }

    const newData = [...finalData];
    let changed = false;

    // 处理剪切后的源数据清空
    if (cutBounds) {
        for (let rIdx = cutBounds.top; rIdx <= cutBounds.bottom; rIdx++) {
            const record = sortedData[rIdx];
            const originalIndex = finalData.indexOf(record);
            if (originalIndex !== -1) {
                const newRecord = { ...newData[originalIndex] };
                for (let cIdx = cutBounds.left; cIdx <= cutBounds.right; cIdx++) {
                    const column = columns[cIdx];
                    if (column.editable === false || column.key === '_line_number_') continue;
                    newRecord[column.dataIndex as string] = null;
                    changed = true;
                }
                newData[originalIndex] = newRecord;
            }
        }
    }

    let maxRowIdx = startRow;
    let maxColIdx = startCol;

    parsedRows.forEach((cells: string[], rIdx: number) => {
        const targetRowIdx = startRow + rIdx;
        if (targetRowIdx >= sortedData.length) return; // 卫语句：越界跳过

        maxRowIdx = Math.max(maxRowIdx, targetRowIdx);

        const record = sortedData[targetRowIdx];
        const originalIndex = finalData.indexOf(record);
        if (originalIndex === -1) return; // 卫语句：找不到原数据索引跳过

        const newRecord = { ...newData[originalIndex] };

        cells.forEach((cellStr: string, cIdx: number) => {
            const targetColIdx = startCol + cIdx;
            if (targetColIdx >= columns.length) return; // 卫语句：越界跳过

            maxColIdx = Math.max(maxColIdx, targetColIdx);

            const column = columns[targetColIdx];
            if (column.editable === false || column.key === '_line_number_') return; // 卫语句：不可编辑或行号列跳过

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