import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../stores/useGameStore'
import { calculateScore } from '../../utils/scoring'
import { processMessage, resetGameStore, makePlayer } from './helpers'
import type { PeerMessage, Answer, Vote, Player } from '../../types'

beforeEach(() => {
  resetGameStore()
})

describe('Full round cycle', () => {
  it('game-start transitions phase to wheel', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    processMessage('p1', { type: 'game-start', senderId: 'p1', payload: {} })
    expect(useGameStore.getState().room!.phase).toBe('wheel')
  })

  it('round-start sets pending letter and phase', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    processMessage('p1', { type: 'round-start', senderId: 'p1', payload: { letter: 'A' } })
    expect(useGameStore.getState().room?.pendingLetter).toBe('A')
  })

  it('handles answers-submit from each player', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().startRound('A')

    const answers1: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
      { playerId: 'p1', category: 'name', value: 'Ali' },
    ]
    processMessage('p1', { type: 'answers-submit', senderId: 'p1', payload: { answers: answers1 } })

    const answers2: Answer[] = [
      { playerId: 'p2', category: 'city', value: 'Bursa' },
      { playerId: 'p2', category: 'name', value: 'Berk' },
    ]
    processMessage('p2', { type: 'answers-submit', senderId: 'p2', payload: { answers: answers2 } })

    const state = useGameStore.getState()
    expect(state.submittedPlayers).toContain('p1')
    expect(state.submittedPlayers).toContain('p2')
    expect(state.room!.rounds[0].answers).toHaveLength(4)
  })

  it('transitions to grading when all players submit', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().startRound('A')

    processMessage('p1', {
      type: 'answers-submit',
      senderId: 'p1',
      payload: { answers: [{ playerId: 'p1', category: 'city', value: 'Ankara' }] },
    })
    processMessage('p2', {
      type: 'answers-submit',
      senderId: 'p2',
      payload: { answers: [{ playerId: 'p2', category: 'city', value: 'Bursa' }] },
    })

    expect(useGameStore.getState().room!.phase).toBe('grading')
    expect(useGameStore.getState().gradingItems.length).toBeGreaterThan(0)
  })

  it('applies vote to current round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().startRound('A')
    useGameStore.getState().pushAnswersToRound([{ playerId: 'p1', category: 'city', value: 'Ankara' }])
    useGameStore.getState().markPlayerSubmitted('p1')
    useGameStore.getState().markPlayerSubmitted('p2')

    const vote: Vote = { voterId: 'p2', answerId: 'p1-city', isValid: true }
    processMessage('p2', { type: 'vote', senderId: 'p2', payload: vote })

    expect(useGameStore.getState().room!.rounds[0].votes).toHaveLength(1)
    expect(useGameStore.getState().room!.rounds[0].votes[0].isValid).toBe(true)
  })

  it('completes full round cycle: answers → grading → round results', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().startRound('A')

    processMessage('p1', { type: 'answers-submit', senderId: 'p1', payload: { answers: [{ playerId: 'p1', category: 'city', value: 'Ankara' }] } })
    processMessage('p2', { type: 'answers-submit', senderId: 'p2', payload: { answers: [{ playerId: 'p2', category: 'city', value: 'Bursa' }] } })

    processMessage('p2', { type: 'vote', senderId: 'p2', payload: { voterId: 'p2', answerId: 'p1-city', isValid: true } })
    processMessage('p1', { type: 'vote', senderId: 'p1', payload: { voterId: 'p1', answerId: 'p2-city', isValid: true } })

    const currentState = useGameStore.getState()
    const round = currentState.room!.rounds[0]
    const scoresMap = calculateScore(round.answers, round.votes, currentState.room!.players)
    const scores: Record<string, number> = {}
    const updatedPlayers: Player[] = currentState.room!.players.map((p) => {
      const rs = scoresMap.get(p.id) ?? 0
      scores[p.id] = rs
      return { ...p, score: p.score + rs }
    })

    processMessage('p1', { type: 'round-end', senderId: 'p1', payload: { roundScores: scores, updatedPlayers } })

    const finalState = useGameStore.getState()
    expect(finalState.scores).toHaveProperty('p1')
    expect(finalState.scores).toHaveProperty('p2')
    expect(finalState.room!.phase).toBe('round-results')
  })

  it('transitions to game-over on last round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().updateSettings({ totalRounds: 1 })
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().startRound('A')

    processMessage('p1', { type: 'answers-submit', senderId: 'p1', payload: { answers: [{ playerId: 'p1', category: 'city', value: 'Ankara' }] } })
    processMessage('p2', { type: 'answers-submit', senderId: 'p2', payload: { answers: [{ playerId: 'p2', category: 'city', value: 'Bursa' }] } })

    processMessage('p2', { type: 'vote', senderId: 'p2', payload: { voterId: 'p2', answerId: 'p1-city', isValid: true } })
    processMessage('p1', { type: 'vote', senderId: 'p1', payload: { voterId: 'p1', answerId: 'p2-city', isValid: true } })

    const currentState = useGameStore.getState()
    const round = currentState.room!.rounds[0]
    const scoresMap = calculateScore(round.answers, round.votes, currentState.room!.players)
    const scores: Record<string, number> = {}
    const updatedPlayers = currentState.room!.players.map((p) => {
      const rs = scoresMap.get(p.id) ?? 0
      scores[p.id] = rs
      return { ...p, score: p.score + rs }
    })

    processMessage('p1', { type: 'round-end', senderId: 'p1', payload: { roundScores: scores, updatedPlayers } })

    expect(useGameStore.getState().room!.phase).toBe('game-over')
  })

  it('handles chat-message broadcast', () => {
    const chatMsg: PeerMessage = {
      type: 'chat-message',
      senderId: 'p1',
      payload: { playerId: 'p1', nickname: 'Admin', text: 'Hello!', timestamp: 1000 },
    }
    processMessage('p1', chatMsg)
    expect(useGameStore.getState().chatMessages).toHaveLength(1)
    expect(useGameStore.getState().chatMessages[0].text).toBe('Hello!')
  })
})

