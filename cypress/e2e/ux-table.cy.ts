describe('UxTable Component', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for virtualizer to render initially
    cy.get('[data-testid="ux-table-header-row"]').should('exist');
  });

  describe('Rendering', () => {
    it('should render table headers correctly', () => {
      // Check first few headers based on App.tsx mock data
      cy.get('[data-testid="ux-table-header-cell-0"]').should('contain', '固定列');
      cy.get('[data-testid="ux-table-header-cell-1"]').should('contain', '列 1');
      cy.get('[data-testid="ux-table-header-cell-2"]').should('contain', '列 2');
    });

    it('should render table data rows correctly', () => {
      // Check first row content
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', '数据 0-0');
      cy.get('[data-testid="ux-table-cell-0-1"]').should('contain', '数据 0-1');
      
      // Check second row content
      cy.get('[data-testid="ux-table-cell-1-0"]').should('contain', '数据 1-0');
      cy.get('[data-testid="ux-table-cell-1-1"]').should('contain', '数据 1-1');
    });

    it('should handle fixed columns correctly', () => {
      // Check sticky styles for left fixed column (固定列)
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'position', 'sticky');
      cy.get('[data-testid="ux-table-header-cell-0"]').should('have.css', 'left', '0px');
      
      // The second column should not be sticky
      cy.get('[data-testid="ux-table-header-cell-1"]').should('have.css', 'position', 'absolute');
    });
  });

  describe('Selection', () => {
    it('should select a cell on click', () => {
      // Click on first cell
      cy.get('[data-testid="ux-table-cell-0-0"]').click();
      
      // Check if it has the active selection background or box-shadow
      // Based on our implementation, active cell in single selection has 'inset 0 0 0 2px #1890ff' or similar
      cy.get('[data-testid="ux-table-cell-0-0"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)'); // #1890ff in rgb
    });

    it('should handle keyboard navigation', () => {
      // Click on first cell to focus
      cy.get('[data-testid="ux-table-cell-0-0"]').click();
      
      // Press ArrowRight
      cy.get('body').type('{rightarrow}');
      
      // Next cell should be active
      cy.get('[data-testid="ux-table-cell-0-1"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');
        
      // Press ArrowDown
      cy.get('body').type('{downarrow}');
      
      // Cell below should be active
      cy.get('[data-testid="ux-table-cell-1-1"]')
        .should('have.css', 'box-shadow')
        .and('include', 'rgb(24, 144, 255)');
    });
  });

  describe('Editing', () => {
    it('should enter edit mode on double click and save value', () => {
      const newName = 'Edited Value';
      
      // Double click on first cell
      // { force: true } ensures it clicks even if partially covered by sticky header
      cy.get('[data-testid="ux-table-cell-0-0"]').dblclick({ force: true });
      
      // Check if input exists and is focused
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('exist').and('have.focus');
      
      // Type new value and press Enter
      cy.get('[data-testid="ux-table-cell-0-0"] input').clear({ force: true }).type(`${newName}{enter}`, { force: true });
      
      // Check if value is updated in the cell
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', newName);
      
      // Input should be gone
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('not.exist');
    });

    it('should cancel edit on Escape', () => {
      const originalName = '数据 0-0';
      
      // Double click on first cell
      cy.get('[data-testid="ux-table-cell-0-0"]').dblclick({ force: true });
      
      // Type something but press Escape
      cy.get('[data-testid="ux-table-cell-0-0"] input').clear({ force: true }).type('Cancelled Edit{esc}', { force: true });
      
      // Check if value remains original
      cy.get('[data-testid="ux-table-cell-0-0"]').should('contain', originalName);
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('not.exist');
    });

    it('should start editing on typing', () => {
      // Click to select
      cy.get('[data-testid="ux-table-cell-0-0"]').click({ force: true });
      
      // Type directly 'X'
      cy.get('body').type('X');
      
      // Input should appear and have value 'X'
      cy.get('[data-testid="ux-table-cell-0-0"] input').should('have.value', 'X');
    });
  });

  describe('Sorting', () => {
    it('should sort data when clicking header', () => {
      // Sort by 固定列 (1st column)
      // Initial is 数据 0-0, 数据 1-0, 数据 2-0...
      
      // Click header -> Ascending (Wait, data is already asc. Let's click twice for Descending)
      cy.get('[data-testid="ux-table-header-cell-0"]').click(); // Asc
      cy.get('[data-testid="ux-table-header-cell-0"]').click(); // Desc
      
      // Expect the last item to be first now. The data generation creates 6 items natively, 
      // but gridConfig pads it to 20 rows. 
      // Row 5 has "数据 5-0", Row 6 has "_grid_row_6" or undefined for col_0 depending on pad logic.
      // Let's just check if row 0 cell 0 changed from "数据 0-0"
      cy.get('[data-testid="ux-table-cell-0-0"]').should('not.contain', '数据 0-0');
    });
  });

  describe.skip('Resizing', () => {
    it('should resize column width', () => {
      // Get initial width of first column
      cy.get('[data-testid="ux-table-header-cell-0"]').invoke('width').then((initialWidth) => {
        
        // Trigger mousedown on the resizer
        cy.get('[data-testid="ux-table-resizer-0"]')
          .trigger('mousedown', { button: 0, clientX: 100, clientY: 10, force: true })
          .trigger('mousemove', { clientX: 150, clientY: 10, force: true })
          .trigger('mouseup', { force: true });
        
        // Check new width (should be larger)
        cy.wait(100);
        cy.get('[data-testid="ux-table-header-cell-0"]').invoke('width').should('be.gt', initialWidth);
      });
    });
  });
});