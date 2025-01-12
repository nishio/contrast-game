describe('Player Movement Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
    // Select Human vs Human mode
    cy.contains('Human vs Human').click()
  })

  it('allows Player 2 to move pieces downward', () => {
    // Wait for Player 1's turn
    cy.contains('Current Player: 1')
    
    // Make a move with Player 1 (upward)
    cy.get('[data-testid="cell-4-2"]').click() // Select center piece
    cy.get('[data-testid="cell-3-2"]').click() // Move up
    
    // Wait for Player 2's turn
    cy.contains('Current Player: 2')
    
    // Make a move with Player 2 (downward)
    cy.get('[data-testid="cell-0-2"]').click() // Select center piece
    cy.get('[data-testid="cell-1-2"]').click() // Move down
    
    // Verify no error toast appears
    cy.contains('Move error').should('not.exist')
  })
})