describe('Reconnection', () => {
  it('handles reconnect message and sends reconnect-accepted', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    const reconnectMsg: PeerMessage = {
      type: 'reconnect',
      senderId: 'p2',
      payload: { playerId: 'p2', nickname: 'Bob' },
    }
    const responses = processMessage('p2', reconnectMsg)

    const accepted = responses.find((r) => r.type === 'reconnect-accepted')
    expect(accepted).toBeDefined()
    expect((accepted!.payload as { room: unknown }).room).toBeDefined()
  })

  it('reconnect-accepted restores full room state', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    const reconnectMsg: PeerMessage = {
      type: 'reconnect',
      senderId: 'p2',
      payload: { playerId: 'p2', nickname: 'Bob' },
    }
    const responses = processMessage('p2', reconnectMsg)
    const accepted = responses.find((r) => r.type === 'reconnect-accepted')!

    resetGameStore()
    useGameStore.getState().setLocalPlayer('p2', 'Bob')
    processMessage('p1', accepted)

    expect(useGameStore.getState().room).not.toBeNull()
    expect(useGameStore.getState().room!.players).toHaveLength(2)
    expect(useGameStore.getState().room!.code).toBe('ABCD')
  })

  it('reconnect-accepted restores timer', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().setTimer(30)

    const reconnectMsg: PeerMessage = {
      type: 'reconnect',
      senderId: 'p2',
      payload: { playerId: 'p2', nickname: 'Bob' },
    }
    const responses = processMessage('p2', reconnectMsg)
    const accepted = responses.find((r) => r.type === 'reconnect-accepted')!

    resetGameStore()
    useGameStore.getState().setLocalPlayer('p2', 'Bob')
    processMessage('p1', accepted)

    expect(useGameStore.getState().timer).toBe(30)
  })
})
