import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateMessage } from '../../utils/messageValidator'

vi.mock('@sentry/react', () => ({
  default: { captureMessage: vi.fn() },
  captureMessage: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('validateMessage', () => {
  it('rejects non-object data', () => {
    expect(validateMessage(null)).toBeNull()
    expect(validateMessage('string')).toBeNull()
    expect(validateMessage(123)).toBeNull()
    expect(validateMessage([])).toBeNull()
  })

  it('rejects data with invalid type', () => {
    expect(validateMessage({ type: 'unknown-type', senderId: 'abc', payload: {} })).toBeNull()
  })

  it('rejects data with missing senderId', () => {
    expect(validateMessage({ type: 'ping', senderId: '', payload: {} })).toBeNull()
  })

  it('rejects data with non-string senderId', () => {
    expect(validateMessage({ type: 'ping', senderId: 123, payload: {} })).toBeNull()
  })

  it('accepts valid ping message', () => {
    const result = validateMessage({ type: 'ping', senderId: 'p1', payload: undefined })
    expect(result).not.toBeNull()
    expect(result!.type).toBe('ping')
    expect(result!.senderId).toBe('p1')
  })

  it('accepts valid pong message', () => {
    const result = validateMessage({ type: 'pong', senderId: 'p1', payload: undefined })
    expect(result).not.toBeNull()
  })

  it('accepts valid heartbeat with empty payload', () => {
    const result = validateMessage({ type: 'heartbeat', senderId: 'p1', payload: {} })
    expect(result).not.toBeNull()
  })

  it('rejects join-room without nickname', () => {
    const result = validateMessage({ type: 'join-room', senderId: 'p1', payload: { id: 'abc' } })
    expect(result).toBeNull()
  })

  it('rejects join-room with too long nickname', () => {
    const result = validateMessage({ type: 'join-room', senderId: 'p1', payload: { id: 'abc', nickname: 'a'.repeat(21) } })
    expect(result).toBeNull()
  })

  it('accepts valid join-room', () => {
    const result = validateMessage({ type: 'join-room', senderId: 'p1', payload: { id: 'abc', nickname: 'Alice' } })
    expect(result).not.toBeNull()
  })

  it('rejects join-room with invalid characters in nickname', () => {
    const result = validateMessage({ type: 'join-room', senderId: 'p1', payload: { id: 'abc', nickname: '<script>' } })
    expect(result).toBeNull()
  })

  it('accepts valid player-ready', () => {
    const result = validateMessage({ type: 'player-ready', senderId: 'p1', payload: { playerId: 'p1', ready: true } })
    expect(result).not.toBeNull()
  })

  it('rejects player-ready without ready field', () => {
    const result = validateMessage({ type: 'player-ready', senderId: 'p1', payload: { playerId: 'p1' } })
    expect(result).toBeNull()
  })

  it('accepts valid game-start', () => {
    const result = validateMessage({ type: 'game-start', senderId: 'p1', payload: undefined })
    expect(result).not.toBeNull()
  })

  it('accepts valid round-start', () => {
    const result = validateMessage({ type: 'round-start', senderId: 'p1', payload: { letter: 'A' } })
    expect(result).not.toBeNull()
  })

  it('rejects round-start with empty letter', () => {
    const result = validateMessage({ type: 'round-start', senderId: 'p1', payload: { letter: '' } })
    expect(result).toBeNull()
  })

  it('rejects answers-submit with too many answers', () => {
    const answers = Array.from({ length: 36 }, (_, i) => ({ playerId: 'p1', category: `cat${i}`, value: 'test' }))
    const result = validateMessage({ type: 'answers-submit', senderId: 'p1', payload: { answers } })
    expect(result).toBeNull()
  })

  it('rejects answers-submit with invalid answer items', () => {
    const answers = [{ notAnAnswer: true }]
    const result = validateMessage({ type: 'answers-submit', senderId: 'p1', payload: { answers } })
    expect(result).toBeNull()
  })

  it('accepts valid vote', () => {
    const result = validateMessage({ type: 'vote', senderId: 'p1', payload: { voterId: 'p1', answerId: 'p2-city', isValid: true } })
    expect(result).not.toBeNull()
  })

  it('rejects vote with non-boolean isValid', () => {
    const result = validateMessage({ type: 'vote', senderId: 'p1', payload: { voterId: 'p1', answerId: 'p2-city', isValid: 'yes' } })
    expect(result).toBeNull()
  })

  it('accepts valid chat-message', () => {
    const result = validateMessage({ type: 'chat-message', senderId: 'p1', payload: { playerId: 'p1', nickname: 'Alice', text: 'hello', timestamp: Date.now() } })
    expect(result).not.toBeNull()
  })

  it('accepts valid settings-update', () => {
    const result = validateMessage({ type: 'settings-update', senderId: 'p1', payload: { totalRounds: 5 } })
    expect(result).not.toBeNull()
  })

  it('accepts valid admin-transfer', () => {
    const result = validateMessage({ type: 'admin-transfer', senderId: 'p1', payload: { newAdminId: 'p2' } })
    expect(result).not.toBeNull()
  })

  it('rejects admin-transfer-request with missing newAdminId', () => {
    const result = validateMessage({ type: 'admin-transfer-request', senderId: 'p1', payload: {} })
    expect(result).toBeNull()
  })

  it('rejects join-rejected with invalid reason', () => {
    const result = validateMessage({ type: 'join-rejected', senderId: 'p1', payload: { reason: 'unknown' } })
    expect(result).toBeNull()
  })

  it('accepts valid join-rejected', () => {
    const result = validateMessage({ type: 'join-rejected', senderId: 'p1', payload: { reason: 'wrong-password' } })
    expect(result).not.toBeNull()
  })

  it('accepts valid room-state-sync', () => {
    const result = validateMessage({ type: 'room-state-sync', senderId: 'p1', payload: { room: { code: 'ABCD' } } })
    expect(result).not.toBeNull()
  })

  it('rejects room-state-sync without room', () => {
    const result = validateMessage({ type: 'room-state-sync', senderId: 'p1', payload: {} })
    expect(result).toBeNull()
  })

  it('accepts valid reconnect', () => {
    const result = validateMessage({ type: 'reconnect', senderId: 'p1', payload: { playerId: 'p1', nickname: 'Alice' } })
    expect(result).not.toBeNull()
  })

  it('accepts valid reconnect-accepted with null timer', () => {
    const result = validateMessage({ type: 'reconnect-accepted', senderId: 'p1', payload: { room: { code: 'ABCD' }, timer: null } })
    expect(result).not.toBeNull()
  })

  it('accepts valid spectate-request', () => {
    const result = validateMessage({ type: 'spectate-request', senderId: 'p1', payload: { playerId: 'p1', nickname: 'Alice' } })
    expect(result).not.toBeNull()
  })

  it('rejects spectate-request with empty playerId', () => {
    const result = validateMessage({ type: 'spectate-request', senderId: 'p1', payload: { playerId: '', nickname: 'Alice' } })
    expect(result).toBeNull()
  })

  it('accepts valid player-disconnected', () => {
    const result = validateMessage({ type: 'player-disconnected', senderId: 'p1', payload: { playerId: 'p2' } })
    expect(result).not.toBeNull()
  })

  it('accepts valid round-end', () => {
    const result = validateMessage({ type: 'round-end', senderId: 'p1', payload: { roundScores: { p1: 10 }, updatedPlayers: [] } })
    expect(result).not.toBeNull()
  })
})
