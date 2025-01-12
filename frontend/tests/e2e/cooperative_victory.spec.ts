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
    // Verify initial board setup matches Japanese scenario:
    // Player 1 starts at row 1 (index 0), Player 2 at row 5 (index 4)
    expect(initialState.board[0][2].piece).toBe(1); // Player 1 at row 1 (index 0)
    expect(initialState.board[4][2].piece).toBe(2); // Player 2 at row 5 (index 4)
    expect(initialState.board[0][2].color).toBe('white'); // All tiles start white
    expect(initialState.board[4][2].color).toBe('white'); // All tiles start white

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

    // Move 1: Player 1 moves (1,3) → (2,3) on white tile
    let state = await makeMove({
      piece_position: [0, 2],  // Player 1 at (1,3) -> [0,2]
      target_position: [1, 2], // Move to (2,3) -> [1,2]
      tile_placement: null     // No tile placement
    });
    expect(state.board[1][2].piece).toBe(1);
    expect(state.board[1][2].color).toBe('white'); // Verify moving on white tile

    // Move 2: Player 2 moves (5,3) → (4,3) and places black tile at (3,3)
    state = await makeMove({
      piece_position: [4, 2],  // Player 2 at (5,3) -> [4,2]
      target_position: [3, 2], // Move to (4,3) -> [3,2]
      tile_placement: {
        position: [2, 2],      // Place black tile at (3,3) -> [2,2]
        color: 'black'         // Black tile enables diagonal movement
      }
    });
    expect(state.board[3][2].piece).toBe(2);
    expect(state.board[2][2].color).toBe('black');

    // Move 3: Player 1 moves (2,3) → (3,3) onto black tile
    state = await makeMove({
      piece_position: [1, 2],  // From (2,3) -> [1,2]
      target_position: [2, 2], // Move to (3,3) -> [2,2] black tile
      tile_placement: null     // No tile placement
    });
    expect(state.board[2][2].piece).toBe(1);
    expect(state.board[2][2].color).toBe('black'); // Verify on black tile

    // Move 4: Player 2 moves (4,3) → (4,2) and places gray tile at (4,4)
    state = await makeMove({
      piece_position: [3, 2],  // From (4,3) -> [3,2]
      target_position: [3, 1], // Move to (4,2) -> [3,1]
      tile_placement: {
        position: [3, 3],      // Place gray tile at (4,4) -> [3,3]
        color: 'gray'          // Gray tile enables all-direction movement
      }
    });
    expect(state.board[3][1].piece).toBe(2);
    expect(state.board[3][3].color).toBe('gray');

    // Move 5: Player 1 moves (3,3) → (4,4) diagonally from black to gray tile
    state = await makeMove({
      piece_position: [2, 2],  // From (3,3) black tile -> [2,2]
      target_position: [3, 3], // Move to (4,4) gray tile -> [3,3]
      tile_placement: null     // No tile placement
    });
    expect(state.board[3][3].piece).toBe(1);
    expect(state.board[3][3].color).toBe('gray'); // Verify on gray tile

    // Move 6: Player 2 moves (4,2) → (3,2) to clear path
    state = await makeMove({
      piece_position: [3, 1],  // From (4,2) -> [3,1]
      target_position: [2, 1], // Move to (3,2) -> [2,1]
      tile_placement: null     // No tile placement (optional)
    });
    expect(state.board[2][1].piece).toBe(2);

    // Move 7: Player 1 moves (4,4) → (5,3) for victory
    state = await makeMove({
      piece_position: [3, 3],  // From (4,4) gray tile -> [3,3]
      target_position: [4, 2], // Move to (5,3) -> [4,2] for victory
      tile_placement: null     // No tile placement
    });
    expect(state.board[4][2].piece).toBe(1); // Verify piece reached row 5 (index 4)
    expect(state.winner).toBe('1'); // Verify Player 1 victory
    expect(state.winner).toBe('1'); // Verify Player 1 victory

    ws.close();
  });
});
