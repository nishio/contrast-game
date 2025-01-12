import pytest
from app.models.board import Board, GameState
from app.models.move import Move, TilePlacement
from app.core.rule_engine import RuleEngine

@pytest.fixture
def initial_game_state():
    """Create a fresh game state for testing."""
    return GameState(
        board=Board(),
        current_player=1,
        player1_tiles={"black": 3, "gray": 1},
        player2_tiles={"black": 3, "gray": 1},
        move_history=[]
    )

def test_initial_board_setup(initial_game_state):
    """Test that the initial board is set up correctly."""
    board = initial_game_state.board
    
    # Check player 1's pieces (bottom row)
    for col in range(5):
        assert board.grid[4][col].piece == 1
        
    # Check player 2's pieces (top row)
    for col in range(5):
        assert board.grid[0][col].piece == 2
        
    # Check middle rows are empty
    for row in range(1, 4):
        for col in range(5):
            assert board.grid[row][col].piece is None
            
    # Check all tiles are initially white
    for row in range(5):
        for col in range(5):
            assert board.grid[row][col].color == "white"

def test_basic_legal_moves(initial_game_state):
    """Test that basic legal moves are generated correctly for both players."""
    # Test Player 1's upward moves
    legal_moves = RuleEngine.get_legal_moves(initial_game_state)
    
    # Player 1 should be able to move each piece up one square
    expected_moves = set()
    for col in range(5):
        expected_moves.add((4, col, 3, col))  # from_row, from_col, to_row, to_col
        
    actual_moves = {
        (move.piece_position[0], move.piece_position[1],
         move.target_position[0], move.target_position[1])
        for move in legal_moves
    }
    
    # Check that all expected moves are in the legal moves
    for move in expected_moves:
        assert move in actual_moves
        
    # Test Player 2's downward moves
    initial_game_state.current_player = 2
    legal_moves = RuleEngine.get_legal_moves(initial_game_state)
    
    # Player 2 should be able to move each piece down one square
    expected_moves = set()
    for col in range(5):
        expected_moves.add((0, col, 1, col))  # from_row, from_col, to_row, to_col
        
    actual_moves = {
        (move.piece_position[0], move.piece_position[1],
         move.target_position[0], move.target_position[1])
        for move in legal_moves
    }
    
    # Check that all expected moves are in the legal moves
    for move in expected_moves:
        assert move in actual_moves

def test_jumping_moves(initial_game_state):
    """Test that jumping moves are generated correctly and respect player directions."""
    # Test Player 1's upward jump
    initial_game_state.board.grid[3][2].piece = 1  # Place piece that will jump
    initial_game_state.board.grid[4][2].piece = None  # Remove the original piece
    initial_game_state.board.grid[2][2].piece = 2  # Place opponent piece to jump over
    
    legal_moves = RuleEngine.get_legal_moves(initial_game_state)
    jump_moves = [
        move for move in legal_moves
        if abs(move.piece_position[0] - move.target_position[0]) > 1 or
           abs(move.piece_position[1] - move.target_position[1]) > 1
    ]
    
    # Player 1 should be able to jump upward from (3,2) to (1,2)
    assert any(
        move.piece_position == (3, 2) and move.target_position == (1, 2)
        for move in jump_moves
    )
    
    # Reset board
    initial_game_state.board = Board()
    initial_game_state.current_player = 2
    
    # Test Player 2's downward jump
    initial_game_state.board.grid[1][2].piece = 2  # Place piece that will jump
    initial_game_state.board.grid[0][2].piece = None  # Remove the original piece
    initial_game_state.board.grid[2][2].piece = 1  # Place opponent piece to jump over
    
    legal_moves = RuleEngine.get_legal_moves(initial_game_state)
    jump_moves = [
        move for move in legal_moves
        if abs(move.piece_position[0] - move.target_position[0]) > 1 or
           abs(move.piece_position[1] - move.target_position[1]) > 1
    ]
    
    # Player 2 should be able to jump downward from (1,2) to (3,2)
    assert any(
        move.piece_position == (1, 2) and move.target_position == (3, 2)
        for move in jump_moves
    )

def test_tile_placement(initial_game_state):
    """Test that tile placement rules are enforced."""
    # Make a move with tile placement
    move = Move(
        piece_position=(4, 0),
        target_position=(3, 0),
        tile_placement=TilePlacement(
            position=(2, 0),
            color="black"
        )
    )
    
    # Apply the move
    new_state = RuleEngine.apply_move(initial_game_state, move)
    
    # Check that the tile was placed
    assert new_state.board.grid[2][0].color == "black"
    # Check that the tile count was decremented
    assert new_state.player1_tiles["black"] == 2

def test_win_condition(initial_game_state):
    """Test that win conditions are detected correctly for both players."""
    # Test Player 1 win (reaching top row)
    initial_game_state.board.grid[0][0].piece = 1
    initial_game_state.board.grid[4][0].piece = None
    
    winner = RuleEngine.check_win_condition(initial_game_state)
    assert winner == 1
    
    # Reset board
    initial_game_state.board = Board()
    
    # Test Player 2 win (reaching bottom row)
    initial_game_state.board.grid[4][0].piece = 2
    initial_game_state.board.grid[0][0].piece = None
    
    winner = RuleEngine.check_win_condition(initial_game_state)
    assert winner == 2

def test_repetition_detection(initial_game_state):
    """Test that repetition (千日手) is detected correctly."""
    # Create a sequence of moves that returns to the same position
    moves = [
        Move(piece_position=(4, 0), target_position=(3, 0), tile_placement=None),
        Move(piece_position=(0, 0), target_position=(1, 0), tile_placement=None),
        Move(piece_position=(3, 0), target_position=(4, 0), tile_placement=None),
        Move(piece_position=(1, 0), target_position=(0, 0), tile_placement=None),
    ]
    
    state = initial_game_state
    # Repeat the sequence three times
    for _ in range(3):
        for move in moves:
            state = RuleEngine.apply_move(state, move)
            
    assert RuleEngine.check_repetition(state)
