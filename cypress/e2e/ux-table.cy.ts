describe('UxTable 组件', () => {
  beforeEach(() => {
    cy.visit('/');
    // 等待虚拟列表初始渲染完成
    cy.get('[data-testid="ux-table-header-row"]').should('exist');
    it('应该支持拖拽选中多个单元格', () => {
      // 触发 mousedown
      cy.get('[data-testid="ux-table-cell-0-1"]').trigger('mousedown', { force: true });

      // 触发 mouseenter 到另一个单元格以扩展选区
      cy.get('[data-testid="ux-table-cell-1-2"]').trigger('mouseenter', { force: true });

      // 释放鼠标
      cy.get('[data-testid="ux-table-cell-1-2"]').trigger('mouseup', { force: true });

      // 验证选区内的单元格具有正确的背景色
      cy.get('[data-testid="ux-table-cell-0-1"]').should('have.css', 'background-color').and('include', 'rgb(255, 255, 255)'); // Active cell
      cy.get('[data-testid="ux-table-cell-0-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)'); // Selected
      cy.get('[data-testid="ux-table-cell-1-1"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)'); // Selected
      cy.get('[data-testid="ux-table-cell-1-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)'); // Selected
    });

    it('选中聚焦的情况下按键盘esc或点击Table表外会取消选中状态', () => {
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });
      cy.get('[data-testid="ux-table-cell-0-1"]').should('have.css', 'background-color').and('include', 'rgb(255, 255, 255)'); // Active

      // 点击表外
      cy.get('body').click(0, 0, { force: true });
      cy.get('[data-testid="ux-table-cell-0-1"]').should('have.css', 'background-color').and('include', 'rgb(255, 255, 255)'); // No longer active, but white background is default? Wait, let's just check selected cells or we can press Escape.

      // We need to re-select to test escape
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').click({ force: true, ctrlKey: true }); // Maybe shift click? No, drag.

      cy.get('[data-testid="ux-table-cell-0-1"]').trigger('mousedown', { force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').trigger('mouseenter', { force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').trigger('mouseup', { force: true });

      cy.get('[data-testid="ux-table-cell-0-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)'); // Selected

      cy.get('body').click(0, 0, { force: true });
      // The background color should not be the selected color anymore
      cy.get('[data-testid="ux-table-cell-0-2"]').should('not.have.css', 'background-color', 'rgb(230, 247, 255)');

      // Re-select to test ESC
      cy.get('[data-testid="ux-table-cell-0-1"]').trigger('mousedown', { force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').trigger('mouseenter', { force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').trigger('mouseup', { force: true });
      cy.get('[data-testid="ux-table-cell-0-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)');

      cy.get('.ux-table-main-scrollbar').trigger('keydown', { key: 'Escape' });
      cy.get('[data-testid="ux-table-cell-0-2"]').should('not.have.css', 'background-color', 'rgb(230, 247, 255)');
    });

    it('撤销与恢复测试', () => {
      // 在 defaultDemo.tsx 中设置了 recordNum 等属性的话
      // 我们测试一下编辑然后撤销
      cy.get('[data-testid="ux-table-cell-0-1"]').dblclick({ force: true });
      cy.get('[data-testid="ux-table-cell-0-1"] input').clear({ force: true }).type('Edited Value{enter}', { force: true });
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', 'Edited Value');

      // 撤销 (由于我们需要模拟在选中状态下按键)
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });
      cy.get('.ux-table-main-scrollbar').trigger('keydown', { key: 'z', ctrlKey: true });
      // 应该恢复为 "数据 0-1" (defaultDemo 中的初始数据)
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', '数据 0-1');

      // 恢复
      cy.get('.ux-table-main-scrollbar').trigger('keydown', { key: 'y', ctrlKey: true });
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', 'Edited Value');
    });

    it('左键列头移动时连列头也纳入选中状态', () => {
      cy.get('[data-testid="ux-table-header-cell-1"]').trigger('mousedown', { force: true, button: 0 });
      cy.get('[data-testid="ux-table-header-cell-2"]').trigger('mouseenter', { force: true });
      cy.get('[data-testid="ux-table-header-cell-2"]').trigger('mouseup', { force: true });

      cy.get('[data-testid="ux-table-header-cell-1"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)');
      cy.get('[data-testid="ux-table-header-cell-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)');
      cy.get('[data-testid="ux-table-cell-0-1"]').should('have.css', 'background-color').and('include', 'rgb(255, 255, 255)'); // First active cell
      cy.get('[data-testid="ux-table-cell-0-2"]').should('have.css', 'background-color').and('include', 'rgb(230, 247, 255)'); // Selected body cell
    });
  });

  describe('粘贴和删除操作测试', () => {
    it('应该支持粘贴数据并更新表格', () => {
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });

      // 构造要粘贴的文本 (TSV 格式)
      const pasteText = 'Pasted 1\tPasted 2\nPasted 3\tPasted 4';

      cy.get('[class*="ux-table-main"]').then($main => {
        // 创建并触发粘贴事件
        const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(pasteEvent, 'clipboardData', {
          value: { getData: () => pasteText }
        });
        $main[0].dispatchEvent(pasteEvent);
      });

      // 验证数据是否被正确更新 (等待 Worker 降级执行)
      cy.wait(100);
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain.text', 'Pasted 1');
      cy.get('[data-testid="ux-table-cell-0-2"]').should('contain.text', 'Pasted 2');
      cy.get('[data-testid="ux-table-cell-1-1"]').should('contain.text', 'Pasted 3');
      cy.get('[data-testid="ux-table-cell-1-2"]').should('contain.text', 'Pasted 4');
    });

    it('应该支持按 Delete 键删除选区内容', () => {
      // 选中单元格
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });

      // 按下 Delete
      cy.get('body').type('{del}');

      // 验证数据被清空 (等待 Worker 降级执行)
      cy.wait(100);
      // 空单元格应该不包含原来的文本
      cy.get('[data-testid="ux-table-cell-0-1"]').should('not.contain.text', 'Pasted 1');
    });
  });

  describe('渲染测试', () => {
    it('应该正确渲染表头', () => {
      // 检查前几个表头内容（基于 App.tsx 的 mock 数据）
      // 因为插入了行号列，第0列是空的（行号列头），第1列是"固定列"
      cy.get('[data-testid="ux-table-header-cell-1"]').should('contain', '列');
      cy.get('[data-testid="ux-table-header-cell-2"]').should('contain', '数字列');
      cy.get('[data-testid="ux-table-header-cell-3"]').should('contain', '列 1');
    });

    it('应该正确渲染数据行与默认行号', () => {
      // 在 demo 环境中可能没有启用 lineShow 而是传入的普通列，我们这里统一断言原本应该显示的数据
      // 因为如果没开启 lineShow，[0-0] 会是 '数据 0-0'
      cy.get('[data-testid="ux-table-cell-0-0"]').then(($el) => {
        const text = $el.text().trim();
        if (text === '1') {
          // 如果显示了行号
          cy.get('[data-testid="ux-table-cell-0-1"]').should('contain.text', '数据 0-0');
        } else {
          // 如果没有显示行号
          cy.get('[data-testid="ux-table-cell-0-0"]').should('contain.text', '数据 0-0');
        }
      });
    });

    it('应该正确处理固定列样式', () => {
      // 检查左侧固定列（固定列）的 sticky 样式
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'position', 'sticky');
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'left', '0px');

      // 第二列应该是非固定列
      cy.get('[data-testid="ux-table-header-cell-1"]').should('have.css', 'position', 'absolute');
    });
  });

  describe('无限滚动测试', () => {
    it('当滚动到底部时应该扩充行和列', () => {
      // 获取表格主体容器
      cy.get('[data-testid="ux-table-header-row"]').parent().parent().as('tableMain');

      // 初始渲染应该只有部分行（根据虚拟列表和初始配置）
      // App.tsx 中的 gridConfig 是 20x20，infinite 是 {row:10, col:5, gap:5}
      // 我们先检查是否能找到第 19 行（初始 gridConfig 的最后一行），应该找不到因为被虚拟列表隐藏
      // 然后我们滚动到底部，应该能触发扩充

      cy.get('@tableMain').scrollTo('bottom');
      // 等待扩充和虚拟列表更新
      cy.wait(500);

      // 滚动到底部后，应该扩充了 10 行，所以总行数至少是 30，索引为 29 的行应该被渲染出来
      cy.get('[data-testid="ux-table-row-29"]').should('exist');

      // 测试横向滚动
      // 横向滚动应该使用底部的滚动条
      cy.get('[class*="ux-table-scrollbar-x"]').scrollTo('right');
      cy.wait(500);

      // 初始列是 20，扩充了 5 列，所以索引 24 的列应该存在
      cy.get('[data-testid="ux-table-header-cell-24"]').should('exist');
    });
  });

  describe('行高调整测试', () => {
    it('应该能够通过拖拽调整行高', () => {
      // 获取第0行的初始高度
      cy.get('[data-testid="ux-table-row-0"]').invoke('height').then((initialHeight) => {
        // 在行高调整手柄上触发鼠标按下事件，并向下拖动
        cy.get('[data-testid="ux-table-row-resizer-0"]')
          .trigger('mousedown', { button: 0, clientY: 100, force: true })
          // 模拟在 document 上移动鼠标
          .document()
          .trigger('mousemove', { clientY: 150, force: true })
          .trigger('mouseup', { force: true });

        // 检查新高度是否变大了 (增加了约 50px)
        cy.get('[data-testid="ux-table-row-0"]').invoke('height').should('be.gt', initialHeight);
      });
    });
  });

  describe('选中与聚焦测试', () => {
    it('单击单元格时应该正确选中并聚焦', () => {
      // 单击第一个单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').click();

      // 检查是否具有活动选中状态的 box-shadow
      cy.get('[data-testid="ux-table-cell-0-0"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)'); // #1890ff 对应的 rgb
    });

    it('单击表头应该选中整列', () => {
      // 单击第一列数据列的表头 (第1列，因为第0列是行号)
      cy.get('[data-testid="ux-table-header-cell-1"]').click();

      // 第0行和第1行应该是选中状态 (背景色应变为 #e6f7ff，即 rgb(230, 247, 255))
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(230, 247, 255)');
      cy.get('[data-testid="ux-table-cell-1-1"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(230, 247, 255)');
    });

    it('单击行号应该选中整行', () => {
      // 单击第一行的行号单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').click();

      // 第0列是 active cell（背景为白），第1列（同行的其他列）应该是选中状态
      cy.get('[data-testid="ux-table-cell-0-0"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(255, 255, 255)');
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(230, 247, 255)');
    });

    it('Ctrl+A 应该全选表格', () => {
      // 先选中一个单元格
      cy.get('[data-testid="ux-table-cell-0-1"]').click();
      // 按下 Ctrl+A
      cy.get('body').type('{ctrl}a');

      // 检查其他单元格是否被选中
      cy.get('[data-testid="ux-table-cell-1-2"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(230, 247, 255)');
    });

    it('应该支持键盘方向键导航', () => {
      // 点击第一个数据单元格使其聚焦
      cy.get('[data-testid="ux-table-cell-0-1"]').click();

      // 按下向右箭头
      cy.get('body').type('{rightarrow}');

      // 右侧相邻的单元格应该变为激活状态
      cy.get('[data-testid="ux-table-cell-0-2"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');

      // 按下向下箭头
      cy.get('body').type('{downarrow}');

      // 下方的单元格应该变为激活状态
      cy.get('[data-testid="ux-table-cell-1-2"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');
    });
  });

  describe('编辑功能测试', () => {
    it('双击单元格应该进入编辑模式并允许保存值', () => {
      const newName = 'Edited Value';

      // 双击第一个数据单元格
      // { force: true } 确保即使被 sticky 表头部分遮挡也能点击成功
      cy.get('[data-testid="ux-table-cell-0-1"]').dblclick({ force: true });

      // 检查输入框是否存在并且处于焦点状态
      cy.get('[data-testid="ux-table-cell-0-1"] input').should('exist').and('have.focus');

      // 输入新值并按下回车键
      cy.get('[data-testid="ux-table-cell-0-1"] input').clear({ force: true }).type(`${newName}{enter}`, { force: true });

      // 检查单元格内的值是否已更新
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', newName);

      // 输入框应该消失
      cy.get('[data-testid="ux-table-cell-0-1"] input').should('not.exist');
    });

    it('按下 Escape 键应该取消编辑并恢复原值', () => {
      const originalName = '数据 0-0';

      // 双击数据单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').then(($el) => {
        const text = $el.text().trim();
        const testId = text === '1' ? 'ux-table-cell-0-1' : 'ux-table-cell-0-0';

        cy.get(`[data-testid="${testId}"]`).dblclick({ force: true });
        cy.get(`[data-testid="${testId}"] input`).clear({ force: true }).type('Cancelled Edit{esc}', { force: true });
        cy.get(`[data-testid="${testId}"]`).should('contain.text', originalName);
        cy.get(`[data-testid="${testId}"] input`).should('not.exist');
      });
    });

    it('聚焦状态下直接输入字母应该唤起编辑模式', () => {
      // 点击选中数据单元格
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });

      // 直接输入 'X'
      cy.get('body').type('X');

      // 输入框应该出现并且值为 'X'
      cy.get('[data-testid="ux-table-cell-0-1"] input').should('have.value', 'X');
    });
  });

  describe('排序功能测试', () => {
    it('点击排序图标应该对数据进行排序，而点击表头不应该触发排序', () => {
      cy.get('[data-testid="ux-table-cell-0-0"]').then(($el) => {
        const text = $el.text().trim();
        const colIndex = text === '1' ? 1 : 0;

        cy.get(`[data-testid="ux-table-cell-0-${colIndex}"]`).invoke('text').then((initialText) => {
          cy.get(`[data-testid="ux-table-header-cell-${colIndex}"]`).click('left');
          cy.get(`[data-testid="ux-table-cell-0-${colIndex}"]`).should('contain.text', initialText);

          cy.get(`[data-testid="ux-table-sorter-${colIndex}"]`).click({ force: true });
          cy.get(`[data-testid="ux-table-sorter-${colIndex}"]`).click({ force: true });

          cy.get(`[data-testid="ux-table-cell-0-${colIndex}"]`).should('not.have.text', initialText);
        });
      });
    });
  });

  describe('复制蚂蚁线动画测试', () => {
    it('复制单元格后应该显示蚂蚁线动画，并在操作后消失', () => {
      // 1. 选中数据单元格
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });

      // 2. 模拟按下 Ctrl+C
      cy.get('body').type('{ctrl}c');

      // 3. 验证蚂蚁线元素是否存在
      // 检查当前单元格内部是否包含具有蚂蚁线类名的 div 元素
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .find('div[class*="marching-ants"]')
        .should('have.length', 4); // 上下左右四个边

      // 4. 按下 Escape 键，蚂蚁线应该消失
      cy.get('[class*="ux-table-main"]').type('{esc}', { force: true });
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .find('div[class*="marching-ants"]')
        .should('not.exist');

      // 5. 再次复制，并测试双击进入编辑模式时蚂蚁线是否消失
      cy.get('[data-testid="ux-table-cell-0-1"]').click({ force: true });
      cy.get('body').type('{ctrl}c');
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .find('div[class*="marching-ants"]')
        .should('have.length', 4);

      cy.get('[data-testid="ux-table-cell-0-1"]').dblclick({ force: true });
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .find('div[class*="marching-ants"]')
        .should('not.exist');
    });
  });
});