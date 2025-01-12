from typing import List, Optional, Tuple, Set
from ..models.board import Board, GameState, Cell
from ..models.move import Move, TilePlacement

class RuleEngine:
    @staticmethod
    def get_legal_moves(game_state: GameState) -> List[Move]:
        """Get all legal moves for the current player."""
        legal_moves = []
        current_player = game_state.current_player
        
        # Get all pieces of the current player
        for row in range(5):
            for col in range(5):
                if game_state.board.grid[row][col].piece == current_player:
                    # Get possible moves for this piece
                    piece_moves = RuleEngine._get_piece_moves(
                        game_state.board,
                        (row, col),
                        current_player
                    )
                    
                    # For each possible move, consider tile placements
                    for target in piece_moves:
                        # First, add move without tile placement
                        legal_moves.append(Move(
                            piece_position=(row, col),
                            target_position=target,
                            tile_placement=None
                        ))
                        
                        # Then add moves with possible tile placements
                        empty_cells = RuleEngine._get_empty_cells(game_state.board)
                        tiles = (game_state.player1_tiles if current_player == 1 
                               else game_state.player2_tiles)
                        
                        for cell in empty_cells:
                            if tiles["black"] > 0:
                                legal_moves.append(Move(
                                    piece_position=(row, col),
                                    target_position=target,
                                    tile_placement=TilePlacement(
                                        position=cell,
                                        color="black"
                                    )
                                ))
                            if tiles["gray"] > 0:
                                legal_moves.append(Move(
                                    piece_position=(row, col),
                                    target_position=target,
                                    tile_placement=TilePlacement(
                                        position=cell,
                                        color="gray"
                                    )
                                ))
        
        return legal_moves

    @staticmethod
    def _get_piece_moves(board: Board, position: Tuple[int, int], player: int) -> Set[Tuple[int, int]]:
        """Get all possible moves for a piece at the given position."""
        row, col = position
        cell = board.grid[row][col]
        moves = set()
        
        # For basic moves, validate based on source cell color
        directions = []
        if cell.color in ["white", "gray"]:  # Orthogonal moves
            directions.extend([(0, 1), (0, -1), (1, 0), (-1, 0)])
        if cell.color in ["black", "gray"]:  # Diagonal moves
            directions.extend([(1, 1), (1, -1), (-1, 1), (-1, -1)])
            
        # Add basic moves (with source color and direction validation)
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            # Validate movement direction based on player
            if player == 1 and new_row >= row:  # Player 1 must move upward (toward row 0)
                continue
            if player == 2 and new_row <= row:  # Player 2 must move downward (toward row 4)
                continue
            if (0 <= new_row < 5 and 0 <= new_col < 5 and 
                board.grid[new_row][new_col].piece is None):
                # For basic moves, validate destination cell color
                is_diagonal = abs(dr) == abs(dc)
                dst_color = board.grid[new_row][new_col].color
                if (is_diagonal and dst_color == "white") or (not is_diagonal and dst_color == "black"):
                    continue
                moves.add((new_row, new_col))
                
        # Add jumping moves (no source color validation)
        jumps = RuleEngine._get_jump_moves(board, position, player, set())
        moves.update(jumps)
        
        return moves

    @staticmethod
    def _get_jump_moves(board: Board, position: Tuple[int, int], player: int, 
                       visited: Set[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        """Recursively get all possible jumping moves."""
        row, col = position
        cell = board.grid[row][col]
        moves = set()
        visited.add(position)
        
        # Allow jumping in all directions regardless of source cell color
        for dr, dc in [(0, 2), (0, -2), (2, 0), (-2, 0), (2, 2), (2, -2), (-2, 2), (-2, -2)]:
            new_row, new_col = row + dr, col + dc
            mid_row, mid_col = row + dr//2, col + dc//2
            
            # Check bounds, direction, and basic jump conditions
            # Validate movement direction based on player
            if player == 1 and new_row >= row:  # Player 1 must move upward (toward row 0)
                continue
            if player == 2 and new_row >= row:  # Player 2 must move downward (toward row 4)
                continue
            if not (0 <= new_row < 5 and 0 <= new_col < 5):
                continue
                
            # Must jump over any piece (not just own pieces) and land on empty cell
            if (board.grid[mid_row][mid_col].piece is None or  # Must jump over a piece
                board.grid[new_row][new_col].piece is not None or  # Must land on empty cell
                (new_row, new_col) in visited):  # No revisiting positions
                continue
                
            # Only validate destination cell color for jumps
            is_diagonal = abs(dr) == abs(dc)
            dst_color = board.grid[new_row][new_col].color
            
            # For jumps: orthogonal jumps can't land on black, diagonal jumps can't land on white
            if (not is_diagonal and dst_color == "black") or (is_diagonal and dst_color == "white"):
                continue
                
            # Move is valid, add it and check for further jumps
            moves.add((new_row, new_col))
            # Recursively find more jumps from the new position
            next_jumps = RuleEngine._get_jump_moves(
                board, (new_row, new_col), player, visited.copy()
            )
            moves.update(next_jumps)
                
        return moves

    @staticmethod
    def _get_empty_cells(board: Board) -> List[Tuple[int, int]]:
        """Get all empty cells on the board."""
        empty_cells = []
        for row in range(5):
            for col in range(5):
                if board.grid[row][col].piece is None:
                    empty_cells.append((row, col))
        return empty_cells

    @staticmethod
    def validate_move(game_state: GameState, move: Move) -> bool:
        """Validate if a move is legal."""
        # First check if the move is in the list of legal moves
        legal_moves = RuleEngine.get_legal_moves(game_state)
        if move not in legal_moves:
            return False
            
        # Additional validation: Cannot place a tile under the newly moved piece
        if move.tile_placement:
            target_row, target_col = move.target_position
            tile_row, tile_col = move.tile_placement.position
            if target_row == tile_row and target_col == tile_col:
                return False
                
        return True

    @staticmethod
    def apply_move(game_state: GameState, move: Move) -> GameState:
        """Apply a move to the game state and return the new state."""
        # Create a new game state
        new_state = GameState(
            board=Board(),
            current_player=3 - game_state.current_player,  # Switch player
            player1_tiles=dict(game_state.player1_tiles),
            player2_tiles=dict(game_state.player2_tiles),
            move_history=game_state.move_history + [move]
        )
        
        # Copy the board state
        for row in range(5):
            for col in range(5):
                new_state.board.grid[row][col] = Cell(
                    color=game_state.board.grid[row][col].color,
                    piece=game_state.board.grid[row][col].piece
                )
        
        # Move the piece
        old_row, old_col = move.piece_position
        new_row, new_col = move.target_position
        piece = new_state.board.grid[old_row][old_col].piece
        new_state.board.grid[old_row][old_col].piece = None
        new_state.board.grid[new_row][new_col].piece = piece
        
        # Place tile if specified
        if move.tile_placement:
            row, col = move.tile_placement.position
            new_state.board.grid[row][col].color = move.tile_placement.color
            # Update tile inventory
            tiles = (new_state.player1_tiles if game_state.current_player == 1 
                    else new_state.player2_tiles)
            tiles[move.tile_placement.color] -= 1
        
        return new_state

    @staticmethod
    def check_win_condition(game_state: GameState) -> Optional[int]:
        """Check if there's a winner. Returns player number or None."""
        # Check if any player 1 piece reached the top row
        for col in range(5):
            if game_state.board.grid[0][col].piece == 1:
                return 1
                
        # Check if any player 2 piece reached the bottom row
        for col in range(5):
            if game_state.board.grid[4][col].piece == 2:
                return 2
                
        # Check if any player has no legal moves
        if not RuleEngine.get_legal_moves(game_state):
            return 3 - game_state.current_player  # Other player wins
            
        return None

    @staticmethod
    def check_repetition(game_state: GameState) -> bool:
        """Check if the current position has been repeated (千日手)."""
        if len(game_state.move_history) < 8:  # Need at least 8 moves for repetition
            return False
            
        # Create a board state representation for comparison
        def get_board_state(board: Board) -> str:
            return "".join(
                f"{cell.color[0]}{cell.piece or '0'}"
                for row in board.grid
                for cell in row
            )
            
        current_state = get_board_state(game_state.board)
        state_count = 1
        
        # Check previous positions by reconstructing each past state
        past_state = GameState(
            board=Board(),
            current_player=1,
            player1_tiles={"black": 3, "gray": 1},
            player2_tiles={"black": 3, "gray": 1},
            move_history=[]
        )
        
        # Replay all moves up to current position
        for move in game_state.move_history[:-1]:  # Exclude current move
            past_board_state = get_board_state(past_state.board)
            if past_board_state == current_state:
                state_count += 1
                if state_count >= 3:
                    return True
            past_state = RuleEngine.apply_move(past_state, move)
                
        return False
