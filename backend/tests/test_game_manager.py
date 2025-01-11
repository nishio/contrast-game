import pytest
from fastapi import WebSocket
from app.core.game_manager import GameManager
from app.models.move import Move, TilePlacement

class MockWebSocket:
    """Mock WebSocket for testing."""
    def __init__(self):
        self.sent_messages = []
        
    async def send_json(self, data):
        self.sent_messages.append(data)

@pytest.fixture
def game_manager():
    """Create a fresh game manager for testing."""
    return GameManager()

@pytest.mark.asyncio
async def test_create_game(game_manager):
    """Test game creation."""
    game_id = game_manager.create_game()
    assert game_id in game_manager.games
    assert game_manager.games[game_id].current_player == 1

@pytest.mark.asyncio
async def test_apply_move(game_manager):
    """Test move application and WebSocket notifications."""
    game_id = game_manager.create_game()
    ws = MockWebSocket()
    game_manager.register_connection(game_id, ws)
    
    move = Move(
        piece_position=(4, 0),
        target_position=(3, 0),
        tile_placement=None
    )
    
    new_state = await game_manager.apply_move(game_id, move)
    assert new_state.current_player == 2  # Player should have changed
    assert len(ws.sent_messages) > 0  # WebSocket should have received update

@pytest.mark.asyncio
async def test_websocket_connections(game_manager):
    """Test WebSocket connection management."""
    game_id = game_manager.create_game()
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    
    game_manager.register_connection(game_id, ws1)
    game_manager.register_connection(game_id, ws2)
    assert len(game_manager.connections[game_id]) == 2
    
    game_manager.remove_connection(game_id, ws1)
    assert len(game_manager.connections[game_id]) == 1
    assert ws2 in game_manager.connections[game_id]
