import { render, screen } from '@testing-library/react';
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
});
