import { test, expect } from '@playwright/test';
import fetch from 'node-fetch';

test.describe('Player Movement Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for backend to be ready
    let backendReady = false;
    while (!backendReady) {
      try {
        const response = await fetch('http://localhost:8000/api/games/create');
        if (response.ok) {
          backendReady = true;
        }
      } catch (e) {
        console.log('Waiting for backend server...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Navigate to frontend
    await page.goto('http://localhost:3000');
  });

  test('allows Player 2 to move pieces downward', async ({ page }) => {
    // Add debug logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    // Wait for game setup panel and select Human vs Human mode
    await page.waitForSelector('button:has-text("Human vs Human"), button:has-text("人間 vs 人間")');
    const button = await page.locator('button:has-text("Human vs Human"), button:has-text("人間 vs 人間")').first();
    await button.click();

    // Wait for WebSocket connection success toast
    await page.waitForSelector('text=/Connected to game server|ゲームサーバーに接続しました/');
    
    // Wait for initial game state
    await page.waitForSelector('[data-testid="cell-4-2"]');
    
    // Make a move with Player 1 (upward)
    await page.click('[data-testid="cell-4-2"]'); // Select center piece
    await page.waitForTimeout(1000); // Wait for legal moves to appear
    await page.click('[data-testid="cell-3-2"]'); // Move up
    
    // Wait for Player 2's turn
    await page.waitForSelector('text=/Current Player: 2|プレイヤー2のターン/');
    
    // Make a move with Player 2 (downward)
    await page.click('[data-testid="cell-0-2"]'); // Select center piece
    await page.waitForTimeout(1000); // Wait for legal moves to appear
    await page.click('[data-testid="cell-1-2"]'); // Move down
    
    // Wait to ensure move is processed
    await page.waitForTimeout(1000);
    
    // Verify no error toast appears
    await expect(page.getByText(/Move error|移動エラー/)).not.toBeVisible();
    
    // Additional verification that the move was successful
    const cell = await page.locator('[data-testid="cell-1-2"]');
    await expect(cell).toHaveAttribute('data-piece', '2');
  });
});
