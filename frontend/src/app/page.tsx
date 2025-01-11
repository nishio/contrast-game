'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Box, Grid, GridItem, Text, VStack, HStack, Button, useToast } from '@chakra-ui/react'
import { Piece } from './components/Piece'

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
  const wsRef = useRef<WebSocket | null>(null);
  const toast = useToast()

  useEffect(() => {
    
    const initGame = async () => {
      try {
        // Create new game
        const auth = btoa('user:6e8e0788d1db10c09bd5b1e68e4750e3');
        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + auth);
        
        const response = await fetch('https://contrast-game-server-tunnel-mdn1uzql.devinapps.com/api/games/create', {
          method: 'POST',
          headers: headers
        });
        const { game_id } = await response.json();
        
        // Connect to WebSocket with auth in query parameter
        const ws = new WebSocket(
          `wss://contrast-game-server-tunnel-mdn1uzql.devinapps.com/api/games/${game_id}/ws?auth=${encodeURIComponent(auth)}`
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
          
          if (data.board) {  // Initial game state doesn't have type
            console.log('Setting initial game state');
            setGameState(data);
            setSelectedPiece(null);
            setLegalMoves([]);
            setSelectedTileColor(null);
          } else if (data.type === 'game_state_update') {
            console.log('Updating game state');
            setGameState(data.data);
            // Reset selections when state updates
            setSelectedPiece(null);
            setLegalMoves([]);
            setSelectedTileColor(null);
          } else if (data.type === 'move_response') {
            if (data.status === 'error') {
              toast({
                title: 'Move error',
                description: data.message,
                status: 'error',
                duration: 3000,
              });
            } else if (data.winner) {
              toast({
                title: `Player ${data.winner} wins!`,
                status: 'success',
                duration: 5000,
              });
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
    if (!gameState || !wsRef.current) return

    // If no piece is selected and the clicked cell has a piece of the current player
    if (!selectedPiece && gameState.board[row][col].piece === gameState.current_player) {
      setSelectedPiece([row, col])
      // Find legal moves for this piece
      const moves = gameState.legal_moves.filter(
        move => move.piece_position[0] === row && move.piece_position[1] === col
      )
      setLegalMoves(moves.map(move => move.target_position))
      console.log('Legal moves:', moves)  // Debug log
    }
    // If a piece is selected and the clicked cell is a legal move
    else if (selectedPiece && legalMoves.some(([r, c]) => r === row && c === col)) {
      // Find the specific move that matches our selection
      const selectedMove = gameState.legal_moves.find(
        move => move.piece_position[0] === selectedPiece[0] &&
               move.piece_position[1] === selectedPiece[1] &&
               move.target_position[0] === row &&
               move.target_position[1] === col
      )
      
      if (!selectedMove) {
        console.error('Move not found in legal moves')
        return
      }

      // If a tile color is selected, find a matching tile placement
      let tilePlacement: TilePlacement | null = null
      if (selectedTileColor && selectedMove.possible_tile_placements) {
        const foundPlacement = selectedMove.possible_tile_placements.find(
          placement => placement && placement.color === selectedTileColor
        )
        if (foundPlacement) {
          tilePlacement = foundPlacement
        }
      }
      
      // Submit move through WebSocket
      const move: Move = {
        piece_position: selectedPiece,
        target_position: [row, col],
        tile_placement: tilePlacement,
        possible_tile_placements: selectedMove.possible_tile_placements
      }
      
      console.log('Submitting move:', move)  // Debug log
      wsRef.current.send(JSON.stringify({
        type: 'move',
        data: move
      }))
      
      setSelectedPiece(null)
      setLegalMoves([])
      setSelectedTileColor(null)
    }
    // If selecting a cell for tile placement only (no piece movement)
    else if (selectedTileColor && !gameState.board[row][col].piece) {
      // Create a tile-only placement move
      const move: Move = {
        piece_position: [-1, -1],
        target_position: [-1, -1],
        tile_placement: {
          position: [row, col],
          color: selectedTileColor
        }
      }
      
      console.log('Submitting tile placement:', move)  // Debug log
      wsRef.current.send(JSON.stringify({
        type: 'move',
        data: move
      }))
      
      setSelectedTileColor(null)
    }
    // Deselect if clicking elsewhere
    else {
      setSelectedPiece(null)
      setLegalMoves([])
      setSelectedTileColor(null)
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
