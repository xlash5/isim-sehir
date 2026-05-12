import { useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Paper } from '@mui/material'
import { useGameStore } from '../stores/useGameStore'
import { usePeer } from '../context/PeerContext'
import { useGame } from '../hooks/useGame'
import { SlotMachine } from '../components/Game/SlotMachine'
import { AnswerTable } from '../components/Game/AnswerTable'
import { GradingPanel } from '../components/Game/GradingPanel'
import { Scoreboard } from '../components/Game/Scoreboard'
import { Timer } from '../components/common/Timer'
import { ChatBox } from '../components/common/ChatBox'
import { calculateScore } from '../utils/scoring'
import type { PeerMessage } from '../types'

export function GamePage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const { broadcastMessage, sendMessage } = usePeer()
  const { startRound, submitAnswers, submitVote, sendChatMessage } = useGame()
  const room = useGameStore((s) => s.room)
  const phase = useGameStore((s) => s.room?.phase)
  const localPlayerId = useGameStore((s) => s.localPlayerId)

  if (!room || !localPlayerId) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Oyun bulunamadı. Lobiye dönün.</Typography>
        </Box>
      </Container>
    )
  }

  const handleWheelComplete = (letter: string) => {
    store.startRound(letter)
    const duration = room.settings.roundDuration
    if (duration !== null) store.setTimer(duration)
  }

  const handleSubmitAnswers = () => {
    submitAnswers()
  }

  const handleVote = (answerId: string, isValid: boolean) => {
    submitVote(answerId, isValid)
  }

  const handleGradingComplete = () => {
    const currentRoom = useGameStore.getState().room
    if (!currentRoom) return
    const round = currentRoom.rounds[currentRoom.rounds.length - 1]
    if (!round) return

    const scoresMap = calculateScore(round.answers, round.votes, currentRoom.players)
    const roundScores: Record<string, number> = {}
    const updatedPlayers = currentRoom.players.map((p) => {
      const roundScore = scoresMap.get(p.id) ?? 0
      roundScores[p.id] = roundScore
      return { ...p, score: p.score + roundScore }
    })

    store.setScores(roundScores)
    store.updatePlayers(updatedPlayers)

    const isLastRound = currentRoom.currentRound >= currentRoom.settings.totalRounds
    store.setPhase(isLastRound ? 'game-over' : 'round-results')

    broadcastMessage({
      type: 'round-end',
      senderId: localPlayerId,
      payload: { roundScores, updatedPlayers },
    } as PeerMessage)
  }

  const handleNextRound = () => {
    store.nextRound()
    startRound()
  }

  const handlePlayAgain = () => {
    store.resetGame()
    broadcastMessage({
      type: 'game-start',
      senderId: localPlayerId,
      payload: {},
    } as PeerMessage)
    navigate(`/room/${room.code}`)
  }

  const handleBackToLobby = () => {
    store.resetGame()
    navigate(`/room/${room.code}`)
  }

  const showRoundResults = phase === 'round-results' || phase === 'game-over'

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">
            Tur {room.currentRound}/{room.settings.totalRounds}  |  Harf: {room.currentLetter ?? '?'}
          </Typography>
          <Timer />
        </Paper>

        {phase === 'wheel' && (
          <SlotMachine onComplete={handleWheelComplete} />
        )}

        {phase === 'answering' && (
          <AnswerTable onSubmit={handleSubmitAnswers} />
        )}

        {phase === 'grading' && (
          <GradingPanel onVote={handleVote} onComplete={handleGradingComplete} />
        )}

        {showRoundResults && (
          <Scoreboard
            isGameOver={phase === 'game-over'}
            onNextRound={phase === 'round-results' ? handleNextRound : undefined}
            onBackToLobby={handleBackToLobby}
            onPlayAgain={phase === 'game-over' ? handlePlayAgain : undefined}
          />
        )}

        <ChatBox onSend={sendChatMessage} />
      </Box>
    </Container>
  )
}
