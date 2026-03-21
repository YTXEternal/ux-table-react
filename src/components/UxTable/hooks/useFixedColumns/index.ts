import { useMemo } from 'react';
import type { UxTableColumn } from '../../types';
import type { ColumnOffset } from './types';

/**
 * 用于计算表格固定列（左侧/右侧固定）偏移量的 Hook
 * 
 * @template DataSource 数据源类型
 * @param {UxTableColumn<DataSource[number]>[]} columns 表格列配置
 * @returns {ColumnOffset[]} 每一列的固定偏移量配置数组
 */
export const useFixedColumns = <DataSource extends unknown[]>(
    columns: UxTableColumn<DataSource[number]>[]
): ColumnOffset[] => {
    return useMemo(() => {
        let leftOffset = 0;
        let rightOffset = 0;
        const offsets: ColumnOffset[] = [];

        // 计算左侧固定列的偏移量
        let lastLeftIndex = -1;
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            if (col.fixed === 'left') {
                offsets[i] = { left: leftOffset };
                leftOffset += (typeof col.width === 'number' ? col.width : parseInt(col.width as string, 10) || 100);
                lastLeftIndex = i;
            }
        }
        // 标记最后一个左侧固定列（用于添加阴影效果等）
        if (lastLeftIndex !== -1 && offsets[lastLeftIndex]) {
            offsets[lastLeftIndex].isLastLeft = true;
        }

        // 计算右侧固定列的偏移量
        let firstRightIndex = -1;
        for (let i = columns.length - 1; i >= 0; i--) {
            const col = columns[i];
            if (col.fixed === 'right') {
                offsets[i] = { ...offsets[i], right: rightOffset };
                rightOffset += (typeof col.width === 'number' ? col.width : parseInt(col.width as string, 10) || 100);
                firstRightIndex = i;
            }
        }
        // 标记第一个右侧固定列（用于添加阴影效果等）
        if (firstRightIndex !== -1 && offsets[firstRightIndex]) {
            offsets[firstRightIndex].isFirstRight = true;
        }

        return offsets;
    }, [columns]);
};
