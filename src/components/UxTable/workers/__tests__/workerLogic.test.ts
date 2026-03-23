import { processCopy, processPasteParse, processPaste, processDelete } from '../workerLogic';

describe('workerLogic 算法逻辑', () => {
    describe('processCopy 复制处理', () => {
        it('应该正确地将数据和列配置处理为制表符分隔的字符串', () => {
            const data = [
                { name: 'John', age: 30, hidden: 'secret' },
                { name: 'Jane', age: 25, hidden: 'secret2' }
            ];
            const columns = [
                { key: 'name', dataIndex: 'name' },
                { key: 'age', dataIndex: 'age' }
            ];

            const result = processCopy(data, columns);
            expect(result).toBe('John\t30\nJane\t25\n');
        });

        it('应该跳过 _line_number_ 行号列', () => {
            const data = [{ name: 'John', age: 30 }];
            const columns = [
                { key: '_line_number_', dataIndex: 'id' },
                { key: 'name', dataIndex: 'name' }
            ];

            const result = processCopy(data, columns);
            expect(result).toBe('John\n');
        });

        it('应该将 null 和 undefined 值处理为空字符串', () => {
            const data = [{ name: 'John', age: null, address: undefined }];
            const columns = [
                { key: 'name', dataIndex: 'name' },
                { key: 'age', dataIndex: 'age' },
                { key: 'address', dataIndex: 'address' }
            ];

            const result = processCopy(data, columns);
            expect(result).toBe('John\t\t\n');
        });
    });

    describe('processDelete 删除处理', () => {
        it('应该正确删除指定边界内的数据并设为 null', () => {
            const finalData = [
                { name: 'John', age: 30, id: 1 },
                { name: 'Jane', age: 25, id: 2 },
                { name: 'Bob', age: 40, id: 3 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { editable: true, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' },
                { editable: false, dataIndex: 'id' }
            ];

            const bounds = { top: 0, bottom: 1, left: 0, right: 1 };
            const result = processDelete(finalData, sortedData, columns, bounds);

            expect(result).not.toBeNull();
            expect(result?.newData).toEqual([
                { name: null, age: null, id: 1 },
                { name: null, age: null, id: 2 },
                { name: 'Bob', age: 40, id: 3 }
            ]);
        });

        it('应该尊重列的 editable:false 属性并跳过行号列', () => {
            const finalData = [
                { name: 'John', age: 30, id: 1 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { key: '_line_number_', dataIndex: 'line' },
                { editable: false, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' }
            ];

            const bounds = { top: 0, bottom: 0, left: 0, right: 2 };
            const result = processDelete(finalData, sortedData, columns, bounds);

            expect(result).not.toBeNull();
            expect(result?.newData).toEqual([
                { name: 'John', age: null, id: 1 }
            ]);
        });

        it('如果没有有效更改则应该返回 null', () => {
            const finalData = [{ name: 'John' }];
            const columns = [{ editable: false, dataIndex: 'name' }];
            const bounds = { top: 0, bottom: 0, left: 0, right: 0 };

            const result = processDelete(finalData, finalData, columns, bounds);
            expect(result).toBeNull();
        });
    });

    describe('processPasteParse 粘贴解析处理', () => {
        it('应该正确地将制表符和换行符分隔的字符串解析为二维数组', () => {
            const text = 'John\t30\nJane\t25';
            const result = processPasteParse(text);
            expect(result).toEqual([
                ['John', '30'],
                ['Jane', '25']
            ]);
        });

        it('应该保留空行以实现一比一还原', () => {
            const text = 'John\t30\n\nJane\t25\n';
            const result = processPasteParse(text);
            expect(result).toEqual([
                ['John', '30'],
                [''],
                ['Jane', '25']
            ]);
        });
    });

    describe('processPaste 粘贴覆盖处理', () => {
        it('应该使用粘贴的文本正确更新数据', () => {
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

        it('应该尊重列的 editable:false 属性', () => {
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

        it('如果粘贴前提供了剪切边界，应该先清除剪切边界内的数据', () => {
            const text = 'NewJohn\t35';
            const finalData = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { editable: true, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' }
            ];

            const cutBounds = { top: 1, bottom: 1, left: 0, right: 1 };
            const result = processPaste(text, finalData, sortedData, columns, 0, 0, cutBounds);

            expect(result).not.toBeNull();
            expect(result?.newData).toEqual([
                { name: 'NewJohn', age: '35' }, // Pasted row
                { name: null, age: null }       // Cut bounds cleared
            ]);
        });

        it('即使粘贴的文本覆盖了相同的单元格，也应该正确应用', () => {
            const text = 'NewJohn\t35';
            const finalData = [
                { name: 'John', age: 30 }
            ];
            const sortedData = [...finalData];
            const columns = [
                { editable: true, dataIndex: 'name' },
                { editable: true, dataIndex: 'age' }
            ];

            const cutBounds = { top: 0, bottom: 0, left: 0, right: 1 };
            const result = processPaste(text, finalData, sortedData, columns, 0, 0, cutBounds);

            expect(result).not.toBeNull();
            expect(result?.newData).toEqual([
                { name: 'NewJohn', age: '35' } // Pasted row correctly applied
            ]);
        });

        it('如果没有有效更改则应该返回 null', () => {
            const finalData = [{ name: 'John' }];

            // All columns uneditable
            const result2 = processPaste('NewJohn', finalData, finalData, [{ editable: false, dataIndex: 'name' }], 0, 0);
            expect(result2).toBeNull();
        });
    });
});