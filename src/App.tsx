import { useState, useMemo } from 'react';
import { UxTable } from './components/UxTable';
import type { UxTableColumn } from './components/UxTable/types';

interface DataType {
  key: string;
  [key: string]: string | number | null;
}

// 生成大规模列定义
const generateColumns = (cols: number): UxTableColumn<DataType>[] => {
  const columns: UxTableColumn<DataType>[] = [];
  
  // 固定第一列
  columns.push({
    title: '固定列',
    dataIndex: 'col_0',
    key: 'col_0',
    width: 150,
    // fixed: 'left',
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

// 生成大规模数据
const generateData = (rows: number, cols: number): DataType[] => {
  const data: DataType[] = [];
  for (let i = 0; i < rows; i++) {
    const item: DataType = { key: `${i}` };
    for (let j = 0; j < cols; j++) {
      item[`col_${j}`] = `数据 ${i}-${j}`;
    }
    // 添加数字列数据，故意打乱顺序并混入 null
    item['num_col'] = i % 3 === 0 ? null : (rows - i) * 10;
    data.push(item);
  }
  return data;
};

function App() {
  // 使用 useMemo 缓存初始数据，避免重复生成
  const initialData = useMemo(() => generateData(6, 20), []);
  const initialColumns = useMemo(() => generateColumns(20), []);

  const [data, setData] = useState(initialData);

  const onDataChange = (newData: DataType[]) => {
    console.log('newData',newData);
    setData(newData);
  };

  return (
    <div style={{ padding: 20, height: '500px', display: 'flex', flexDirection: 'column' }}>
      <h1>UxTable</h1>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <UxTable<DataType[]> 
          columns={initialColumns} 
          data={data} 
          rowKey="key"
          onDataChange={onDataChange}
          gridConfig={{ rows: 20, cols: 20 }}
          style={{ height: '100%' }}
          lineShow={true}
        />
      </div>
    </div>
  )
}

export default App
