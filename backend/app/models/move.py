from typing import Optional, Tuple, Dict
from pydantic import BaseModel, Field

class TilePlacement(BaseModel):
    position: Tuple[int, int]
    color: str = Field(..., description="Must be 'black' or 'gray'")

    @property
    def dict_key(self) -> str:
        """Used for dictionary representation in game state."""
        return f"{self.position}:{self.color}"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TilePlacement):
            return False
        return (self.position == other.position and
                self.color == other.color)

    def __hash__(self) -> int:
        return hash((self.position, self.color))

class Move(BaseModel):
    piece_position: Tuple[int, int]
    target_position: Tuple[int, int]
    tile_placement: Optional[TilePlacement] = None
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Move):
            return False
        return (self.piece_position == other.piece_position and
                self.target_position == other.target_position and
                self.tile_placement == other.tile_placement)
    
    def __hash__(self) -> int:
        return hash((self.piece_position, self.target_position,
                    self.tile_placement.position if self.tile_placement else None,
                    self.tile_placement.color if self.tile_placement else None))
