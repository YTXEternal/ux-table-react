import { useState, useMemo } from 'react';
import { UxTable } from './components/UxTable';
import type { UxTableColumn } from './components/UxTable/types';

interface DataType {
  key: string;
  [key: string]: string | number;
}

// 生成大规模数据
const generateData = (rows: number, cols: number): DataType[] => {
  const data: DataType[] = [];
  for (let i = 0; i < rows; i++) {
    const item: DataType = { key: `${i}` };
    for (let j = 0; j < cols; j++) {
      item[`col_${j}`] = `数据 ${i}-${j}`;
    }
    data.push(item);
  }
  return data;
};

// 生成大规模列定义
const generateColumns = (cols: number): UxTableColumn<DataType>[] => {
  const columns: UxTableColumn<DataType>[] = [];
  
  // 固定第一列
  columns.push({
    title: '固定列',
    dataIndex: 'col_0',
    key: 'col_0',
    width: 150,
    fixed: 'left',
    editable: true,
    sorter: (a, b) => String(a.col_0).localeCompare(String(b.col_0))
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

function App() {
  // 使用 useMemo 缓存初始数据，避免重复生成
  const initialData = useMemo(() => generateData(6, 20), []);
  const initialColumns = useMemo(() => generateColumns(20), []);

  const [data, setData] = useState(initialData);

  return (
    <div style={{ padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>UxTable 网格画布演示</h1>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <UxTable<DataType[]> 
          columns={initialColumns} 
          data={data} 
          rowKey="key"
          onDataChange={setData}
          gridConfig={{ rows: 20, cols: 20 }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}

export default App
