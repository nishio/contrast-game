import React from 'react'
import { Box, RadioGroup, Radio, Stack, Button } from '@chakra-ui/react'

export type GameMode = 'hh' | 'ha' | 'ah' | 'aa'

interface GameSetupPanelProps {
  onModeSelect: (mode: GameMode) => void
}

export function GameSetupPanel({ onModeSelect }: GameSetupPanelProps) {
  const [selectedMode, setSelectedMode] = React.useState<GameMode>('hh')

  const handleConfirm = () => {
    onModeSelect(selectedMode)
  }

  return (
    <Box p={4} borderWidth={1} borderRadius="md" maxW="400px" mx="auto" my={4}>
      <RadioGroup onChange={(value) => setSelectedMode(value as GameMode)} value={selectedMode}>
        <Stack direction="column" spacing={3}>
          <Radio value="hh">人間 vs 人間 / Human vs Human</Radio>
          <Radio value="ha">人間先手 vs AI後手 / Human (First) vs AI</Radio>
          <Radio value="ah">AI先手 vs 人間後手 / AI vs Human (Second)</Radio>
          <Radio value="aa">AI vs AI</Radio>
        </Stack>
      </RadioGroup>
      <Button
        mt={4}
        colorScheme="blue"
        onClick={handleConfirm}
        width="100%"
      >
        ゲーム開始 / Start Game
      </Button>
    </Box>
  )
}
