import React from 'react'
import { Box } from '@chakra-ui/react'

interface PieceProps {
  piece: number
  tileColor: 'white' | 'black' | 'gray'
}

export function Piece({ piece, tileColor }: PieceProps) {
  // Determine which arrows to show based on tile color
  const showOrthogonalArrows = tileColor === 'white' || tileColor === 'gray'
  const showDiagonalArrows = tileColor === 'black' || tileColor === 'gray'

  // Pentagon points for SVG - sharper point for better direction indication
  const pentagonPoints = "50,0 95,40 80,100 20,100 5,40"

  return (
    <Box position="relative" width="40px" height="40px" data-testid={`piece-${piece}-${tileColor}`}>
      {/* Main piece pentagon */}
      <Box
        as="svg"
        viewBox="0 0 100 100"
        width="40px"
        height="40px"
        position="absolute"
        top="0"
        left="0"
        zIndex={1}
        transform={piece === 1 ? 'rotate(0deg)' : 'rotate(180deg)'}
        style={{
          filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))',
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <polygon
          points={pentagonPoints}
          fill={piece === 1 ? '#3182CE' : '#E53E3E'} // blue.500 or red.500
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="2"
        />
      </Box>
      
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
