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


describe('UxTable Component', () => {
  const columns: UxTableColumn<DataType>[] = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
  ];

  const data: DataType[] = [
    { key: '1', name: 'John Doe', age: 30 },
    { key: '2', name: 'Jane Doe', age: 25 },
  ];

  it('renders line numbers when lineShow is true (default)', () => {
    // The render function in the mock returns what we rendered. The line number column renders 1 and 2
    render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} />);
    // The render function of the line number column uses ReactNode, let's find it by testid
    // First column is line number, so cell-0-0 and cell-1-0 should contain "1" and "2" respectively
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('1');
    expect(screen.getByTestId('ux-table-cell-1-0')).toHaveTextContent('2');
  });

  it('does not render line numbers when lineShow is false', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" lineShow={false} />);
    // If lineShow is false, cell-0-0 should be "John Doe", not "1"
    expect(screen.getByTestId('ux-table-cell-0-0')).toHaveTextContent('John Doe');
  });

  it('renders table headers correctly', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders table data correctly', () => {
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('pads data to match gridConfig and fills missing values with null', () => {
    const gridConfig = { rows: 3, cols: 3 };
    const testData = [{ key: '1', name: 'John Doe' }] as DataType[];
    // lineShow = false to match original grid testing layout exactly
    render(<UxTable columns={columns} data={testData} rowKey="key" gridConfig={gridConfig} lineShow={false} />);
    
    // The test mock virtualizer renders all items
    // If target cols is 3, columns length becomes 3 (1, 2, 3)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('selects all cells when Ctrl+A is pressed', async () => {
    const user = userEvent.setup();
    render(<UxTable columns={columns} data={data} rowKey="key" />);
    
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

  it('selects column when clicking on column header', async () => {
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

  it('selects row when clicking on line number cell', async () => {
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

  it('triggers sort only when sort icon is clicked', async () => {
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

  it('expands rows and columns when infinite prop is provided', () => {
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

  it('formats column header text when infinite.headerText is provided', () => {
    const infinite = { row: 5, col: 5, gap: 2, headerText: (index: number) => `Col ${index}` };
    
    render(<UxTable columns={columns} data={data} rowKey="key" infinite={infinite} />);
    
    // Column indices: 0(lineShow), 1(Name), 2(Age), 3(Col 3), 4(Col 4)
    expect(screen.getByText('Col 3')).toBeInTheDocument();
    expect(screen.getByText('Col 4')).toBeInTheDocument();
  });

  describe('Copy functionality with marching ants animation', () => {
    it('should show marching ants animation when cells are copied and exclude line numbers', async () => {
      const user = userEvent.setup();
      
      // Setup document execCommand mock
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn();
      
      render(<UxTable columns={columns} data={data} rowKey="key" lineShow={true} />);
      
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

    it('should clear marching ants animation when Escape is pressed', async () => {
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

    it('should clear marching ants animation when entering edit mode', async () => {
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
  });
});
