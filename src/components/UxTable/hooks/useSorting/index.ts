import { useState, useMemo } from 'react';
import type { UxTableColumn } from '../../types';
import { compareValues } from '../../utils/sort';
import type { SortState, UseSortingReturn } from './types';

/**
 * 用于管理表格数据排序状态的 Hook
 * 
 * @template DataSource 数据源类型
 * @param {DataSource} data 原始数据源
 * @param {UxTableColumn<DataSource[number]>[]} columns 表格列配置
 * @returns {UseSortingReturn<DataSource>} 包含当前排序状态、排序处理函数以及排序后数据的对象
 */
export const useSorting = <DataSource extends unknown[]>(
    data: DataSource,
    columns: UxTableColumn<DataSource[number]>[]
): UseSortingReturn<DataSource> => {
    // 当前的排序状态
    const [sortState, setSortState] = useState<SortState | null>(null);

    /**
     * 处理列头的排序点击事件
     * 
     * @param {number} index 被点击的列索引
     * @returns {void}
     */
    const handleSort = (index: number) => {
        const column = columns[index];
        // 卫语句：如果该列未配置排序功能，则直接返回
        if (!column.sorter) return;

        setSortState(prev => {
            if (prev?.colIndex === index) {
                // 状态循环：升序 -> 降序 -> 取消排序
                if (prev.order === 'asc') return { colIndex: index, order: 'desc' };
                return null;
            }
            // 默认第一次点击为升序
            return { colIndex: index, order: 'asc' };
        });
    };

    // 使用 useMemo 缓存排序后的数据，避免不必要的重复计算
    const sortedData = useMemo(() => {
        if (!sortState) return data;
        const column = columns[sortState.colIndex];
        if (!column.sorter || !column.dataIndex) return data;
        
        const dataCopy = [...data] as DataSource;
        dataCopy.sort((a, b) => {
            const valA = (a as Record<string, unknown>)[column.dataIndex as string];
            const valB = (b as Record<string, unknown>)[column.dataIndex as string];
            
            // 提取空值判断：空值（null/undefined/空字符串）始终置于末尾
            const isNullA = valA === null || valA === undefined || valA === '';
            const isNullB = valB === null || valB === undefined || valB === '';

            if (isNullA && isNullB) return 0;
            if (isNullA) return 1;
            if (isNullB) return -1;

            let result = 0;
            if (typeof column.sorter === 'function') {
                result = column.sorter(a, b);
            } else {
                result = compareValues(valA, valB);
            }
            
            return sortState.order === 'asc' ? result : -result;
        });
        return dataCopy;
    }, [data, sortState, columns]);

    return {
        sortState,
        handleSort,
        sortedData
    };
};
