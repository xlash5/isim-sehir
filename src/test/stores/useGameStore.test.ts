import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../stores/useGameStore'
import type { Player } from '../../types'

beforeEach(() => {
  useGameStore.setState({
    room: null,
    localPlayerId: null,
    localNickname: null,
    answers: new Map(),
    submittedPlayers: [],
    gradingItems: [],
    myVotes: {},
    chatMessages: [],
    timer: null,
    isSubmitting: false,
    scores: {},
    joinRejectedReason: null,
    countdown: null,
    settingsEditMode: false,
  })
})

describe('useGameStore', () => {
  it('has correct initial state', () => {
    const state = useGameStore.getState()
    expect(state.room).toBeNull()
    expect(state.localPlayerId).toBeNull()
    expect(state.localNickname).toBeNull()
    expect(state.answers.size).toBe(0)
    expect(state.submittedPlayers).toEqual([])
    expect(state.gradingItems).toEqual([])
    expect(state.myVotes).toEqual({})
    expect(state.chatMessages).toEqual([])
    expect(state.timer).toBeNull()
  })

  it('setLocalPlayer sets id and nickname', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    const state = useGameStore.getState()
    expect(state.localPlayerId).toBe('p1')
    expect(state.localNickname).toBe('Alice')
  })

  it('setJoinRejected sets reason', () => {
    useGameStore.getState().setJoinRejected('wrong-password')
    expect(useGameStore.getState().joinRejectedReason).toBe('wrong-password')
  })

  it('clearJoinRejected clears reason', () => {
    useGameStore.getState().setJoinRejected('wrong-password')
    useGameStore.getState().clearJoinRejected()
    expect(useGameStore.getState().joinRejectedReason).toBeNull()
  })

  it('createRoom creates a room with the creator as admin', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    const state = useGameStore.getState()
    expect(state.room).not.toBeNull()
    expect(state.room!.adminId).toBe('p1')
    expect(state.room!.players).toHaveLength(1)
    expect(state.room!.players[0].isAdmin).toBe(true)
    expect(state.room!.players[0].nickname).toBe('Alice')
    expect(state.room!.phase).toBe('lobby')
  })

  it('addRound adds a round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().addRound({ letter: 'A', answers: [], votes: [] })
    expect(useGameStore.getState().room!.rounds).toHaveLength(1)
  })

  it('joinRoom with no existing room creates one', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().joinRoom('ABCD')
    expect(useGameStore.getState().room).not.toBeNull()
    expect(useGameStore.getState().room!.code).toBe('ABCD')
  })

  it('joinRoom does not duplicate same nickname', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().setLocalPlayer('p2', 'Alice')
    useGameStore.getState().joinRoom('ABCD')
    expect(useGameStore.getState().room!.players).toHaveLength(1)
  })

  it('addPlayer adds a new player', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    const bob: Player = { id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 0, isSpectator: false }
    useGameStore.getState().addPlayer(bob)
    expect(useGameStore.getState().room!.players).toHaveLength(2)
  })

  it('addPlayer does not duplicate', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    const bob: Player = { id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 0, isSpectator: false }
    useGameStore.getState().addPlayer(bob)
    useGameStore.getState().addPlayer(bob)
    expect(useGameStore.getState().room!.players).toHaveLength(2)
  })

  it('removePlayer removes player and their data', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().addPlayer({ id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 0, isSpectator: false })
    useGameStore.getState().removePlayer('p2')
    expect(useGameStore.getState().room!.players).toHaveLength(1)
  })

  it('transferAdmin transfers admin to another player', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().addPlayer({ id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 0, isSpectator: false })
    useGameStore.getState().transferAdmin('p2')
    expect(useGameStore.getState().room!.adminId).toBe('p2')
    expect(useGameStore.getState().room!.players.find((p) => p.id === 'p2')!.isAdmin).toBe(true)
    expect(useGameStore.getState().room!.players.find((p) => p.id === 'p1')!.isAdmin).toBe(false)
  })

  it('setPlayerReady sets ready state', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().setPlayerReady('p1', true)
    expect(useGameStore.getState().room!.players[0].isReady).toBe(true)
  })

  it('setPhase updates phase', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().setPhase('wheel')
    expect(useGameStore.getState().room!.phase).toBe('wheel')
  })

  it('startRound starts a new round and sets answering phase', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    const state = useGameStore.getState()
    expect(state.room!.currentLetter).toBe('A')
    expect(state.room!.currentRound).toBe(1)
    expect(state.room!.phase).toBe('answering')
    expect(state.room!.rounds).toHaveLength(1)
  })

  it('setAnswer stores an answer mapping', () => {
    useGameStore.getState().setAnswer('city', 'Ankara')
    expect(useGameStore.getState().answers.get('city')).toBe('Ankara')
  })

  it('submitAnswers returns answers and sets isSubmitting', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().setAnswer('city', 'Ankara')
    const answers = useGameStore.getState().submitAnswers()
    expect(answers).toHaveLength(1)
    expect(answers[0].playerId).toBe('p1')
    expect(useGameStore.getState().isSubmitting).toBe(true)
  })

  it('markPlayerSubmitted transitions to grading when all submitted', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    useGameStore.getState().markPlayerSubmitted('p1')
    const state = useGameStore.getState()
    expect(state.submittedPlayers).toContain('p1')
    expect(state.room!.phase).toBe('grading')
  })

  it('setVote records a vote', () => {
    useGameStore.getState().setVote('p1-city', true)
    expect(useGameStore.getState().myVotes['p1-city']).toBe(true)
  })

  it('setScores sets scores', () => {
    useGameStore.getState().setScores({ p1: 10, p2: 5 })
    expect(useGameStore.getState().scores).toEqual({ p1: 10, p2: 5 })
  })

  it('setTimer sets timer', () => {
    useGameStore.getState().setTimer(30)
    expect(useGameStore.getState().timer).toBe(30)
  })

  it('tickTimer decrements timer', () => {
    useGameStore.getState().setTimer(30)
    useGameStore.getState().tickTimer()
    expect(useGameStore.getState().timer).toBe(29)
  })

  it('tickTimer stops at 0', () => {
    useGameStore.getState().setTimer(0)
    useGameStore.getState().tickTimer()
    expect(useGameStore.getState().timer).toBe(0)
  })

  it('addChatMessage appends message', () => {
    const msg = { playerId: 'p1', nickname: 'Alice', text: 'hello', timestamp: 1000 }
    useGameStore.getState().addChatMessage(msg)
    expect(useGameStore.getState().chatMessages).toHaveLength(1)
    expect(useGameStore.getState().chatMessages[0]).toEqual(msg)
  })

  it('nextRound resets for next round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    useGameStore.getState().nextRound()
    const state = useGameStore.getState()
    expect(state.room!.phase).toBe('wheel')
    expect(state.answers.size).toBe(0)
    expect(state.submittedPlayers).toEqual([])
    expect(state.myVotes).toEqual({})
  })

  it('resetGame resets game state within room', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.room!.phase).toBe('lobby')
    expect(state.room!.currentRound).toBe(0)
    expect(state.room!.rounds).toEqual([])
    expect(state.room!.players.every((p) => p.score === 0)).toBe(true)
  })

  it('resetRoom clears everything', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().resetRoom()
    const state = useGameStore.getState()
    expect(state.room).toBeNull()
    expect(state.answers.size).toBe(0)
    expect(state.chatMessages).toEqual([])
  })

  it('setCountdown sets countdown value', () => {
    useGameStore.getState().setCountdown(5)
    expect(useGameStore.getState().countdown).toBe(5)
  })

  it('setSettingsEditMode sets edit mode', () => {
    useGameStore.getState().setSettingsEditMode(true)
    expect(useGameStore.getState().settingsEditMode).toBe(true)
  })

  it('setPendingLetter sets pending letter', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().setPendingLetter('B')
    expect(useGameStore.getState().room!.pendingLetter).toBe('B')
  })

  it('addVote adds vote to current round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    const vote = { voterId: 'p2', answerId: 'p1-city', isValid: true }
    useGameStore.getState().addVote(vote)
    expect(useGameStore.getState().room!.rounds[0].votes).toHaveLength(1)
  })

  it('addVote updates existing vote', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    const vote = { voterId: 'p2', answerId: 'p1-city', isValid: true }
    useGameStore.getState().addVote(vote)
    const updated = { voterId: 'p2', answerId: 'p1-city', isValid: false }
    useGameStore.getState().addVote(updated)
    expect(useGameStore.getState().room!.rounds[0].votes).toHaveLength(1)
    expect(useGameStore.getState().room!.rounds[0].votes[0].isValid).toBe(false)
  })

  it('updateSettings updates room settings', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().updateSettings({ totalRounds: 5 })
    expect(useGameStore.getState().room!.settings.totalRounds).toBe(5)
  })

  it('updatePlayers replaces player list', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    const newPlayers: Player[] = [
      { id: 'p1', nickname: 'Alice', isAdmin: true, isReady: true, score: 10, isSpectator: false },
    ]
    useGameStore.getState().updatePlayers(newPlayers)
    expect(useGameStore.getState().room!.players).toEqual(newPlayers)
  })

  it('pushAnswersToRound pushes answers to the latest round', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Alice')
    useGameStore.getState().createRoom()
    useGameStore.getState().startRound('A')
    const answers = [{ playerId: 'p1', category: 'city', value: 'Ankara' }]
    useGameStore.getState().pushAnswersToRound(answers)
    expect(useGameStore.getState().room!.rounds[0].answers).toHaveLength(1)
  })

  it('setGradingItems sets items and resets votes', () => {
    useGameStore.getState().setVote('p1-city', true)
    const items = [{ playerId: 'p2', nickname: 'Bob', answers: [{ category: 'city', value: 'Bursa', answerId: 'p2-city' }] }]
    useGameStore.getState().setGradingItems(items)
    expect(useGameStore.getState().gradingItems).toEqual(items)
    expect(useGameStore.getState().myVotes).toEqual({})
  })
})
