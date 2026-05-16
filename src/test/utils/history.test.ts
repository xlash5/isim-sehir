import { describe, it, expect, beforeEach } from 'vitest'
import { getGameHistory, clearGameHistory, saveGameToHistory } from '../../utils/history'
import type { GameRoom } from '../../types'

function makeMockRoom(overrides?: Partial<GameRoom>): GameRoom {
  return {
    code: 'ABCD',
    adminId: 'p1',
    players: [
      { id: 'p1', nickname: 'Alice', isAdmin: true, isReady: false, score: 10, isSpectator: false },
      { id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 5, isSpectator: false },
    ],
    settings: {
      categories: ['city', 'animal'],
      totalRounds: 1,
      roundDuration: 60,
      letterPool: ['A', 'B', 'C'],
      customCategories: [],
    },
    phase: 'game-over',
    currentRound: 1,
    currentLetter: 'A',
    pendingLetter: null,
    rounds: [
      {
        letter: 'A',
        answers: [
          { playerId: 'p1', category: 'city', value: 'Ankara' },
          { playerId: 'p2', category: 'city', value: 'Bursa' },
        ],
        votes: [
          { voterId: 'p2', answerId: 'p1-city', isValid: true },
          { voterId: 'p1', answerId: 'p2-city', isValid: true },
        ],
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  clearGameHistory()
})

describe('getGameHistory', () => {
  it('returns empty array when no history', () => {
    expect(getGameHistory()).toEqual([])
  })

  it('returns empty array for corrupted data', () => {
    localStorage.setItem('isim-sehir-history', '{invalid}')
    expect(getGameHistory()).toEqual([])
  })

  it('returns empty array for non-array data', () => {
    localStorage.setItem('isim-sehir-history', '{"key":"value"}')
    expect(getGameHistory()).toEqual([])
  })
})

describe('saveGameToHistory', () => {
  it('saves a game entry', () => {
    const room = makeMockRoom()
    saveGameToHistory(room, 'p1', 'Alice')
    const history = getGameHistory()
    expect(history).toHaveLength(1)
    expect(history[0].roomCode).toBe('ABCD')
    expect(history[0].yourNickname).toBe('Alice')
    expect(history[0].yourScore).toBe(10)
  })

  it('enforces max 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      const room = makeMockRoom({ code: `ROOM${i}` })
      saveGameToHistory(room, 'p1', 'Alice')
    }
    expect(getGameHistory().length).toBe(50)
  })

  it('correctly computes rank', () => {
    const room = makeMockRoom()
    saveGameToHistory(room, 'p2', 'Bob')
    const history = getGameHistory()
    expect(history[0].yourRank).toBe(2)
  })

  it('handles localStorage errors gracefully on save', () => {
    const orig = localStorage.setItem
    localStorage.setItem = () => { throw new Error('fail') }
    const room = makeMockRoom()
    expect(() => saveGameToHistory(room, 'p1', 'Alice')).not.toThrow()
    localStorage.setItem = orig
  })

  it('handles localStorage errors gracefully on clear', () => {
    const orig = localStorage.removeItem
    localStorage.removeItem = () => { throw new Error('fail') }
    expect(() => clearGameHistory()).not.toThrow()
    localStorage.removeItem = orig
  })

  it('handles localStorage errors gracefully on get', () => {
    const orig = localStorage.getItem
    localStorage.getItem = () => { throw new Error('fail') }
    expect(getGameHistory()).toEqual([])
    localStorage.getItem = orig
  })

  it('returns empty array for non-array data in history', () => {
    localStorage.setItem('isim-sehir-history', JSON.stringify({ not: 'array' }))
    expect(getGameHistory()).toEqual([])
  })
})
