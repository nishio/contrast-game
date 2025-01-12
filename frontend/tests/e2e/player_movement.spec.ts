import { test, expect } from '@playwright/test';

test.describe('Player Movement Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Select Human vs Human mode
    await page.getByText('Human vs Human').click();
  });

  test('allows Player 2 to move pieces downward', async ({ page }) => {
    // Wait for WebSocket connection and game initialization
    await page.waitForSelector('text=Current Player');
    
    // Make a move with Player 1 (upward)
    await page.locator('[data-testid="cell-4-2"]').click(); // Select center piece
    await page.waitForTimeout(500); // Wait for legal moves to appear
    await page.locator('[data-testid="cell-3-2"]').click(); // Move up
    
    // Wait for Player 2's turn
    await page.waitForSelector('text=Current Player: 2');
    
    // Make a move with Player 2 (downward)
    await page.locator('[data-testid="cell-0-2"]').click(); // Select center piece
    await page.waitForTimeout(500); // Wait for legal moves to appear
    await page.locator('[data-testid="cell-1-2"]').click(); // Move down
    
    // Verify no error toast appears
    await expect(page.getByText('Move error')).not.toBeVisible();
    
    // Additional verification that the move was successful
    await expect(page.locator('[data-testid="cell-1-2"]')).toHaveAttribute('data-piece', '2');
  });
});
