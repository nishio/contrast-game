from typing import Dict, Optional, List
from fastapi import WebSocket
from ..models.board import GameState, Board
from ..models.move import Move
from .rule_engine import RuleEngine
import uuid

class GameManager:
    def __init__(self):
        self.games: Dict[str, GameState] = {}
        self.connections: Dict[str, List[WebSocket]] = {}
        
    def create_game(self) -> str:
        """Create a new game and return its ID."""
        game_id = str(uuid.uuid4())
        self.games[game_id] = GameState(
            board=Board(),
            current_player=1,
            player1_tiles={"black": 3, "gray": 1},
            player2_tiles={"black": 3, "gray": 1},
            move_history=[]
        )
        return game_id
        
    def get_game_state(self, game_id: str) -> Optional[GameState]:
        """Get the current state of a game."""
        return self.games.get(game_id)
        
    async def apply_move(self, game_id: str, move: Move) -> GameState:
        """Apply a move to a game and return the new state."""
        current_state = self.games[game_id]
        new_state = RuleEngine.apply_move(current_state, move)
        self.games[game_id] = new_state
        
        # Notify all connected clients about the state change
        await self._notify_state_change(game_id, new_state)
        
        return new_state
        
    async def _notify_state_change(self, game_id: str, state: GameState):
        """Notify all connected clients about a state change."""
        if game_id not in self.connections:
            return
            
        # Convert state to dict for JSON serialization
        state_dict = {
            "type": "game_state_update",
            "data": {
                "board": [[{
                    "color": cell.color,
                    "piece": cell.piece
                } for cell in row] for row in state.board.grid],
                "current_player": state.current_player,
                "available_tiles": (state.player1_tiles 
                                if state.current_player == 1 
                                else state.player2_tiles),
                "legal_moves": [{
                    "piece_position": move.piece_position,
                    "target_position": move.target_position,
                    "possible_tile_placements": [
                        {"position": cell, "color": color}
                        for cell in RuleEngine._get_empty_cells(state.board)
                        for color in ["black", "gray"]
                        if (state.player1_tiles if state.current_player == 1 
                            else state.player2_tiles)[color] > 0
                    ] + [None]
                } for move in RuleEngine.get_legal_moves(state)]
            }
        }
        
        # Notify all connected clients
        for connection in self.connections[game_id]:
            try:
                await connection.send_json(state_dict)
            except:
                # Remove failed connections
                self.remove_connection(game_id, connection)
                
    def register_connection(self, game_id: str, websocket: WebSocket):
        """Register a new WebSocket connection for a game."""
        if game_id not in self.connections:
            self.connections[game_id] = []
        self.connections[game_id].append(websocket)
        
    def remove_connection(self, game_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if game_id in self.connections:
            self.connections[game_id].remove(websocket)
            if not self.connections[game_id]:
                del self.connections[game_id]
