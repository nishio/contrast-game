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
        
        # Define possible directions based on tile color
        directions = []
        if cell.color in ["white", "gray"]:  # Orthogonal moves
            directions.extend([(0, 1), (0, -1), (1, 0), (-1, 0)])
        if cell.color in ["black", "gray"]:  # Diagonal moves
            directions.extend([(1, 1), (1, -1), (-1, 1), (-1, -1)])
            
        # Add basic moves
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            if (0 <= new_row < 5 and 0 <= new_col < 5 and 
                board.grid[new_row][new_col].piece is None):
                moves.add((new_row, new_col))
                
        # Add jumping moves
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
        
        # Define possible jump directions based on tile color
        directions = []
        if cell.color in ["white", "gray"]:  # Orthogonal jumps
            directions.extend([(0, 2), (0, -2), (2, 0), (-2, 0)])
        if cell.color in ["black", "gray"]:  # Diagonal jumps
            directions.extend([(2, 2), (2, -2), (-2, 2), (-2, -2)])
            
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            mid_row, mid_col = row + dr//2, col + dc//2
            
            if (0 <= new_row < 5 and 0 <= new_col < 5 and
                board.grid[mid_row][mid_col].piece == player and  # Jump over own piece
                board.grid[new_row][new_col].piece is None and
                (new_row, new_col) not in visited):
                
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
        legal_moves = RuleEngine.get_legal_moves(game_state)
        return move in legal_moves

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
