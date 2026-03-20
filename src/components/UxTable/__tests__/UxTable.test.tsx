import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UxTable } from '../index';
import type { UxTableColumn } from '../types';

jest.mock('../workers/createWorker', () => ({
  createTableWorker: () => null // Mock out the worker creation to avoid import.meta.url errors
}));

// Mock @tanstack/react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(({ count, horizontal }) => {
    return {
      getVirtualItems: () => {
        // Limit to 5 items to avoid infinite loops in infinite scrolling tests
        const renderCount = Math.min(count, 5);
        const size = horizontal ? 100 : 40;
        return Array.from({ length: renderCount }).map((_, index) => ({
          index,
          start: index * size,
          size,
          end: (index + 1) * size,
          key: index,
          measureElement: () => {},
        }));
      },
      getTotalSize: () => count * (horizontal ? 100 : 40),
      measure: () => {},
    };
  }),
  defaultRangeExtractor: jest.fn((range) => {
    const start = Math.max(0, range.startIndex - range.overscan);
    const end = Math.min(range.count - 1, range.endIndex + range.overscan);
    const arr = [];
    for (let i = start; i <= end; i++) {
        arr.push(i);
    }
    return arr;
  })
}));

interface DataType {
  key: string;
  name: string;
  age: number;
}


describe('UxTable 组件', () => {
  const columns: UxTableColumn<DataType>[] = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
  ];

  const data: DataType[] = [
    { key: '1', name: 'John Doe', age: 30 },
    { key: '2', name: 'Jane Doe', age: 25 },
  ];

  it('当 lineShow 为 true (默认值) 时渲染行号', () => {
    // The render function in the mock returns what we rendered. The line number column renders 1 and 2
    render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} />);
    // The render function of the line number column uses ReactNode, let's find it by testid
    // First column is line number, so cell-0-0 and cell-1-0 should contain "1" and "2" respectively
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('1');
    expect(screen.getByTestId('ux-table-cell-1-0')).toHaveTextContent('2');
  });

  it('当 lineShow 为 false 时不渲染行号', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" lineShow={false} />);
    // If lineShow is false, cell-0-0 should be "John Doe", not "1"
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('John Doe');
  });

  it('正确渲染表头', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('正确渲染表格数据', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('补齐数据以匹配 gridConfig 并用 null 填充缺失值', () => {
    const gridConfig = { rows: 3, cols: 3 };
    const testData = [{ key: '1', name: 'John Doe' }] as DataType[];
    // lineShow = false to match original grid testing layout exactly
    render(<UxTable columns={columns} data={testData} rowKey="key" gridConfig={gridConfig} lineShow={false} />);
    
    // The test mock virtualizer renders all items
    // If target cols is 3, columns length becomes 3 (1, 2, 3)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('当按下 Ctrl+A 时全选所有单元格', async () => {
    const user = userEvent.setup();
    render(<UxTable columns={columns} data={data} rowKey="key" isWorker={false} />);
    
    // First col is line number, start with second col
    const cell01 = screen.getByTestId('ux-table-cell-0-1');
    
    // Select cell
    await user.click(cell01);
    
    // Press Ctrl+A
    fireEvent.keyDown(cell01, { key: 'a', ctrlKey: true });
    
    // Both data cells in the row should be selected (having blue background style)
    // Note: since lineShow=true, columns count is 3. The 3rd column index is 2
    const cell02 = screen.getByTestId('ux-table-cell-0-2');
    
    // active cell is white
    expect(cell01).toHaveStyle('background-color: #e6f7ff'); 
    // selected cell is light blue
    expect(cell02).toHaveStyle('background-color: #e6f7ff'); 
  });

  it('点击表头时选中整列', async () => {
    const user = userEvent.setup();
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
    // First col is line number, we can select the second col (Name)
    const headerCell = screen.getByTestId('ux-table-header-cell-1');
    
    // Select column
    await user.click(headerCell);
    
    // The entire column should be selected
    const cell01 = screen.getByTestId('ux-table-cell-0-1');
    const cell11 = screen.getByTestId('ux-table-cell-1-1');
    
    expect(cell01).toHaveStyle({ backgroundColor: '#ffffff' }); // First cell might be active if it's the start
    expect(cell11).toHaveStyle({ backgroundColor: '#e6f7ff' });
  });

  it('点击行号单元格时选中整行', async () => {
    const user = userEvent.setup();
    render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} />);
    
    // cell-0-0 is the line number cell for the first row
    const lineNumCell = screen.getByTestId('ux-table-cell-0-0');
    
    // Select row
    await user.click(lineNumCell);
    
    // The entire row should be selected
    const cell01 = screen.getByTestId('ux-table-cell-0-1');
    const cell02 = screen.getByTestId('ux-table-cell-0-2');
    
    // first cell in the selection (active) is white, others are light blue
    expect(lineNumCell).toHaveStyle('background-color: #ffffff'); 
    expect(cell01).toHaveStyle('background-color: #e6f7ff');
    expect(cell02).toHaveStyle('background-color: #e6f7ff');
  });

  it('仅当点击排序图标时触发排序', async () => {
    const sortableColumns: UxTableColumn<DataType>[] = [
      { title: 'Name', dataIndex: 'name', key: 'name', sorter: true }
    ];
    const user = userEvent.setup();
    // Use lineShow={false} to simplify indices for this test
    render(<UxTable columns={sortableColumns} data={data} rowKey="key" lineShow={false} />);
    
    const headerCell = screen.getByTestId('ux-table-header-cell-0');
    const sortIcon = screen.getByTestId('ux-table-sorter-0');
    
    // Clicking header cell shouldn't sort (order should remain original: John Doe first)
    await user.click(headerCell);
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('John Doe');

    // Clicking sort icon should sort (Ascending: Jane Doe first)
    await user.click(sortIcon);
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('Jane Doe');
  });

  it('提供 infinite 属性时扩充行和列', () => {
    const infinite = { row: 5, col: 5, gap: 2 };
    
    // We start with 2 data rows. Target rows = 2.
    // getVirtualItems renders up to 5 items.
    // Render 1: count=2, lastRowIndex=1. 1 + 2 >= 1 -> expands by 5.
    // Render 2: count=7, lastRowIndex=4. 4 + 2 >= 6 -> expands by 5.
    // Render 3: count=12, lastRowIndex=4. 4 + 2 >= 11 -> stops expanding.
    // Target columns: initial is 2 + lineShow = 3.
    // Render 1: count=3, lastColIndex=2. 2 + 2 >= 2 -> expands by 5.
    // Render 2: count=8, lastColIndex=4. 4 + 2 >= 7 -> stops expanding.
    
    render(<UxTable columns={columns} data={data} rowKey="key" infinite={infinite} />);
    
    // Check if new columns are added (since count=8, but renderCount=5)
    // The columns are named by index + 1 (e.g. '4', '5' because indices are 3, 4)
    // Column indices: 0(lineShow), 1(Name), 2(Age), 3(4), 4(5)
    expect(screen.getByTestId('ux-table-header-cell-3')).toHaveTextContent('4');
    expect(screen.getByTestId('ux-table-header-cell-4')).toHaveTextContent('5');
  });

  it('提供 infinite.headerText 时格式化表头文本', () => {
    const infinite = { row: 5, col: 5, gap: 2, headerText: (index: number) => `Col ${index}` };
    
    render(<UxTable columns={columns} data={data} rowKey="key" infinite={infinite} />);
    
    // Column indices: 0(lineShow), 1(Name), 2(Age), 3(Col 3), 4(Col 4)
    expect(screen.getByText('Col 3')).toBeInTheDocument();
    expect(screen.getByText('Col 4')).toBeInTheDocument();
  });

  describe('带蚂蚁线动画的复制功能', () => {
    it('复制单元格时显示蚂蚁线动画并排除行号列', async () => {
      const user = userEvent.setup();
      
      // Setup document execCommand mock
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn();
      
      render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} isWorker={false} />);
      
      // Select the entire row using line number cell
      const lineNumCell = screen.getByTestId('ux-table-cell-0-0');
      await user.click(lineNumCell);
      
      // Press Ctrl+C to copy
      fireEvent.keyDown(lineNumCell, { key: 'c', ctrlKey: true });
      
      // The component internally uses useClipboard hook which we should ideally mock, 
      // but testing the marching ants animation is sufficient here to verify the copy triggered.
      
      // Verify animation is triggered on data cell
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      const children = Array.from(cell01.children);
      const hasTopAnts = children.some(el => el.className.includes('marching-ants-top'));
      expect(hasTopAnts).toBe(true);

      // Restore
      document.execCommand = originalExecCommand;
    });

    it('按下 Escape 键时清除蚂蚁线动画', async () => {
      const user = userEvent.setup();
      const { container } = render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      const tableMain = container.querySelector('.ux-table-main');
      
      // Select cell
      await user.click(cell01);
      
      // Copy
      fireEvent.keyDown(cell01, { key: 'c', ctrlKey: true });
      
      // Verify ants are there
      let cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(true);
      
      // Press Escape
      if (tableMain) {
          fireEvent.keyDown(tableMain, { key: 'Escape' });
      }
      
      // Verify ants are gone
      cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(false);
    });

    it('进入编辑模式时清除蚂蚁线动画', async () => {
      const user = userEvent.setup();
      render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      
      // Select cell
      await user.click(cell01);
      
      // Copy
      fireEvent.keyDown(cell01, { key: 'c', ctrlKey: true });
      
      // Verify ants are there
      let cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(true);
      
      // Double click to edit
      await user.dblClick(cell01);
      
      // Verify ants are gone
      cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(false);
    });

    it('beforeCopy 可以阻止复制，并且 afterCopy 可以在复制成功后被调用', async () => {
      const user = userEvent.setup();
      const beforeCopy = jest.fn().mockResolvedValue(false); // 第一次阻止
      const afterCopy = jest.fn();
      
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn();

      const { rerender } = render(<UxTable columns={columns} data={data} rowKey="key" lineShow={false} isWorker={false} beforeCopy={beforeCopy} afterCopy={afterCopy} />);
      
      const cell00 = screen.getByTestId('ux-table-cell-0-0');
      await user.click(cell00);
      
      // Copy
      fireEvent.keyDown(cell00, { key: 'c', ctrlKey: true });
      
      await new Promise(resolve => setTimeout(resolve, 0)); // 等待异步
      expect(beforeCopy).toHaveBeenCalledTimes(1);
      expect(afterCopy).not.toHaveBeenCalled(); // 复制被阻止

      // 修改 mock 允许复制
      beforeCopy.mockResolvedValue(true);
      rerender(<UxTable columns={columns} data={data} rowKey="key" lineShow={false} isWorker={false} beforeCopy={beforeCopy} afterCopy={afterCopy} />);
      
      fireEvent.keyDown(cell00, { key: 'c', ctrlKey: true });
      
      await new Promise(resolve => setTimeout(resolve, 0)); // 等待异步
      expect(beforeCopy).toHaveBeenCalledTimes(2);
      expect(afterCopy).toHaveBeenCalledTimes(1); // 复制成功触发

      document.execCommand = originalExecCommand;
    });
  });

  describe('剪切功能', () => {
    it('剪切单元格时显示蚂蚁线动画和 0.5 的不透明度', async () => {
      const user = userEvent.setup();
      
      // Setup document execCommand mock
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn();
      
      render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} isWorker={false} />);
      
      const lineNumCell = screen.getByTestId('ux-table-cell-0-0');
      await user.click(lineNumCell);
      
      // Press Ctrl+X to cut
      fireEvent.keyDown(lineNumCell, { key: 'x', ctrlKey: true });
      
      // Verify animation and opacity is applied on data cell
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      const children = Array.from(cell01.children);
      const hasTopAnts = children.some(el => el.className.includes('marching-ants-top'));
      expect(hasTopAnts).toBe(true);
      expect(cell01).toHaveStyle('opacity: 0.5');

      // Restore
      document.execCommand = originalExecCommand;
    });

    it('按下 Escape 键时清除剪切动画', async () => {
      const user = userEvent.setup();
      const { container } = render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      const tableMain = container.querySelector('.ux-table-main');
      
      // Select cell
      await user.click(cell01);
      
      // Cut
      fireEvent.keyDown(cell01, { key: 'x', ctrlKey: true });
      
      let cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(cellElement).toHaveStyle('opacity: 0.5');
      
      // Press Escape
      if (tableMain) {
          fireEvent.keyDown(tableMain, { key: 'Escape' });
      }
      
      // Verify ants are gone and opacity is 1
      cellElement = screen.getByTestId('ux-table-cell-0-1');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(false);
      expect(cellElement).toHaveStyle('opacity: 1');
    });
  });

  describe('删除功能', () => {
    it('按下 Delete 键时清除选中单元格数据并调用 onDataChange', async () => {
      const user = userEvent.setup();
      const onDataChange = jest.fn();
      
      render(<UxTable columns={columns} data={data} rowKey="key" onDataChange={onDataChange} isWorker={false} />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1'); // John Doe
      
      // Select cell
      await user.click(cell01);
      
      // Press Delete
      fireEvent.keyDown(cell01, { key: 'Delete' });
      
      // Need to wait for postWorkerMessage fallback to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onDataChange).toHaveBeenCalledTimes(1);
      
      // The expected data should have 'name' as null for the first row
      const calledData = onDataChange.mock.calls[0][0];
      expect(calledData[0].name).toBeNull();
      expect(calledData[0].age).toBe(30); // untouched
    });
  });

  describe('粘贴功能', () => {
    it('应该粘贴文本并调用 onDataChange', async () => {
      const user = userEvent.setup();
      const onDataChange = jest.fn();
      const { container } = render(<UxTable columns={columns} data={data} rowKey="key" onDataChange={onDataChange} isWorker={false} />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      await user.click(cell01);

      const tableMain = container.querySelector('.ux-table-main');
      
      // Simulate paste event
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: jest.fn().mockReturnValue('New John\t35') }
      });
      
      if (tableMain) {
        fireEvent(tableMain, pasteEvent);
      }
      
      // Wait for async worker fallback
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onDataChange).toHaveBeenCalledTimes(1);
      const calledData = onDataChange.mock.calls[0][0];
      expect(calledData[0].name).toBe('New John');
      expect(calledData[0].age).toBe('35');
    });

    it('不应该粘贴到不可编辑的列', async () => {
      const user = userEvent.setup();
      const onDataChange = jest.fn();
      const readonlyColumns: UxTableColumn<DataType>[] = [
        { title: 'Name', dataIndex: 'name', key: 'name', editable: false },
        { title: 'Age', dataIndex: 'age', key: 'age', editable: true },
      ];

      const { container } = render(<UxTable columns={readonlyColumns} data={data} rowKey="key" onDataChange={onDataChange} isWorker={false} />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      await user.click(cell01);

      const tableMain = container.querySelector('.ux-table-main');
      
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: jest.fn().mockReturnValue('New John\t35') }
      });
      
      if (tableMain) {
        fireEvent(tableMain, pasteEvent);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onDataChange).toHaveBeenCalledTimes(1);
      const calledData = onDataChange.mock.calls[0][0];
      expect(calledData[0].name).toBe('John Doe'); // unchanged
      expect(calledData[0].age).toBe('35'); // changed
    });

    it('beforePaste 可以阻止粘贴，并且 afterPaste 可以在粘贴成功后被调用', async () => {
      const user = userEvent.setup();
      const onDataChange = jest.fn();
      const beforePaste = jest.fn().mockResolvedValue(false); // 第一次阻止
      const afterPaste = jest.fn();

      const { container, rerender } = render(
        <UxTable 
          columns={columns} 
          data={data} 
          rowKey="key" 
          lineShow={false}
          onDataChange={onDataChange} 
          isWorker={false} 
          beforePaste={beforePaste} 
          afterPaste={afterPaste} 
        />
      );
      
      const cell00 = screen.getByTestId('ux-table-cell-0-0');
      await user.click(cell00);

      const tableMain = container.querySelector('.ux-table-main');
      
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: jest.fn().mockReturnValue('New John\t35') }
      });
      
      if (tableMain) {
        fireEvent(tableMain, pasteEvent);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(beforePaste).toHaveBeenCalledTimes(1);
      expect(onDataChange).not.toHaveBeenCalled(); // 粘贴被阻止
      expect(afterPaste).not.toHaveBeenCalled(); // 粘贴被阻止

      // 允许粘贴
      beforePaste.mockResolvedValue(true);
      rerender(
        <UxTable 
          columns={columns} 
          data={data} 
          rowKey="key" 
          lineShow={false}
          onDataChange={onDataChange} 
          isWorker={false} 
          beforePaste={beforePaste} 
          afterPaste={afterPaste} 
        />
      );

      if (tableMain) {
        fireEvent(tableMain, pasteEvent);
      }

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(beforePaste).toHaveBeenCalledTimes(2);
      expect(onDataChange).toHaveBeenCalledTimes(1);
      expect(afterPaste).toHaveBeenCalledTimes(1);
    });
  });

  describe('拖拽选择', () => {
    it('拖拽时应选中多个单元格', async () => {
      render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      const cell12 = screen.getByTestId('ux-table-cell-1-2');
      
      // Start drag on cell01
      fireEvent.mouseDown(cell01);
      // Enter cell12
      fireEvent.mouseEnter(cell12);
      
      // cell 01, 02, 11, 12 should be selected
      expect(cell01).toHaveStyle('background-color: #ffffff'); // active
      expect(screen.getByTestId('ux-table-cell-0-2')).toHaveStyle('background-color: #e6f7ff');
      expect(screen.getByTestId('ux-table-cell-1-1')).toHaveStyle('background-color: #e6f7ff');
      expect(cell12).toHaveStyle('background-color: #e6f7ff');
    });
  });

  describe('异常用例', () => {
    it('对于不可编辑的列不应进入编辑模式', async () => {
      const user = userEvent.setup();
      const readonlyColumns: UxTableColumn<DataType>[] = [
        { title: 'Name', dataIndex: 'name', key: 'name', editable: false },
        { title: 'Age', dataIndex: 'age', key: 'age', editable: true }
      ];
      render(<UxTable columns={readonlyColumns} data={data} rowKey="key" />);
      
      const cell01 = screen.getByTestId('ux-table-cell-0-1');
      await user.dblClick(cell01);
      
      // Input should not exist
      expect(cell01.querySelector('input')).not.toBeInTheDocument();
    });

    it('应优雅地处理空数据', () => {
      const { container } = render(<UxTable columns={columns} data={[]} rowKey="key" />);
      expect(container).toBeInTheDocument();
      // Should still render headers
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('如果没有选区则复制操作不应执行任何操作', async () => {
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn();
      
      const { container } = render(<UxTable columns={columns} data={data} rowKey="key" isWorker={false} />);
      const tableMain = container.querySelector('.ux-table-main');
      
      // Press Ctrl+C without selecting anything
      if (tableMain) {
        fireEvent.keyDown(tableMain, { key: 'c', ctrlKey: true });
      }
      
      expect(document.execCommand).not.toHaveBeenCalled();
      
      document.execCommand = originalExecCommand;
    });
  });
});
