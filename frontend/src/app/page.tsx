'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Box, Grid, GridItem, Text, VStack, HStack, Button, useToast } from '@chakra-ui/react'
import { Piece } from './components/Piece'
import { GameSetupPanel, GameMode } from './components/GameSetupPanel'

interface Cell {
  color: 'white' | 'black' | 'gray'
  piece: number | null
}

interface GameState {
  board: Cell[][]
  current_player: number
  available_tiles: {
    black: number
    gray: number
  }
  legal_moves: Move[]
}

interface TilePlacement {
  position: [number, number]
  color: 'black' | 'gray'
}

interface Move {
  piece_position: [number, number]
  target_position: [number, number]
  tile_placement: TilePlacement | null
  possible_tile_placements?: (TilePlacement | null)[]
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null)
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([])
  const [selectedTileColor, setSelectedTileColor] = useState<'black' | 'gray' | null>(null)
  const [tilePlacementMode, setTilePlacementMode] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    piece_position: [number, number]
    target_position: [number, number]
  } | null>(null)
  const [gameMode, setGameMode] = useState<GameMode | null>(null)
  const wsRef = useRef<WebSocket | null>(null);
  const toast = useToast()

  useEffect(() => {
    
    const initGame = async () => {
      try {
        // Create new game
        const response = await fetch('http://localhost:8000/api/games/create', {
          method: 'POST'
        });
        const { game_id } = await response.json();
        
        // Connect to WebSocket
        const ws = new WebSocket(
          `ws://localhost:8000/api/games/${game_id}/ws`
        );
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('Connected to game server');
          toast({
            title: 'Connected to game server',
            status: 'success',
            duration: 3000,
          });
        };
        
        ws.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('Parsed data:', data);
          
          // Reset all selection states whenever we receive a message
          const resetStates = () => {
            setSelectedPiece(null);
            setLegalMoves([]);
            setSelectedTileColor(null);
            setTilePlacementMode(false);
            setPendingMove(null);
          };
          
          if (data.board) {  // Initial game state
            console.log('Setting initial game state');
            setGameState(data);
            resetStates();
          } else if (data.type === 'game_state_update') {
            console.log('Updating game state');
            setGameState(data.data);
            resetStates();
          } else if (data.type === 'move_response') {
            if (data.status === 'error') {
              toast({
                title: 'Move error',
                description: data.message,
                status: 'error',
                duration: 3000,
              });
              // Don't reset states on error so player can try again
            } else {
              // On successful move
              if (data.game_state) {
                setGameState(data.game_state);
              }
              resetStates();
              
              if (data.winner) {
                toast({
                  title: `Player ${data.winner} wins!`,
                  status: 'success',
                  duration: 5000,
                });
              }
            }
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast({
            title: 'Connection error',
            status: 'error',
            duration: 5000,
          });
        };
      } catch (error) {
        console.error('Failed to initialize game:', error);
        toast({
          title: 'Failed to create game',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        });
      }
    };

    initGame();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [])

  const handleCellClick = (row: number, col: number) => {
    if (!gameState || !wsRef.current || !gameMode) return
    
    // Check if it's AI's turn
    const isAITurn = (
      (gameMode === 'ha' && gameState.current_player === 2) ||
      (gameMode === 'ah' && gameState.current_player === 1) ||
      gameMode === 'aa'
    )
    if (isAITurn) {
      toast({
        title: 'AI思考中 / AI is thinking',
        status: 'info',
        duration: 2000,
      })
      return
    }

    // Handle tile placement mode
    if (tilePlacementMode && pendingMove && !gameState.board[row][col].piece) {
      const move: Move = {
        piece_position: pendingMove.piece_position,
        target_position: pendingMove.target_position,
        tile_placement: selectedTileColor ? {
          position: [row, col],
          color: selectedTileColor
        } : null
      }
      
      console.log('Submitting move with tile placement:', move)
      wsRef.current.send(JSON.stringify({
        type: 'move',
        data: move
      }))
      
      // Reset all states
      setTilePlacementMode(false)
      setPendingMove(null)
      setSelectedTileColor(null)
      return
    }

    // If no piece is selected and the clicked cell has a piece of the current player
    if (!selectedPiece && gameState.board[row][col].piece === gameState.current_player) {
      setSelectedPiece([row, col])
      // Find legal moves for this piece
      const moves = gameState.legal_moves.filter(
        move => move.piece_position[0] === row && move.piece_position[1] === col
      )
      setLegalMoves(moves.map(move => move.target_position))
      console.log('Legal moves:', moves)
    }
    // If a piece is selected and the clicked cell is a legal move
    else if (selectedPiece && legalMoves.some(([r, c]) => r === row && c === col)) {
      // Store the move details
      setPendingMove({
        piece_position: selectedPiece,
        target_position: [row, col]
      })
      
      // If a tile color is selected, enter tile placement mode
      if (selectedTileColor) {
        setTilePlacementMode(true)
        toast({
          title: 'Select tile placement',
          description: 'Click an empty cell to place your tile, or click a piece to cancel',
          status: 'info',
          duration: 5000,
        })
      } else {
        // If no tile color selected, submit move immediately
        const move: Move = {
          piece_position: selectedPiece,
          target_position: [row, col],
          tile_placement: null
        }
        
        console.log('Submitting move without tile:', move)
        wsRef.current.send(JSON.stringify({
          type: 'move',
          data: move
        }))
      }
      
      // Reset piece selection
      setSelectedPiece(null)
      setLegalMoves([])
    }
    // Cancel tile placement mode if clicking on a piece
    else if (tilePlacementMode && gameState.board[row][col].piece) {
      setTilePlacementMode(false)
      setPendingMove(null)
      setSelectedTileColor(null)
    }
    // Deselect if clicking elsewhere
    else {
      setSelectedPiece(null)
      setLegalMoves([])
      setSelectedTileColor(null)
      setTilePlacementMode(false)
      setPendingMove(null)
    }
  }

  const getCellColor = (cell: Cell, row: number, col: number) => {
    // Selected piece
    if (selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col) {
      return 'yellow.200'
    }
    // Legal move target
    if (legalMoves.some(([r, c]) => r === row && c === col)) {
      // Check if this is a jump move
      const isJump = selectedPiece && (
        Math.abs(selectedPiece[0] - row) > 1 ||
        Math.abs(selectedPiece[1] - col) > 1
      )
      return isJump ? 'blue.200' : 'green.200'
    }
    // Tile colors with better contrast
    switch (cell.color) {
      case 'black': return 'gray.900'
      case 'gray': return 'gray.500'
      default: return 'white'
    }
  }

  // Handle game mode selection
  const handleModeSelect = async (mode: GameMode) => {
    setGameMode(mode)
    // Initialize game after mode selection
    try {
      const response = await fetch('http://localhost:8000/api/games/create', {
        method: 'POST'
      });
      const { game_id } = await response.json();
      
      // Connect to WebSocket
      const ws = new WebSocket(`ws://localhost:8000/api/games/${game_id}/ws`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Connected to game server');
        toast({
          title: 'ゲームサーバーに接続しました / Connected to game server',
          status: 'success',
          duration: 3000,
        });
      };
      
      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        console.log('Parsed data:', data);
        
        // Reset all selection states whenever we receive a message
        const resetStates = () => {
          setSelectedPiece(null);
          setLegalMoves([]);
          setSelectedTileColor(null);
          setTilePlacementMode(false);
          setPendingMove(null);
        };
        
        if (data.board) {  // Initial game state
          console.log('Setting initial game state');
          setGameState(data);
          resetStates();
          
          // If AI goes first, trigger AI move
          if ((mode === 'ah' || mode === 'aa') && data.legal_moves && data.legal_moves.length > 0 && !aiMadeMove) {
            const randomMove = data.legal_moves[Math.floor(Math.random() * data.legal_moves.length)];
            setTimeout(() => {
              if (wsRef.current) {
                wsRef.current.send(JSON.stringify({
                  type: 'move',
                  data: randomMove
                }));
                setAiMadeMove(true);
              }
            }, 1000);
          }
        } else if (data.type === 'game_state_update') {
          console.log('Updating game state');
          setGameState(data.data);
          resetStates();
          
          // Check if it's AI's turn and hasn't moved yet
          const isAITurn = (
            (mode === 'ha' && data.data.current_player === 2) ||
            (mode === 'ah' && data.data.current_player === 1) ||
            mode === 'aa'
          )
          if (isAITurn && !aiMadeMove && data.data.legal_moves && data.data.legal_moves.length > 0) {
            const randomMove = data.data.legal_moves[Math.floor(Math.random() * data.data.legal_moves.length)];
            setTimeout(() => {
              if (wsRef.current) {
                wsRef.current.send(JSON.stringify({
                  type: 'move',
                  data: randomMove
                }));
                setAiMadeMove(true);
              }
            }, 1000);
          } else if (!isAITurn) {
            // Reset AI move flag when it's human's turn
            setAiMadeMove(false);
          }
        } else if (data.type === 'move_response') {
          if (data.status === 'error') {
            toast({
              title: 'Move error',
              description: data.message,
              status: 'error',
              duration: 3000,
            });
          } else {
            if (data.game_state) {
              setGameState(data.game_state);
            }
            resetStates();
            
            if (data.winner) {
              toast({
                title: `Player ${data.winner} wins!`,
                status: 'success',
                duration: 5000,
              });
            }
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection error',
          status: 'error',
          duration: 5000,
        });
      };
    } catch (error) {
      console.error('Failed to initialize game:', error);
      toast({
        title: 'Failed to create game',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (!gameMode) {
    return <GameSetupPanel onModeSelect={handleModeSelect} />;
  }

  if (!gameState) return <Text>Loading...</Text>

  return (
    <VStack spacing={4} p={4}>
      <Text fontSize="xl">Current Player: {gameState.current_player}</Text>
      <HStack spacing={4}>
        <Button
          colorScheme="blackAlpha"
          isDisabled={gameState.available_tiles.black === 0}
          onClick={() => setSelectedTileColor(selectedTileColor === 'black' ? null : 'black')}
          variant={selectedTileColor === 'black' ? 'solid' : 'outline'}
        >
          Black Tiles: {gameState.available_tiles.black}
        </Button>
        <Button
          colorScheme="gray"
          isDisabled={gameState.available_tiles.gray === 0}
          onClick={() => setSelectedTileColor(selectedTileColor === 'gray' ? null : 'gray')}
          variant={selectedTileColor === 'gray' ? 'solid' : 'outline'}
        >
          Gray Tiles: {gameState.available_tiles.gray}
        </Button>
      </HStack>
      <Grid templateColumns="repeat(5, 1fr)" gap={1}>
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GridItem
              key={`${rowIndex}-${colIndex}`}
              w="60px"
              h="60px"
              bg={getCellColor(cell, rowIndex, colIndex)}
              border="1px"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              data-testid={`cell-${rowIndex}-${colIndex}`}
              data-piece={cell.piece?.toString() || ''}
            >
              {cell.piece && (
                <Piece
                  piece={cell.piece}
                  tileColor={cell.color}
                />
              )}
            </GridItem>
          ))
        )}
      </Grid>
    </VStack>
  )
}
