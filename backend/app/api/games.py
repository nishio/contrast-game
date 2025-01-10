from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict
from ..models.move import Move, TilePlacement
from ..models.board import GameState
from ..core.rule_engine import RuleEngine
from ..core.game_manager import GameManager

router = APIRouter(prefix="/api/games", tags=["games"])
game_manager = GameManager()

@router.post("/create")
async def create_game():
    """Create a new game and return its ID."""
    game_id = game_manager.create_game()
    return {"game_id": game_id}

@router.get("/{game_id}")
async def get_game_state(game_id: str) -> dict:
    """Get the current state of a game."""
    game_state = game_manager.get_game_state(game_id)
    if game_state is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        "board": [[{
            "color": cell.color,
            "piece": cell.piece
        } for cell in row] for row in game_state.board.grid],
        "current_player": game_state.current_player,
        "available_tiles": (game_state.player1_tiles 
                          if game_state.current_player == 1 
                          else game_state.player2_tiles),
        "legal_moves": RuleEngine.get_legal_moves(game_state)
    }

@router.post("/{game_id}/move")
async def submit_move(game_id: str, move: Move):
    """Submit a move for the current player."""
    game_state = game_manager.get_game_state(game_id)
    if game_state is None:
        raise HTTPException(status_code=404, detail="Game not found")
        
    if not RuleEngine.validate_move(game_state, move):
        raise HTTPException(status_code=400, detail="Invalid move")
        
    new_state = await game_manager.apply_move(game_id, move)
    winner = RuleEngine.check_win_condition(new_state)
    
    response = {
        "status": "success",
        "game_state": {
            "board": [[{
                "color": cell.color,
                "piece": cell.piece
            } for cell in row] for row in new_state.board.grid],
            "current_player": new_state.current_player,
            "available_tiles": (new_state.player1_tiles 
                            if new_state.current_player == 1 
                            else new_state.player2_tiles)
        }
    }
    if winner:
        response["winner"] = str(winner)
    if RuleEngine.check_repetition(new_state):
        response["repetition"] = "true"
    return response

@router.get("/{game_id}/legal_moves")
async def get_legal_moves(game_id: str):
    """Get all legal moves for the current player."""
    game_state = game_manager.get_game_state(game_id)
    if game_state is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {
        "legal_moves": RuleEngine.get_legal_moves(game_state)
    }

@router.websocket("/{game_id}/ws")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    """WebSocket endpoint for real-time game updates."""
    await websocket.accept()
    try:
        # Register this connection for game updates
        game_manager.register_connection(game_id, websocket)
        
        while True:
            # Wait for messages (can be used for chat or other features)
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(f"Message text was: {data}")
            
    except WebSocketDisconnect:
        game_manager.remove_connection(game_id, websocket)
