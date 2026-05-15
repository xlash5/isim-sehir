import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Box, Container, Typography, Paper } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useGameStore } from '../stores/useGameStore'
import { usePeer } from '../context/PeerContext'
import { useGame } from '../hooks/useGame'
import { useLocale } from '../locales'
import { SlotMachine } from '../components/Game/SlotMachine'
import { AnswerTable } from '../components/Game/AnswerTable'
import { GradingPanel } from '../components/Game/GradingPanel'
import { Scoreboard } from '../components/Game/Scoreboard'
import { Timer } from '../components/common/Timer'
import { ChatBox } from '../components/common/ChatBox'
import { PhaseIndicator } from '../components/common/PhaseIndicator'
import { PhaseTransitionBanner } from '../components/common/PhaseTransitionBanner'
import { calculateScore } from '../utils/scoring'
import { saveGameToHistory } from '../utils/history'
import { getTipForEvent, resetTips } from '../utils/tips'
import { incrementGamesPlayed, getGamesPlayedCount } from '../utils/rules'
import type { PeerMessage, GamePhase, ChatMessage } from '../types'
import { clearSession } from '../utils/session'

export function GamePage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const store = useGameStore()
  const { broadcastMessage, sendMessage } = usePeer()
  const { startRound, submitAnswers, submitVote, sendChatMessage } = useGame()
  const room = useGameStore((s) => s.room)
  const phase = useGameStore((s) => s.room?.phase)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const addChatMessage = useGameStore((s) => s.addChatMessage)
  const chatMessages = useGameStore((s) => s.chatMessages)
  const prevPhaseRef = useRef<GamePhase | undefined>(undefined)
  const tipSentRef = useRef<Set<string>>(new Set())

  if (!room || !localPlayerId) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>{t('error.gameNotFound')}</Typography>
        </Box>
      </Container>
    )
  }

  const currentPlayer = room.players.find((p) => p.id === localPlayerId)
  const isSpectator = currentPlayer?.isSpectator ?? false

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
    const currentRoom = useGameStore.getState().room
    if (currentRoom) {
      saveGameToHistory(currentRoom, localPlayerId, useGameStore.getState().localNickname ?? '')
    }
    store.resetGame()
    broadcastMessage({
      type: 'game-start',
      senderId: localPlayerId,
      payload: {},
    } as PeerMessage)
    navigate(`/room/${room.code}`)
  }

  const handleBackToLobby = () => {
    const currentRoom = useGameStore.getState().room
    if (currentRoom) {
      saveGameToHistory(currentRoom, localPlayerId, useGameStore.getState().localNickname ?? '')
    }
    clearSession()
    store.resetGame()
    navigate(`/room/${room.code}`)
  }

  useEffect(() => {
    if (!phase) return
    if (prevPhaseRef.current !== phase) {
      const prev = prevPhaseRef.current
      prevPhaseRef.current = phase

      if (prev === 'wheel' && phase === 'answering') {
        const tipKey = 'game-started'
        if (!tipSentRef.current.has(tipKey)) {
          tipSentRef.current.add(tipKey)
          const tipMsgKey = getTipForEvent('game-started')
          if (tipMsgKey) {
            addChatMessage({ playerId: 'system', nickname: '🎯', text: t(tipMsgKey), timestamp: Date.now() })
          }
          incrementGamesPlayed()
        }
      }

      if (prev === 'answering' && phase === 'grading') {
        const tipKey = 'first-grading'
        if (!tipSentRef.current.has(tipKey)) {
          tipSentRef.current.add(tipKey)
          const tipMsgKey = getTipForEvent('first-grading')
          if (tipMsgKey) {
            addChatMessage({ playerId: 'system', nickname: '🎯', text: t(tipMsgKey), timestamp: Date.now() })
          }
        }
      }
    }
  }, [phase, t, addChatMessage])

  const completedPhases: GamePhase[] = []
  if (room) {
    const phaseOrder: GamePhase[] = ['lobby', 'wheel', 'answering', 'grading', 'round-results', 'game-over']
    const currentIdx = phaseOrder.indexOf(phase ?? 'lobby')
    for (let i = 0; i < currentIdx; i++) {
      completedPhases.push(phaseOrder[i])
    }
  }

  const showRoundResults = phase === 'round-results' || phase === 'game-over'

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">
            {t('game.roundInfo', { current: room.currentRound, total: room.settings.totalRounds, letter: room.currentLetter ?? '?' })}
          </Typography>
          <Timer />
        </Paper>
        <PhaseIndicator currentPhase={phase ?? 'lobby'} completedPhases={completedPhases} />
        <PhaseTransitionBanner />

        {isSpectator ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <VisibilityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('game.watching')}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {t('game.watchingSubtitle')}
            </Typography>
          </Paper>
        ) : (
          <>
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
          </>
        )}

        <ChatBox onSend={sendChatMessage} />
      </Box>
    </Container>
  )
}
