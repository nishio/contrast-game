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
        "legal_moves": [{
            "piece_position": legal_move.piece_position,
            "target_position": legal_move.target_position,
            "possible_tile_placements": [
                {"position": cell, "color": color}
                for cell in RuleEngine._get_empty_cells(game_state.board)
                for color in ["black", "gray"]
                if (game_state.player1_tiles if game_state.current_player == 1 
                    else game_state.player2_tiles)[color] > 0
            ] + [None]
        } for legal_move in RuleEngine.get_legal_moves(game_state)]
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
        "type": "game_state_update",
        "data": {
            "board": [[{
                "color": cell.color,
                "piece": cell.piece
            } for cell in row] for row in new_state.board.grid],
            "current_player": new_state.current_player,
            "available_tiles": (new_state.player1_tiles 
                            if new_state.current_player == 1 
                            else new_state.player2_tiles),
            "legal_moves": [{
                "piece_position": move.piece_position,
                "target_position": move.target_position,
                "possible_tile_placements": [
                    {"position": cell, "color": color}
                    for cell in RuleEngine._get_empty_cells(new_state.board)
                    for color in ["black", "gray"]
                    if (new_state.player1_tiles if new_state.current_player == 1 
                        else new_state.player2_tiles)[color] > 0
                ] + [None]
            } for move in RuleEngine.get_legal_moves(new_state)]
        }
    }
    if winner:
        response["data"]["winner"] = str(winner)
    if RuleEngine.check_repetition(new_state):
        response["data"]["repetition"] = "true"
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
    try:
        await websocket.accept()
        game_manager.register_connection(game_id, websocket)
        
        # Send initial game state
        game_state = game_manager.get_game_state(game_id)
        if game_state:
            state_dict = {
                "type": "game_state_update",
                "data": {
                    "board": [[{
                        "color": cell.color,
                        "piece": cell.piece
                    } for cell in row] for row in game_state.board.grid],
                    "current_player": game_state.current_player,
                    "available_tiles": (game_state.player1_tiles 
                                    if game_state.current_player == 1 
                                    else game_state.player2_tiles),
                    "legal_moves": [{
                        "piece_position": move.piece_position,
                        "target_position": move.target_position,
                        "possible_tile_placements": [
                            {"position": cell, "color": color}
                            for cell in RuleEngine._get_empty_cells(game_state.board)
                            for color in ["black", "gray"]
                            if (game_state.player1_tiles if game_state.current_player == 1 
                                else game_state.player2_tiles)[color] > 0
                        ] + [None]
                    } for move in RuleEngine.get_legal_moves(game_state)]
                }
            }
            await websocket.send_json(state_dict)
        
        while True:
            try:
                data = await websocket.receive_json()
                if data.get("type") == "move":
                    move_data = data.get("data", {})
                    move = Move(**move_data)
                    # Get the current game state before validating the move
                    game_state = game_manager.get_game_state(game_id)
                    if RuleEngine.validate_move(game_state, move):
                        new_state = await game_manager.apply_move(game_id, move)
                        response = {
                            "type": "move_response",
                            "status": "success",
                            "data": {
                                "board": [[{
                                    "color": cell.color,
                                    "piece": cell.piece
                                } for cell in row] for row in new_state.board.grid],
                                "current_player": new_state.current_player,
                                "available_tiles": (new_state.player1_tiles 
                                                if new_state.current_player == 1 
                                                else new_state.player2_tiles),
                                "legal_moves": [{
                                    "piece_position": move.piece_position,
                                    "target_position": move.target_position,
                                    "possible_tile_placements": [
                                        {"position": cell, "color": color}
                                        for cell in RuleEngine._get_empty_cells(new_state.board)
                                        for color in ["black", "gray"]
                                        if (new_state.player1_tiles if new_state.current_player == 1 
                                            else new_state.player2_tiles)[color] > 0
                                    ] + [None]
                                } for move in RuleEngine.get_legal_moves(new_state)]
                            }
                        }
                        winner = RuleEngine.check_win_condition(new_state)
                        if winner:
                            response["data"]["winner"] = str(winner)
                        if RuleEngine.check_repetition(new_state):
                            response["data"]["repetition"] = "true"
                        await websocket.send_json(response)
                    else:
                        await websocket.send_json({
                            "type": "move_response",
                            "status": "error",
                            "message": "Invalid move"
                        })
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        game_manager.remove_connection(game_id, websocket)
