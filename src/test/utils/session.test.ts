import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { saveSession, loadSession, clearSession } from '../../utils/session'

const SESSION_KEY = 'isim-sehir-session'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('session', () => {
  it('saves and loads a session', () => {
    saveSession('peer1', 'p1', 'Alice', 'room1')
    const session = loadSession()
    expect(session).not.toBeNull()
    expect(session!.peerId).toBe('peer1')
    expect(session!.playerId).toBe('p1')
    expect(session!.nickname).toBe('Alice')
    expect(session!.roomCode).toBe('room1')
    expect(session!.timestamp).toBeTypeOf('number')
  })

  it('returns null when no session exists', () => {
    expect(loadSession()).toBeNull()
  })

  it('clears the session', () => {
    saveSession('peer1', 'p1', 'Alice', 'room1')
    clearSession()
    expect(loadSession()).toBeNull()
  })

  it('returns null for expired session', () => {
    vi.useFakeTimers()
    saveSession('peer1', 'p1', 'Alice', 'room1')
    vi.advanceTimersByTime(61 * 60 * 1000) // 61 minutes
    expect(loadSession()).toBeNull()
  })

  it('returns null for corrupted data', () => {
    localStorage.setItem(SESSION_KEY, '{invalid json}')
    expect(loadSession()).toBeNull()
  })

  it('returns null for incomplete session data', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ peerId: 'peer1' }))
    expect(loadSession()).toBeNull()
  })

  it('handles localStorage errors gracefully', () => {
    const orig = localStorage.getItem
    localStorage.getItem = () => { throw new Error('storage error') }
    expect(loadSession()).toBeNull()
    localStorage.getItem = orig
  })
})
