import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../stores/useGameStore'
import { processMessage, resetGameStore, makePlayer } from './helpers'
import type { PeerMessage } from '../../types'

beforeEach(() => {
  resetGameStore()
})

describe('Admin transfer', () => {
  it('transfers admin when current admin disconnects', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().addPlayer(makePlayer('p3', 'Charlie'))

    const disconnectMsg: PeerMessage = {
      type: 'player-disconnected',
      senderId: 'p2',
      payload: { playerId: 'p1' },
    }
    const responses = processMessage('p2', disconnectMsg)

    const state = useGameStore.getState()
    expect(state.room!.adminId).toBe('p2')
    expect(state.room!.players.find((p) => p.id === 'p1')).toBeUndefined()
    expect(state.room!.players.find((p) => p.id === 'p2')!.isAdmin).toBe(true)
    const transferResponse = responses.find((r) => r.type === 'admin-transfer')
    expect(transferResponse).toBeDefined()
    expect((transferResponse!.payload as { newAdminId: string }).newAdminId).toBe('p2')
  })

  it('new admin is the first non-spectator player', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().addPlayer(makePlayer('p3', 'Charlie'))

    const disconnectMsg: PeerMessage = {
      type: 'player-disconnected',
      senderId: 'p2',
      payload: { playerId: 'p1' },
    }
    processMessage('p2', disconnectMsg)

    const state = useGameStore.getState()
    expect(state.room!.adminId).toBe('p2')
    expect(state.room!.players.find((p) => p.id === 'p2')!.isAdmin).toBe(true)
  })

  it('skips admin transfer when only spectators remain', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Spectator', { isSpectator: true }))

    const disconnectMsg: PeerMessage = {
      type: 'player-disconnected',
      senderId: 'p2',
      payload: { playerId: 'p1' },
    }
    const responses = processMessage('p2', disconnectMsg)

    const state = useGameStore.getState()
    expect(state.room!.players).toHaveLength(1)
    expect(state.room!.players[0].id).toBe('p2')
    const transferResponse = responses.find((r) => r.type === 'admin-transfer')
    expect(transferResponse).toBeUndefined()
  })

  it('handles voluntary admin transfer via admin-transfer message', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))
    useGameStore.getState().addPlayer(makePlayer('p3', 'Charlie'))

    const transferMsg: PeerMessage = {
      type: 'admin-transfer',
      senderId: 'p1',
      payload: { newAdminId: 'p3' },
    }
    processMessage('p1', transferMsg)

    const state = useGameStore.getState()
    expect(state.room!.adminId).toBe('p3')
    expect(state.room!.players.find((p) => p.id === 'p3')!.isAdmin).toBe(true)
    expect(state.room!.players.find((p) => p.id === 'p1')!.isAdmin).toBe(false)
  })

  it('removes disconnected non-admin player without admin transfer', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')
    useGameStore.getState().addPlayer(makePlayer('p2', 'Bob'))

    const disconnectMsg: PeerMessage = {
      type: 'player-disconnected',
      senderId: 'p1',
      payload: { playerId: 'p2' },
    }
    const responses = processMessage('p1', disconnectMsg)

    const state = useGameStore.getState()
    expect(state.room!.players).toHaveLength(1)
    expect(state.room!.players[0].id).toBe('p1')
    expect(state.room!.adminId).toBe('p1')
    const transferResponse = responses.find((r) => r.type === 'admin-transfer')
    expect(transferResponse).toBeUndefined()
  })

  it('settings-update changes room settings', () => {
    useGameStore.getState().setLocalPlayer('p1', 'Admin')
    useGameStore.getState().createRoom('ABCD')

    const settingsMsg: PeerMessage = {
      type: 'settings-update',
      senderId: 'p1',
      payload: { totalRounds: 5 },
    }
    processMessage('p1', settingsMsg)
    expect(useGameStore.getState().room!.settings.totalRounds).toBe(5)
  })
})
