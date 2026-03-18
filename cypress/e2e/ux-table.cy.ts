describe('UxTable 组件', () => {
  beforeEach(() => {
    cy.visit('/');
    // 等待虚拟列表初始渲染完成
    cy.get('[data-testid="ux-table-header-row"]').should('exist');
  });

  describe('渲染测试', () => {
    it('应该正确渲染表头', () => {
      // 检查前几个表头内容（基于 App.tsx 的 mock 数据）
      cy.get('[data-testid="ux-table-header-cell-0"]').should('contain', '固定列');
      cy.get('[data-testid="ux-table-header-cell-1"]').should('contain', '列 1');
      cy.get('[data-testid="ux-table-header-cell-2"]').should('contain', '列 2');
    });

    it('应该正确渲染数据行', () => {
      // 检查第一行的内容
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', '数据 0-0');
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', '数据 0-1');
      
      // 检查第二行的内容
      cy.get('[data-testid="ux-table-cell-1-0"]').should('contain', '数据 1-0');
      cy.get('[data-testid="ux-table-cell-1-1"]').should('contain', '数据 1-1');
    });

    it('应该正确处理固定列样式', () => {
      // 检查左侧固定列（固定列）的 sticky 样式
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'position', 'sticky');
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'left', '0px');
      
      // 第二列应该是非固定列
      cy.get('[data-testid="ux-table-header-cell-1"]').should('have.css', 'position', 'absolute');
    });
  });

  describe('选中与聚焦测试', () => {
    it('单击单元格时应该正确选中并聚焦', () => {
      // 单击第一个单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').click();
      
      // 检查是否具有活动选中状态的 box-shadow
      // 根据实现，单选的活动单元格具有 'inset 0 0 0 2px #1890ff' 样式
      cy.get('[data-testid="ux-table-cell-0-0"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)'); // #1890ff 对应的 rgb
    });

    it('应该支持键盘方向键导航', () => {
      // 点击第一个单元格使其聚焦
      cy.get('[data-testid="ux-table-cell-0-0"]').click();
      
      // 按下向右箭头
      cy.get('body').type('{rightarrow}');
      
      // 右侧相邻的单元格应该变为激活状态
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');
        
      // 按下向下箭头
      cy.get('body').type('{downarrow}');
      
      // 下方的单元格应该变为激活状态
      cy.get('[data-testid="ux-table-cell-1-1"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');
    });
  });

  describe('编辑功能测试', () => {
    it('双击单元格应该进入编辑模式并允许保存值', () => {
      const newName = 'Edited Value';
      
      // 双击第一个单元格
      // { force: true } 确保即使被 sticky 表头部分遮挡也能点击成功
      cy.get('[data-testid="ux-table-cell-0-0"]').dblclick({ force: true });
      
      // 检查输入框是否存在并且处于焦点状态
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('exist').and('have.focus');
      
      // 输入新值并按下回车键
      cy.get('[data-testid="ux-table-cell-0-0"] input').clear({ force: true }).type(`${newName}{enter}`, { force: true });
      
      // 检查单元格内的值是否已更新
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', newName);
      
      // 输入框应该消失
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('not.exist');
    });

    it('按下 Escape 键应该取消编辑并恢复原值', () => {
      const originalName = '数据 0-0';
      
      // 双击第一个单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').dblclick({ force: true });
      
      // 输入一些内容然后按下 Escape 键
      cy.get('[data-testid="ux-table-cell-0-0"] input').clear({ force: true }).type('Cancelled Edit{esc}', { force: true });
      
      // 检查单元格内容是否保持原样
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', originalName);
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('not.exist');
    });

    it('聚焦状态下直接输入字母应该唤起编辑模式', () => {
      // 点击选中单元格
      cy.get('[data-testid="ux-table-cell-0-0"]').click({ force: true });
      
      // 直接输入 'X'
      cy.get('body').type('X');
      
      // 输入框应该出现并且值为 'X'
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('have.value', 'X');
    });
  });

  describe('排序功能测试', () => {
    it('点击表头应该对数据进行排序', () => {
      // 按第一列 (固定列) 排序
      // 初始数据顺序是 数据 0-0, 数据 1-0, 数据 2-0...
      
      // 点击表头 -> 升序 (由于已经是升序，我们连点两次测试降序)
      cy.get('[data-testid="ux-table-header-cell-0"]').click(); // 升序
      cy.get('[data-testid="ux-table-header-cell-0"]').click(); // 降序
      
      // 降序后，第一行第一列的数据肯定不再是 "数据 0-0"
      cy.get('[data-testid="ux-table-cell-0-0"]').should('not.contain', '数据 0-0');
    });
  });

  describe.skip('列宽调整测试', () => {
    it('拖拽调整手柄应该改变列宽', () => {
      // 获取第一列的初始宽度
      cy.get('[data-testid="ux-table-header-cell-0"]').invoke('width').then((initialWidth) => {
        
        // 在调整手柄上触发鼠标按下事件
        cy.get('[data-testid="ux-table-resizer-0"]')
          .trigger('mousedown', { button: 0, clientX: 100, clientY: 10, force: true })
          .trigger('mousemove', { clientX: 150, clientY: 10, force: true })
          .trigger('mouseup', { force: true });
        
        // 检查新宽度是否变大了
        cy.wait(100);
        cy.get('[data-testid="ux-table-header-cell-0"]').invoke('width').should('be.gt', initialWidth);
      });
    });
  });
});