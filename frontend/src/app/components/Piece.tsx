import React from 'react'
import { Box } from '@chakra-ui/react'

interface PieceProps {
  piece: number
  tileColor: 'white' | 'black' | 'gray'
}

export function Piece({ piece, tileColor }: PieceProps) {
  // Determine which arrows to show based on tile color
  // Show orthogonal arrows (black) on white and gray tiles
  const showOrthogonalArrows = tileColor === 'white' || tileColor === 'gray'
  // Show diagonal arrows (white) on black and gray tiles
  const showDiagonalArrows = tileColor === 'black' || tileColor === 'gray'

  return (
    <Box position="relative" width="40px" height="40px">
      {/* Main piece circle */}
      <Box
        w="40px"
        h="40px"
        borderRadius="full"
        bg={piece === 1 ? 'blue.500' : 'red.500'}
        position="absolute"
        top="0"
        left="0"
        zIndex={1}
      />
      
      {/* Container for arrows */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex={2}
        pointerEvents="none"
      >
        {/* Orthogonal arrows (black on white/gray tiles) */}
        {showOrthogonalArrows && (
          <>
            {/* Up arrow */}
            <Box
              position="absolute"
              top="-8px"
              left="50%"
              transform="translateX(-50%)"
              color="black"
              fontSize="16px"
              fontWeight="bold"
            >
              ↑
            </Box>
            {/* Down arrow */}
            <Box
              position="absolute"
              bottom="-8px"
              left="50%"
              transform="translateX(-50%)"
              color="black"
              fontSize="16px"
              fontWeight="bold"
            >
              ↓
            </Box>
            {/* Left arrow */}
            <Box
              position="absolute"
              left="-8px"
              top="50%"
              transform="translateY(-50%)"
              color="black"
              fontSize="16px"
              fontWeight="bold"
            >
              ←
            </Box>
            {/* Right arrow */}
            <Box
              position="absolute"
              right="-8px"
              top="50%"
              transform="translateY(-50%)"
              color="black"
              fontSize="16px"
              fontWeight="bold"
            >
              →
            </Box>
          </>
        )}

        {/* Diagonal arrows (white on black tiles, or on gray tiles) */}
        {showDiagonalArrows && (
          <>
            {/* Top-left arrow */}
            <Box
              position="absolute"
              top="-8px"
              left="-8px"
              color="white"
              fontSize="16px"
              fontWeight="bold"
              textShadow="0 0 2px black"
            >
              ↖
            </Box>
            {/* Top-right arrow */}
            <Box
              position="absolute"
              top="-8px"
              right="-8px"
              color="white"
              fontSize="16px"
              fontWeight="bold"
              textShadow="0 0 2px black"
            >
              ↗
            </Box>
            {/* Bottom-left arrow */}
            <Box
              position="absolute"
              bottom="-8px"
              left="-8px"
              color="white"
              fontSize="16px"
              fontWeight="bold"
              textShadow="0 0 2px black"
            >
              ↙
            </Box>
            {/* Bottom-right arrow */}
            <Box
              position="absolute"
              bottom="-8px"
              right="-8px"
              color="white"
              fontSize="16px"
              fontWeight="bold"
              textShadow="0 0 2px black"
            >
              ↘
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
