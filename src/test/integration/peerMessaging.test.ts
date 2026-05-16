import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../stores/useGameStore'
import { processMessage, resetGameStore, makePlayer, createRateLimiter } from './helpers'
import type { PeerMessage } from '../../types'

beforeEach(() => {
  resetGameStore()
})

describe('Player joins room', () => {
  it('processes join-room message and adds player to room', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    expect(useGameStore.getState().room!.players).toHaveLength(1)

    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: 'Bob' },
    }
    processMessage('p2', joinMsg)
    expect(useGameStore.getState().room!.players).toHaveLength(2)
    const bob = useGameStore.getState().room!.players.find((p) => p.id === 'p2')
    expect(bob?.nickname).toBe('Bob')
    expect(bob?.isAdmin).toBe(false)
  })

  it('responds with room-state-sync when admin receives join-room', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: 'Bob' },
    }
    const responses = processMessage('p2', joinMsg)
    const syncResponse = responses.find((r) => r.type === 'room-state-sync')
    expect(syncResponse).toBeDefined()
    expect(syncResponse!.payload).toHaveProperty('room')
  })

  it('rejects join with wrong password', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD', 'secret123')

    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: 'Bob', password: 'wrong' },
    }
    const responses = processMessage('p2', joinMsg)
    const rejectResponse = responses.find((r) => r.type === 'join-rejected')
    expect(rejectResponse).toBeDefined()
    expect((rejectResponse!.payload as { reason: string }).reason).toBe('wrong-password')
    expect(useGameStore.getState().room!.players).toHaveLength(1)
  })

  it('sends room-state-sync on spectate-request', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const spectateMsg: PeerMessage = {
      type: 'spectate-request',
      senderId: 'p3',
      payload: { playerId: 'p3', nickname: 'Spectator' },
    }
    const responses = processMessage('p3', spectateMsg)
    expect(responses.some((r) => r.type === 'room-state-sync')).toBe(true)
    const spectator = useGameStore.getState().room!.players.find((p) => p.id === 'p3')
    expect(spectator?.isSpectator).toBe(true)
  })

  it('applies room-state-sync to synchronise state', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: 'Bob' },
    }
    const responses = processMessage('p2', joinMsg)
    const sync = responses.find((r) => r.type === 'room-state-sync')!

    resetGameStore()
    useGameStore.getState().setLocalPlayer('p2', 'Bob')
    processMessage('p1', sync)
    expect(useGameStore.getState().room).not.toBeNull()
    expect(useGameStore.getState().room!.players).toHaveLength(2)
    expect(useGameStore.getState().room!.code).toBe('ABCD')
  })
})

describe('Ready flow', () => {
  it('processes player-ready broadcast', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    const readyMsg: PeerMessage = {
      type: 'player-ready',
      senderId: 'p2',
      payload: { playerId: 'p2', ready: true },
    }
    processMessage('p2', readyMsg)
    const p2 = useGameStore.getState().room!.players.find((p) => p.id === 'p2')
    expect(p2?.isReady).toBe(true)
  })

  it('toggles ready state via player-ready message', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    processMessage('p2', { type: 'player-ready', senderId: 'p2', payload: { playerId: 'p2', ready: true } })
    processMessage('p2', { type: 'player-ready', senderId: 'p2', payload: { playerId: 'p2', ready: false } })
    const p2 = useGameStore.getState().room!.players.find((p) => p.id === 'p2')
    expect(p2?.isReady).toBe(false)
  })
})

describe('Rate limiting', () => {
  it('blocks messages exceeding per-type threshold', () => {
    const store = useGameStore.getState()
    store.setLocalPlayer('p1', 'Admin')
    store.createRoom('ABCD')
    store.addPlayer(makePlayer('p2', 'Bob'))
    const limiter = createRateLimiter()

    const readyMsg: PeerMessage = {
      type: 'player-ready',
      senderId: 'p2',
      payload: { playerId: 'p2', ready: true },
    }

    processMessage('p2', { ...readyMsg, payload: { playerId: 'p2', ready: true } }, limiter)
    processMessage('p2', { ...readyMsg, payload: { playerId: 'p2', ready: false } }, limiter)
    processMessage('p2', { ...readyMsg, payload: { playerId: 'p2', ready: true } }, limiter)

    const blocked = processMessage('p2', { ...readyMsg, payload: { playerId: 'p2', ready: false } }, limiter)
    expect(blocked).toEqual([])
  })

  it('does not rate-limit admin messages', () => {
    const store = useGameStore.getState()
    store.setLocalPlayer('p1', 'Admin')
    store.createRoom('ABCD')
    const limiter = createRateLimiter()

    const settingsMsg: PeerMessage = {
      type: 'settings-update',
      senderId: 'p1',
      payload: { totalRounds: 5 },
    }

    for (let i = 0; i < 10; i++) {
      const res = processMessage('p1', settingsMsg, limiter)
      expect(res).toEqual([])
    }
  })
})

describe('Input sanitisation', () => {
  it('validator rejects XSS in nickname (first line of defence)', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: '<script>alert("xss")</script>Bob' },
    }
    const responses = processMessage('p2', joinMsg)
    expect(responses).toEqual([])
    expect(useGameStore.getState().room!.players).toHaveLength(1)
  })

  it('validator rejects nickname exceeding max length', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const longName = 'A'.repeat(50)
    const joinMsg: PeerMessage = {
      type: 'join-room',
      senderId: 'p2',
      payload: { id: 'p2', nickname: longName },
    }
    const responses = processMessage('p2', joinMsg)
    expect(responses).toEqual([])
    expect(useGameStore.getState().room!.players).toHaveLength(1)
  })
})
