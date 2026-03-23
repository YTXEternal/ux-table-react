import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  rules: [
    [/^scrollbar-thin$/, () => ({
      'scrollbar-width': 'thin',
      'scrollbar-color': 'rgba(0, 0, 0, 0.2) transparent'
    })],
    [/^ux-table-main-scrollbar$/, () => `
      .ux-table-main-scrollbar::-webkit-scrollbar { width: 10px; height: 0px; }
      .ux-table-main-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 5px; }
      .ux-table-main-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; border: 2px solid transparent; background-clip: padding-box; }
      .ux-table-main-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0, 0, 0, 0.4); }
      .ux-table-main-scrollbar::-webkit-scrollbar-corner { background: transparent; }
    `],
    [/^ux-table-x-scrollbar$/, () => `
      .ux-table-x-scrollbar::-webkit-scrollbar { height: 12px; }
      .ux-table-x-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 5px; }
      .ux-table-x-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; border: 2px solid transparent; background-clip: padding-box; }
      .ux-table-x-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0, 0, 0, 0.4); }
    `],
    // 蚂蚁线
    [/^marching-ants-(top|bottom|left|right)$/, ([, dir]) => {
      const gradientX = 'repeating-linear-gradient(to right, var(--ux-primary-color, #1890ff) 0, var(--ux-primary-color, #1890ff) 4px, transparent 4px, transparent 8px)';
      const gradientY = 'repeating-linear-gradient(to bottom, var(--ux-primary-color, #1890ff) 0, var(--ux-primary-color, #1890ff) 4px, transparent 4px, transparent 8px)';

      if (dir === 'top') {
        return `
          .marching-ants-top {
            position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 5;
            background: ${gradientX};
            animation: march-x 0.5s linear infinite;
          }
          @keyframes march-x { 0% { background-position: 0 0; } 100% { background-position: 8px 0; } }
        `;
      }
      if (dir === 'bottom') {
        return `
          .marching-ants-bottom {
            position: absolute; bottom: 0; left: 0; right: 0; height: 2px; z-index: 5;
            background: ${gradientX};
            animation: march-x-reverse 0.5s linear infinite;
          }
          @keyframes march-x-reverse { 0% { background-position: 0 0; } 100% { background-position: -8px 0; } }
        `;
      }
      if (dir === 'left') {
        return `
          .marching-ants-left {
            position: absolute; top: 0; bottom: 0; left: 0; width: 2px; z-index: 5;
            background: ${gradientY};
            animation: march-y-reverse 0.5s linear infinite;
          }
          @keyframes march-y-reverse { 0% { background-position: 0 0; } 100% { background-position: 0 -8px; } }
        `;
      }
      if (dir === 'right') {
        return `
          .marching-ants-right {
            position: absolute; top: 0; bottom: 0; right: 0; width: 2px; z-index: 5;
            background: ${gradientY};
            animation: march-y 0.5s linear infinite;
          }
          @keyframes march-y { 0% { background-position: 0 0; } 100% { background-position: 0 8px; } }
        `;
      }
    }]
  ],
  shortcuts: [
    // 宽高全屏/全铺满
    ['wh-full', 'w-full h-full'],
    ['wh-screen', 'w-screen h-screen'],

    // Flex 布局
    ['f-c', 'flex justify-center items-center'],
    ['f-c-c', 'flex flex-col justify-center items-center'],
    ['f-between', 'flex justify-between items-center'],
    ['f-around', 'flex justify-around items-center'],
    ['f-start', 'flex justify-start items-center'],
    ['f-end', 'flex justify-end items-center'],

    // 定位
    ['absolute-center', 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],
    ['fixed-center', 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],

    // 文本
    ['text-ellipsis', 'truncate'],

    // UxTable 样式
    ['ux-table-wrapper', 'bg-white border-b-1 border-b-[#f0f0f0] border-r-1 border-r-[#f0f0f0] box-border'],
    ['ux-table-bottom-bar', 'flex h-[24px] bg-[#fafafa] border-t-1 border-t-[#f0f0f0] items-center'],
    ['ux-table-tabs', 'flex-1 flex h-full items-end pl-[8px] gap-[2px] overflow-hidden'],
    ['ux-table-tab', 'px-[12px] h-[20px] leading-[20px] text-[12px] text-[#666] bg-[#f5f5f5] border-1 border-[#f0f0f0] border-b-none rounded-t-[4px] cursor-pointer select-none transition-colors'],
    ['ux-table-tab-active', 'bg-white text-[var(--ux-primary-color,#1890ff)] border-t-2 border-t-[var(--ux-primary-color,#1890ff)] font-medium'],
    ['ux-table-tab-hover', 'hover:bg-[#eef0f2]'],
    ['ux-table-scrollbar-x-container', 'flex-1 overflow-x-auto overflow-y-hidden h-full scrollbar-thin ux-table-x-scrollbar'],

    ['ux-table-cell-base', 'border-b-1 border-b-[#f0f0f0] border-r-1 border-r-[#f0f0f0] box-border text-ellipsis whitespace-nowrap cursor-cell flex items-center transition-all duration-150 ease-in-out'],
    ['ux-table-header-cell', 'bg-[#fafafa] px-[16px] py-[8px] select-none justify-between font-medium text-[#4b5563] text-[13px] tracking-wide'],
    ['ux-table-body-cell', 'bg-white group-hover:bg-[#f8f9fa] text-[#1f2937] text-[13px]'],
    ['ux-table-cell-selected', 'bg-[var(--ux-primary-color-bg,#e6f7ff)] group-hover:bg-[var(--ux-primary-color-bg,#e6f7ff)]'],
    ['ux-table-cell-active', 'bg-white'],
    ['ux-table-shadow-left', 'shadow-[6px_0_6px_-4px_rgba(0,0,0,0.1)]'],
    ['ux-table-shadow-right', 'shadow-[-6px_0_6px_-4px_rgba(0,0,0,0.1)]'],
    ['ux-table-selection-border', 'after:content-[""] after:absolute after:inset-0 after:shadow-[inset_var(--sel-left,0)_var(--sel-top,0)_0_0_var(--ux-primary-color,#1890ff),inset_var(--sel-right,0)_var(--sel-bottom,0)_0_0_var(--ux-primary-color,#1890ff)] after:pointer-events-none'],
    ['ux-table-cell-cut', 'opacity-50'],
  ],
})
