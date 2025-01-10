from typing import List, Optional, Tuple, Dict
from pydantic import BaseModel
from .move import Move, TilePlacement

class Cell(BaseModel):
    color: str = "white"  # "white", "black", or "gray"
    piece: Optional[int] = None  # None for empty, 1 for player 1, 2 for player 2

class Board(BaseModel):
    grid: List[List[Cell]]

    def __init__(self, **data):
        if 'grid' not in data:
            data['grid'] = [[Cell() for _ in range(5)] for _ in range(5)]
            # Initialize player pieces
            for i in range(5):
                data['grid'][0][i].piece = 2  # Player 2's pieces
                data['grid'][4][i].piece = 1  # Player 1's pieces
        super().__init__(**data)

    def is_valid_position(self, position: Tuple[int, int]) -> bool:
        row, col = position
        return 0 <= row < 5 and 0 <= col < 5

    def get_cell(self, position: Tuple[int, int]) -> Optional[Cell]:
        if not self.is_valid_position(position):
            return None
        row, col = position
        return self.grid[row][col]

    def copy(self) -> 'Board':
        return Board(grid=[[Cell(**cell.dict()) for cell in row] for row in self.grid])

class GameState(BaseModel):
    board: Board
    current_player: int
    player1_tiles: Dict[str, int]  # {"black": 3, "gray": 1}
    player2_tiles: Dict[str, int]  # {"black": 3, "gray": 1}
    move_history: List[Move]  # List of moves
