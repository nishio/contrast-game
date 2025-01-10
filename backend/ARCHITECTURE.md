# Contrast Game Server Architecture

## System Overview
The system consists of four main components:
1. Game Server (Rule Engine)
2. AI Client Interface
3. Match Management System
4. Game State Visualizer

### Component Responsibilities

#### Game Server
- Maintains game rules and state
- Validates moves
- Manages game progression
- Handles win/loss/draw conditions

#### AI Client Interface
- Provides HTTP/WebSocket endpoints for AI clients
- Manages client authentication and rate limiting
- Handles move submissions and state updates
- Provides game state synchronization

#### Match Management System
- Organizes tournaments and matches
- Manages player pairings
- Tracks game results and statistics
- Handles tournament progression

#### Game State Visualizer
- Provides real-time game state visualization
- Displays board state and piece movements
- Shows available moves and tile placements
- Supports game replay functionality

## Data Models

### Board
```python
class Board:
    # 5x5 grid
    # Each cell contains:
    # - color: str ("white", "black", "gray")
    # - piece: Optional[Piece]
    grid: List[List[Cell]]
```

### Game State
```python
class GameState:
    board: Board
    current_player: int  # 1 or 2
    player1_tiles: Dict[str, int]  # {"black": 3, "gray": 1}
    player2_tiles: Dict[str, int]  # {"black": 3, "gray": 1}
    move_history: List[Move]
```

### Move
```python
class Move:
    piece_position: Tuple[int, int]  # Current position
    target_position: Tuple[int, int]  # Target position
    tile_placement: Optional[TilePlacement]
```

### TilePlacement
```python
class TilePlacement:
    position: Tuple[int, int]
    color: str  # "black" or "gray"
```

## API Endpoints

### Game Management
- `POST /api/games/create` - Create a new game
- `GET /api/games/{game_id}` - Get game state
- `POST /api/games/{game_id}/move` - Submit a move
- `GET /api/games/{game_id}/legal_moves` - Get legal moves for current player

### AI Client Interface
- `POST /api/register_ai` - Register a new AI client
- `GET /api/games/{game_id}/request_move` - AI client requests current game state and returns move

### Match Management
- `POST /api/tournaments/create` - Create a new tournament
- `GET /api/tournaments/{tournament_id}` - Get tournament status
- `GET /api/tournaments/{tournament_id}/matches` - Get tournament matches
- `GET /api/tournaments/{tournament_id}/results` - Get tournament results

## Game Logic Components

### Rule Engine
- Board state management
- Legal move generation
- Move validation
- Win condition checking
- Draw (千日手) detection

### Move Generator
- Generates all possible moves for a given position
- Handles piece movement rules based on tile colors
- Handles jumping rules
- Handles tile placement rules

### Game State Manager
- Manages the current state of the game
- Applies moves to the game state
- Maintains move history
- Handles player turns

## AI Client Interface

### Communication Protocol
AI clients will communicate with the server using HTTP/JSON. Each AI client must implement:

1. Receiving game state:
```json
{
    "board": [
        [{"color": "white", "piece": null}, ...],
        ...
    ],
    "current_player": 1,
    "available_tiles": {"black": 3, "gray": 1},
    "legal_moves": [
        {
            "piece_position": [0, 0],
            "target_position": [1, 0],
            "possible_tile_placements": [
                {"position": [2, 2], "color": "black"},
                {"position": [2, 2], "color": "gray"},
                null
            ]
        },
        ...
    ]
}
```

2. Returning move:
```json
{
    "piece_position": [0, 0],
    "target_position": [1, 0],
    "tile_placement": {
        "position": [2, 2],
        "color": "black"
    }
}
```

## Implementation Details

### Technology Stack
- Backend: Python 3.12 + FastAPI
- Database: In-memory (for prototype)
- API Documentation: OpenAPI/Swagger
- Testing: pytest

### Project Structure
```
backend/
├── app/
│   ├── main.py
│   ├── models/
│   │   ├── board.py
│   │   ├── game.py
│   │   └── move.py
│   ├── core/
│   │   ├── rule_engine.py
│   │   ├── move_generator.py
│   │   └── game_state.py
│   ├── api/
│   │   ├── games.py
│   │   ├── tournaments.py
│   │   └── ai_interface.py
│   └── tests/
│       ├── test_rule_engine.py
│       ├── test_move_generator.py
│       └── test_game_state.py
└── pyproject.toml
```

## Client Interface Specifications

### Communication Protocols

#### HTTP Long Polling
- Primary method for AI clients
- Endpoint: `/api/games/{game_id}/state`
- Poll interval: 1 second recommended
- Includes current state and legal moves
- Timeout: 30 seconds

#### WebSocket (Real-time)
- Used for game visualization and live updates
- Endpoint: `/ws/games/{game_id}`
- Events:
  - `game_state_update`: Board state changes
  - `move_made`: New move submitted
  - `game_over`: Game completion
  - `error`: Error notifications

### Client Implementation Guidelines

#### Required Endpoints
1. Move Submission
```http
POST /api/games/{game_id}/move
Content-Type: application/json

{
    "piece_position": [row, col],
    "target_position": [row, col],
    "tile_placement": {
        "position": [row, col],
        "color": "black"|"gray"
    }
}
```

2. Game State Query
```http
GET /api/games/{game_id}/state
Response:
{
    "board": [...],
    "current_player": 1|2,
    "legal_moves": [...],
    "remaining_tiles": {...}
}
```

#### Sample Client Structure
```python
class ContrastAIClient:
    def __init__(self, server_url: str, client_id: str):
        self.server_url = server_url
        self.client_id = client_id
        
    async def get_game_state(self, game_id: str) -> dict:
        # Implement state polling
        
    async def submit_move(self, game_id: str, move: dict) -> bool:
        # Implement move submission
        
    async def calculate_move(self, game_state: dict) -> dict:
        # Implement move calculation logic
```

## Error Handling

### Error Types
1. Game Logic Errors
   - Invalid move
   - Out of turn
   - Insufficient tiles
2. Communication Errors
   - Connection timeout
   - Server unavailable
   - Invalid response format
3. Client Errors
   - Authentication failure
   - Rate limit exceeded
   - Invalid request format

### Error Recovery
1. Move Submission Failures
   - Retry with exponential backoff
   - Maximum 3 retries
   - Fall back to new state query
2. Connection Issues
   - Automatic reconnection
   - State synchronization
   - Session recovery

## Performance Considerations

### Scalability
- Maximum concurrent games: 100 per server instance
- Client connection limit: 10 games per client
- Move processing time: < 500ms
- State update latency: < 100ms

### Resource Management
1. Memory Usage
   - Game state: ~10KB per game
   - Move history: Limited to last 100 moves
   - Client sessions: ~5KB per connection
2. Network Usage
   - State updates: ~1KB per update
   - Move submissions: ~200B per move
   - WebSocket overhead: ~50B per message

### Optimization Strategies
1. State Updates
   - Delta updates for WebSocket
   - Compressed state representation
   - Cached legal moves
2. Connection Management
   - Connection pooling
   - Keep-alive optimization
   - Request batching

## Security Considerations
- Rate limiting for AI client requests (100 requests/minute)
- Move validation to prevent illegal moves
- Tournament management access control
- API authentication for AI clients
- Request signing for move submissions
- DDoS protection
- Input sanitization

## Future Extensions
- Persistent storage for game records
- Real-time game observation via WebSocket
- AI performance analytics
- Machine learning integration capabilities
- Tournament replay system
- Client SDK packages
- Performance profiling tools
