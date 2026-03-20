import { processCopy, processPasteParse, processPaste } from '../workerLogic';

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

    describe('processPaste', () => {
        it('should correctly update data with pasted text', () => {
            const text = 'NewJohn\t35\nNewJane\t28';
            const finalData = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 },
                { name: 'Bob', age: 40 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { editable: true, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' }
            ];

            const result = processPaste(text, finalData, sortedData, columns, 0, 0);
            
            expect(result).not.toBeNull();
            expect(result?.maxRowIdx).toBe(1);
            expect(result?.maxColIdx).toBe(1);
            expect(result?.newData).toEqual([
                { name: 'NewJohn', age: '35' },
                { name: 'NewJane', age: '28' },
                { name: 'Bob', age: 40 }
            ]);
        });

        it('should respect column editable false property', () => {
            const text = 'NewJohn\t35';
            const finalData = [
                { name: 'John', age: 30 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { editable: false, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' }
            ];

            const result = processPaste(text, finalData, sortedData, columns, 0, 0);
            
            expect(result).not.toBeNull();
            expect(result?.newData).toEqual([
                { name: 'John', age: '35' } // name is unchanged
            ]);
        });

        it('should return null if text is empty or no valid changes', () => {
            const finalData = [{ name: 'John' }];
            const columns = [{ editable: true, dataIndex: 'name' }];
            
            const result1 = processPaste('', finalData, finalData, columns, 0, 0);
            expect(result1).toBeNull();
            
            // All columns uneditable
            const result2 = processPaste('NewJohn', finalData, finalData, [{ editable: false, dataIndex: 'name' }], 0, 0);
            expect(result2).toBeNull();
        });
    });
});