import { useState, useMemo } from 'react';
import { UxTable } from '../components/UxTable';
import type { UxTableColumn } from '../components/UxTable/types';
interface DataType {
    key: string;
    [key: string]: string | number | null;
}

const generateColumns = (cols: number): UxTableColumn<DataType>[] => {
    const columns: UxTableColumn<DataType>[] = [];

    columns.push({
        title: '列',
        dataIndex: 'col_0',
        key: 'col_0',
        width: 150,
        editable: true,
        sorter: true
    });

    columns.push({
        title: '数字列',
        dataIndex: 'num_col',
        key: 'num_col',
        width: 120,
        editable: true,
        sorter: true
    });

    for (let i = 1; i < cols; i++) {
        columns.push({
            title: `列 ${i}`,
            dataIndex: `col_${i}`,
            key: `col_${i}`,
            width: 120,
            editable: true,
        });
    }

    return columns;
};

const generateData = (rows: number, cols: number): DataType[] => {
    const data: DataType[] = [];
    for (let i = 0; i < rows; i++) {
        const item: DataType = { key: `${i}` };
        for (let j = 0; j < cols; j++) {
            item[`col_${j}`] = `数据 ${i}-${j}`;
        }
        // 添加数字列数据，故意打乱顺序并混入 null
        item['num_col'] = i % 3 === 0 ? null : (rows - i) * 10;

        // 如果是性能测试，将所有单元格的值设置为 100 以简化和符合需求
        if (window.location.search.includes('perf=true')) {
            for (let j = 0; j < cols; j++) {
                item[`col_${j}`] = '100';
            }
            item['num_col'] = '100';
        }

        data.push(item);
    }
    return data;
};
function DefaultDemo() {
    const isPerfTest = window.location.search.includes('perf=true');
    const initialData = useMemo(() => isPerfTest ? generateData(999, 999) : generateData(6, 20), [isPerfTest]);
    const initialColumns = useMemo(() => isPerfTest ? generateColumns(999) : generateColumns(20), [isPerfTest]);
    const [data, setData] = useState(initialData);

    const onDataChange = (newData: DataType[]) => {
        console.log('newData', newData);
        setData(newData);
    };

    return (
        <div className='h-92vh w-95vw'>
            <div
                className='p-20px wh-full  flex flex-col justify-center' >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <UxTable<DataType[]>
                        columns={initialColumns}
                        data={data}
                        rowKey="key"
                        onDataChange={onDataChange}
                        gridConfig={{ rows: isPerfTest ? 900 : 20, cols: isPerfTest ? 900 : 20 }}
                        infinite={{ row: 10, col: 5, gap: 5 }}
                        style={{ height: '100%' }}
                        recordNum={10}
                        isWorker={window.location.search.includes('isWorker=false') ? false : true}
                    />
                </div>
            </div>
        </div>

    )
}

export default DefaultDemo
