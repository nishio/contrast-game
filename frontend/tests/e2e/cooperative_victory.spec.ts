import { test, expect } from '@playwright/test';
import WebSocket from 'ws';

test.describe('Cooperative Victory Scenario', () => {
  test('demonstrates Player 1 victory through cooperative play', async () => {
    // Create a new game
    const createResponse = await fetch('http://localhost:8000/api/games/create', {
      method: 'POST'
    });
    const { game_id } = await createResponse.json();
    expect(game_id).toBeTruthy();

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/api/games/${game_id}/ws`);
    
    // Wait for connection and initial state
    const initialState = await new Promise((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'game_state_update') {
          resolve(message.data);
        }
      });
    });

    expect(initialState.current_player).toBe(1);
    // Verify initial board setup
    expect(initialState.board[4][3].piece).toBe(1); // Player 1 starts at bottom row (row 5 -> index 4)
    expect(initialState.board[0][3].piece).toBe(2); // Player 2 starts at top row (row 1 -> index 0)
    expect(initialState.board[4][3].color).toBe('white'); // All tiles start white

    // Helper function to make a move and wait for response
    const makeMove = async (move) => {
      ws.send(JSON.stringify({
        type: 'move',
        data: move
      }));

      const result = await new Promise((resolve) => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'move_response') {
            resolve(message);
          }
        });
      });

      expect(result.status).toBe('success');
      return result.data;
    };

    // Move 1: Player 1 moves (4,3) → (3,3)
    let state = await makeMove({
      piece_position: [4, 3],  // Player 1 starts at bottom row
      target_position: [3, 3], // Move up one space (white tile)
      tile_placement: null
    });
    expect(state.board[3][3].piece).toBe(1);
    expect(state.board[3][3].color).toBe('white'); // Verify moving on white tile

    // Move 2: Player 2 moves (0,3) → (1,3) and places black tile at (2,3)
    state = await makeMove({
      piece_position: [0, 3],  // Player 2 starts at top row
      target_position: [1, 3], // Move down one space
      tile_placement: {
        position: [2, 3],      // Place black tile for diagonal movement
        color: 'black'
      }
    });
    expect(state.board[1][3].piece).toBe(2);
    expect(state.board[2][3].color).toBe('black');

    // Move 3: Player 1 moves (3,3) → (2,3) onto black tile
    state = await makeMove({
      piece_position: [3, 3],  // From previous position
      target_position: [2, 3], // Move to black tile
      tile_placement: null
    });
    expect(state.board[2][3].piece).toBe(1);
    expect(state.board[2][3].color).toBe('black'); // Verify on black tile

    // Move 4: Player 2 moves (1,3) → (1,2) and places gray tile at (3,4)
    state = await makeMove({
      piece_position: [1, 3],  // From previous position
      target_position: [1, 2], // Move aside
      tile_placement: {
        position: [3, 4],      // Place gray tile for next move
        color: 'gray'
      }
    });
    expect(state.board[1][2].piece).toBe(2);
    expect(state.board[3][4].color).toBe('gray');

    // Move 5: Player 1 moves diagonally (2,3) → (3,4) from black to gray tile
    state = await makeMove({
      piece_position: [2, 3],  // From black tile
      target_position: [3, 4], // Move diagonally to gray tile
      tile_placement: null
    });
    expect(state.board[3][4].piece).toBe(1);
    expect(state.board[3][4].color).toBe('gray'); // Verify on gray tile

    // Move 6: Player 2 moves (1,2) → (2,2) to clear path
    state = await makeMove({
      piece_position: [1, 2],  // From previous position
      target_position: [2, 2], // Move down and away
      tile_placement: null
    });
    expect(state.board[2][2].piece).toBe(2);

    // Move 7: Player 1 moves (3,4) → (4,3) for victory
    state = await makeMove({
      piece_position: [3, 4],  // From gray tile
      target_position: [4, 3], // Move to bottom row for victory
      tile_placement: null
    });
    expect(state.board[4][3].piece).toBe(1); // Verify piece reached bottom row
    expect(state.winner).toBe('1'); // Verify Player 1 victory

    ws.close();
  });
});
