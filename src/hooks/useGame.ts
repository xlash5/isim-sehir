import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/useGameStore'
import { calculateScore } from '../utils/scoring'
import { getRandomLetter } from '../utils/letters'
import { usePeer } from '../context/PeerContext'
import type { PeerMessage, Answer, Vote, Round, GradingItem } from '../types'

export function useGame() {
  const store = useGameStore()
  const { broadcastMessage, sendMessage } = usePeer()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const room = store.room
    if (!room) return

    if (room.phase === 'answering' && room.settings.roundDuration !== null) {
      timerRef.current = setInterval(() => {
        const gs = useGameStore.getState()
        if (gs.timer !== null && gs.timer <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          const answers = gs.submitAnswers()
          gs.pushAnswersToRound(answers)
          gs.markPlayerSubmitted(gs.localPlayerId!)
          broadcastMessage({
            type: 'answers-submit',
            senderId: gs.localPlayerId!,
            payload: { answers },
          } as PeerMessage)
        }
        gs.tickTimer()
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [store.room?.phase, store.room?.currentRound])

  const startGame = () => {
    broadcastMessage({
      type: 'game-start',
      senderId: store.localPlayerId!,
      payload: {},
    } as PeerMessage)
    store.setPhase('wheel')
    startRound()
  }

  const startRound = () => {
    const letter = getRandomLetter(store.room?.settings.letterPool)
    broadcastMessage({
      type: 'round-start',
      senderId: store.localPlayerId!,
      payload: { letter },
    } as PeerMessage)
    store.setPendingLetter(letter)
    store.setPhase('wheel')
  }

  const submitAnswers = () => {
    const answers = store.submitAnswers()
    store.pushAnswersToRound(answers)
    store.markPlayerSubmitted(store.localPlayerId!)
    broadcastMessage({
      type: 'answers-submit',
      senderId: store.localPlayerId!,
      payload: { answers },
    } as PeerMessage)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    store.setTimer(null)
  }

  const submitVote = (answerId: string, isValid: boolean) => {
    store.setVote(answerId, isValid)
    const vote: Vote = { voterId: store.localPlayerId!, answerId, isValid }
    store.addVote(vote)
    broadcastMessage({
      type: 'vote',
      senderId: store.localPlayerId!,
      payload: vote,
    } as PeerMessage)
  }

  const finalizeRound = () => {
    if (!store.room) return
    const round = store.room.rounds[store.room.rounds.length - 1]
    if (!round) return

    const scoresMap = calculateScore(round.answers, round.votes, store.room.players)
    const scores: Record<string, number> = {}
    const updatedPlayers = store.room.players.map((p) => {
      const roundScore = scoresMap.get(p.id) ?? 0
      scores[p.id] = roundScore
      return { ...p, score: p.score + roundScore }
    })

    store.setScores(scores)
    store.setPhase('round-results')

    return { players: updatedPlayers, scores }
  }

  const sendChatMessage = (text: string) => {
    const msg = {
      playerId: store.localPlayerId!,
      nickname: store.localNickname!,
      text,
      timestamp: Date.now(),
    }
    store.addChatMessage(msg)
    broadcastMessage({
      type: 'chat-message',
      senderId: store.localPlayerId!,
      payload: msg,
    } as PeerMessage)
  }

  return {
    startGame,
    startRound,
    submitAnswers,
    submitVote,
    finalizeRound,
    sendChatMessage,
  }
}
