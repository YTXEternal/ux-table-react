/**
 * 单元格编辑器组件的属性接口
 */
export interface CellEditorProps {
    /** 初始编辑值 */
    initialValue: string;
    /** 保存编辑内容的回调函数 */
    onSave: (value: string) => void;
    /** 取消编辑的回调函数 */
    onCancel: () => void;
}
