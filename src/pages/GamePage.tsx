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
import type { GradingItem, Vote, Round, PeerMessage } from '../types'

export function GamePage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const { broadcastMessage, sendMessage } = usePeer()
  const { startRound, submitAnswers, submitVote, finalizeRound, sendChatMessage } = useGame()
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
    const answers = submitAnswers()
    broadcastMessage({
      type: 'answers-submit',
      senderId: localPlayerId,
      payload: { answers },
    } as PeerMessage)
  }

  const handleVote = (answerId: string, isValid: boolean) => {
    submitVote(answerId, isValid)
  }

  const handleGradingComplete = () => {
    if (!room) return
    const round = room.rounds[room.rounds.length - 1]
    if (!round) return

    const scoresMap = calculateScore(round.answers, round.votes, room.players)
    const scores: Record<string, number> = {}
    room.players.forEach((p) => {
      scores[p.id] = (scoresMap.get(p.id) ?? 0)
    })

    const updatedPlayers = room.players.map((p) => ({
      ...p,
      score: p.score + (scores[p.id] ?? 0),
    }))

    store.setScores(scores)
    store.setPhase('round-results')
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

  const isGameOver = room.currentRound >= room.settings.totalRounds && phase === 'round-results'

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

        {phase === 'round-results' && (
          <Scoreboard
            isGameOver={isGameOver}
            onNextRound={room.currentRound < room.settings.totalRounds ? handleNextRound : undefined}
            onBackToLobby={handleBackToLobby}
            onPlayAgain={isGameOver ? handlePlayAgain : undefined}
          />
        )}

        <ChatBox onSend={sendChatMessage} />
      </Box>
    </Container>
  )
}
