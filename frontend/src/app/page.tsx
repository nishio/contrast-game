'use client'

import React, { useEffect, useState } from 'react'
import { Box, Grid, GridItem, Text, VStack, HStack, Button, useToast } from '@chakra-ui/react'
import { Socket as SocketIOClient } from 'socket.io-client'

// Import socket.io-client as a module
const io = require('socket.io-client')

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
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null)
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([])
  const [selectedTileColor, setSelectedTileColor] = useState<'black' | 'gray' | null>(null)
  const toast = useToast()

  useEffect(() => {
    const socket = io('ws://localhost:8000', {
      path: '/api/games/test/ws',
      transports: ['websocket']
    })
    
    socket.on('connect', () => {
      toast({
        title: 'Connected to game server',
        status: 'success',
        duration: 3000,
      })
    })

    socket.on('connect_error', (error: Error) => {
      toast({
        title: 'Connection error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    })

    socket.on('game_state_update', (newState: GameState) => {
      setGameState(newState)
      // Reset selections when state updates
      setSelectedPiece(null)
      setLegalMoves([])
      setSelectedTileColor(null)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleCellClick = async (row: number, col: number) => {
    if (!gameState) return

    // If no piece is selected and the clicked cell has a piece of the current player
    if (!selectedPiece && gameState.board[row][col].piece === gameState.current_player) {
      setSelectedPiece([row, col])
      // Find legal moves for this piece
      const moves = gameState.legal_moves.filter(
        move => move.piece_position[0] === row && move.piece_position[1] === col
      )
      setLegalMoves(moves.map(move => move.target_position))
    }
    // If a piece is selected and the clicked cell is a legal move
    else if (selectedPiece && legalMoves.some(([r, c]) => r === row && c === col)) {
      try {
        // Submit move to server
        const move: Move = {
          piece_position: selectedPiece,
          target_position: [row, col],
          tile_placement: selectedTileColor ? {
            position: [row, col],
            color: selectedTileColor
          } : null
        }
        const response = await fetch(`/api/games/test/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(move)
        })
        
        if (!response.ok) {
          throw new Error('Failed to submit move')
        }

        const result = await response.json()
        if (result.winner) {
          toast({
            title: `Player ${result.winner} wins!`,
            status: 'success',
            duration: 5000,
          })
        }
      } catch (error) {
        toast({
          title: 'Error submitting move',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        })
      }
      
      setSelectedPiece(null)
      setLegalMoves([])
      setSelectedTileColor(null)
    }
    // If selecting a cell for tile placement
    else if (selectedTileColor && !gameState.board[row][col].piece) {
      try {
        const move: Move = {
          piece_position: [-1, -1], // Invalid position to indicate tile-only placement
          target_position: [-1, -1],
          tile_placement: {
            position: [row, col],
            color: selectedTileColor
          }
        }
        const response = await fetch(`/api/games/test/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(move)
        })
        
        if (!response.ok) {
          throw new Error('Failed to place tile')
        }
      } catch (error) {
        toast({
          title: 'Error placing tile',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        })
      }
      
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
    if (selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col) {
      return 'yellow.200'
    }
    if (legalMoves.some(([r, c]) => r === row && c === col)) {
      return 'green.200'
    }
    switch (cell.color) {
      case 'black': return 'gray.800'
      case 'gray': return 'gray.400'
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
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={cell.piece === 1 ? 'blue.500' : 'red.500'}
                />
              )}
            </GridItem>
          ))
        )}
      </Grid>
    </VStack>
  )
}
