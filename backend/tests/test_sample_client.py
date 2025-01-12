import pytest
from app.sample_client.random_player import Move, TilePlacement

def test_game_client(test_client):
    """Test that the game API endpoints work correctly."""
    # Create a new game
    response = test_client.post("/api/games/create")
    assert response.status_code == 200
    game_id = response.json()["game_id"]
    assert game_id is not None
    
    # Get initial game state
    response = test_client.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    state = response.json()
    assert state["current_player"] == 1
    assert len(state["legal_moves"]) > 0
    
    # Make a move using first legal move
    move = state["legal_moves"][0]
    response = test_client.post(f"/api/games/{game_id}/move", json=move)
    assert response.status_code == 200
    result = response.json()
    assert result["type"] == "game_state_update"
    assert "data" in result
    assert "board" in result["data"]
    assert "current_player" in result["data"]
    assert "legal_moves" in result["data"]

def test_move_format():
    """Test that moves follow the expected format."""
    move = Move(
        piece_position=(4, 0),
        target_position=(3, 0),
        tile_placement=TilePlacement(
            position=(2, 0),
            color="black"
        )
    )
    
    assert isinstance(move, Move)
    assert move.piece_position == (4, 0)
    assert move.target_position == (3, 0)
    assert isinstance(move.tile_placement, TilePlacement)
    assert move.tile_placement.position == (2, 0)
    assert move.tile_placement.color == "black"
