import pytest
import asyncio
from app.sample_client.random_player import GameClient, RandomPlayer, Move, TilePlacement

@pytest.mark.asyncio
async def test_game_client():
    """Test that the sample AI client can play a complete game."""
    client = GameClient()
    player = RandomPlayer(client)
    
    # Create a new game
    game_id = await client.create_game()
    assert game_id is not None
    
    # Get initial game state
    state = await client.get_game_state(game_id)
    assert state["current_player"] == 1
    assert len(state["legal_moves"]) > 0
    
    # Make a move
    move = player.select_random_move(state["legal_moves"])
    result = await client.submit_move(game_id, move)
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_random_move_selection():
    """Test that the random player selects valid moves."""
    client = GameClient()
    player = RandomPlayer(client)
    
    legal_moves = [
        {
            "piece_position": [4, 0],
            "target_position": [3, 0],
            "possible_tile_placements": [
                {"position": [2, 0], "color": "black"},
                {"position": [2, 0], "color": "gray"},
                None
            ]
        }
    ]
    
    move = player.select_random_move(legal_moves)
    assert isinstance(move, Move)
    assert move.piece_position == (4, 0)
    assert move.target_position == (3, 0)
    if move.tile_placement:
        assert isinstance(move.tile_placement, TilePlacement)
