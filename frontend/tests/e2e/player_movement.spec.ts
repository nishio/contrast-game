import { test, expect } from '@playwright/test';
import WebSocket from 'ws';

test.describe('Player Movement Tests', () => {
  test('allows Player 2 to move pieces downward', async () => {
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

    // Make Player 1's move (upward)
    const player1Move = {
      type: 'move',
      data: {
        piece_position: [4, 2],
        target_position: [3, 2],
        tile_placement: null
      }
    };
    ws.send(JSON.stringify(player1Move));

    // Wait for move response and new state
    const player1MoveResult = await new Promise((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'move_response') {
          resolve(message);
        }
      });
    });

    expect(player1MoveResult.status).toBe('success');

    // Make Player 2's move (downward)
    const player2Move = {
      type: 'move',
      data: {
        piece_position: [0, 2],
        target_position: [1, 2],
        tile_placement: null
      }
    };
    ws.send(JSON.stringify(player2Move));

    // Wait for move response
    const player2MoveResult = await new Promise((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'move_response') {
          resolve(message);
        }
      });
    });

    expect(player2MoveResult.status).toBe('success');
    expect(player2MoveResult.data.board[1][2].piece).toBe(2);

    ws.close();
  });
});
