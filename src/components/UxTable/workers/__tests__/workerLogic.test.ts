import { processCopy, processPasteParse } from '../workerLogic';

describe('workerLogic', () => {
    describe('processCopy', () => {
        it('should correctly process data and columns to a tab-separated string', () => {
            const data = [
                { name: 'John', age: 30, hidden: 'secret' },
                { name: 'Jane', age: 25, hidden: 'secret2' }
            ];
            const columns = [
                { key: 'name', dataIndex: 'name' },
                { key: 'age', dataIndex: 'age' }
            ];
            
            const result = processCopy(data, columns);
            expect(result).toBe('John\t30\nJane\t25');
        });

        it('should skip _line_number_ column', () => {
            const data = [{ name: 'John', age: 30 }];
            const columns = [
                { key: '_line_number_', dataIndex: 'id' },
                { key: 'name', dataIndex: 'name' }
            ];
            
            const result = processCopy(data, columns);
            expect(result).toBe('John');
        });

        it('should handle null and undefined values as empty strings', () => {
            const data = [{ name: 'John', age: null, address: undefined }];
            const columns = [
                { key: 'name', dataIndex: 'name' },
                { key: 'age', dataIndex: 'age' },
                { key: 'address', dataIndex: 'address' }
            ];
            
            const result = processCopy(data, columns);
            expect(result).toBe('John\t\t');
        });
    });

    describe('processPasteParse', () => {
        it('should correctly parse tab and newline separated string into 2D array', () => {
            const text = 'John\t30\nJane\t25';
            const result = processPasteParse(text);
            expect(result).toEqual([
                ['John', '30'],
                ['Jane', '25']
            ]);
        });

        it('should ignore empty lines', () => {
            const text = 'John\t30\n\nJane\t25\n';
            const result = processPasteParse(text);
            expect(result).toEqual([
                ['John', '30'],
                ['Jane', '25']
            ]);
        });
    });
});