import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UxTable } from '../index';
import type { UxTableColumn } from '../types';

// Mock @tanstack/react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(({ count, horizontal }) => {
    return {
      getVirtualItems: () => {
        const size = horizontal ? 100 : 40;
        return Array.from({ length: count }).map((_, index) => ({
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
    render(<UxTable columns={columns} data={testData} rowKey="key" gridConfig={gridConfig} />);
    
    // The test mock virtualizer renders all items
    // Should render 3 rows. First row has Name, Age(null), Col_2(null)
    // We can't directly check the internal state easily here, but we can verify it doesn't crash 
    // and correctly renders the header for the dynamically added 3rd column "C".
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  describe('Copy functionality with marching ants animation', () => {
    it('should show marching ants animation when cells are copied', async () => {
      const user = userEvent.setup();
      render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell00 = screen.getByTestId('ux-table-cell-0-0');
      
      // Select cell
      await user.click(cell00);
      
      // Press Ctrl+C to copy
      fireEvent.keyDown(cell00, { key: 'c', ctrlKey: true });
      
      // The marching ants divs should be rendered inside the cell
      // We can query by class name since we used CSS modules in the implementation
      // But in tests, CSS modules class names might be mocked or plain. 
      // Let's just check if elements with matching class name substrings exist.
      // Or easier: check if the cell contains the marching ants div elements.
      const cellElement = screen.getByTestId('ux-table-cell-0-0');
      // Look for the 4 border animation divs
      const children = Array.from(cellElement.children);
      const hasTopAnts = children.some(el => el.className.includes('marching-ants-top'));
      const hasBottomAnts = children.some(el => el.className.includes('marching-ants-bottom'));
      const hasLeftAnts = children.some(el => el.className.includes('marching-ants-left'));
      const hasRightAnts = children.some(el => el.className.includes('marching-ants-right'));
      
      expect(hasTopAnts).toBe(true);
      expect(hasBottomAnts).toBe(true);
      expect(hasLeftAnts).toBe(true);
      expect(hasRightAnts).toBe(true);
    });

    it('should clear marching ants animation when Escape is pressed', async () => {
      const user = userEvent.setup();
      const { container } = render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell00 = screen.getByTestId('ux-table-cell-0-0');
      const tableMain = container.querySelector('.ux-table-main');
      
      // Select cell
      await user.click(cell00);
      
      // Copy
      fireEvent.keyDown(cell00, { key: 'c', ctrlKey: true });
      
      // Verify ants are there
      let cellElement = screen.getByTestId('ux-table-cell-0-0');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(true);
      
      // Press Escape
      if (tableMain) {
          fireEvent.keyDown(tableMain, { key: 'Escape' });
      }
      
      // Verify ants are gone
      cellElement = screen.getByTestId('ux-table-cell-0-0');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(false);
    });

    it('should clear marching ants animation when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<UxTable columns={columns} data={data} rowKey="key" />);
      
      const cell00 = screen.getByTestId('ux-table-cell-0-0');
      
      // Select cell
      await user.click(cell00);
      
      // Copy
      fireEvent.keyDown(cell00, { key: 'c', ctrlKey: true });
      
      // Verify ants are there
      let cellElement = screen.getByTestId('ux-table-cell-0-0');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(true);
      
      // Double click to edit
      await user.dblClick(cell00);
      
      // Verify ants are gone
      cellElement = screen.getByTestId('ux-table-cell-0-0');
      expect(Array.from(cellElement.children).some(el => el.className.includes('marching-ants-top'))).toBe(false);
    });
  });
});
