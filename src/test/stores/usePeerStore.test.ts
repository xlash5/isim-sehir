import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePeerStore } from '../../stores/usePeerStore'

vi.mock('peerjs', () => {
  const MockPeer = vi.fn()
  return { default: MockPeer }
})

describe('usePeerStore', () => {
  beforeEach(() => {
    usePeerStore.setState({
      peer: null,
      connections: new Map(),
      isConnected: false,
      peerId: null,
      connectionStatus: 'idle',
      serverReachable: null,
    })
  })

  it('has correct initial state', () => {
    const state = usePeerStore.getState()
    expect(state.peer).toBeNull()
    expect(state.connections.size).toBe(0)
    expect(state.isConnected).toBe(false)
    expect(state.peerId).toBeNull()
    expect(state.connectionStatus).toBe('idle')
  })

  it('setConnectionStatus updates status', () => {
    usePeerStore.getState().setConnectionStatus('reconnecting')
    expect(usePeerStore.getState().connectionStatus).toBe('reconnecting')
  })

  it('disconnect clears everything', () => {
    const closeFn = vi.fn()
    const destroyFn = vi.fn()
    const fakeConn = { close: closeFn } as any
    const fakePeer = { destroy: destroyFn } as any
    usePeerStore.getState().setPeer(fakePeer)
    usePeerStore.getState().addConnection('p1', fakeConn)
    usePeerStore.getState().setConnected(true)
    usePeerStore.getState().setPeerId('abc')
    usePeerStore.getState().disconnect()
    const state = usePeerStore.getState()
    expect(closeFn).toHaveBeenCalled()
    expect(destroyFn).toHaveBeenCalled()
    expect(state.peer).toBeNull()
    expect(state.connections.size).toBe(0)
    expect(state.isConnected).toBe(false)
    expect(state.peerId).toBeNull()
    expect(state.connectionStatus).toBe('idle')
  })

  it('probeServer sets serverReachable to false on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    await usePeerStore.getState().probeServer()
    expect(usePeerStore.getState().serverReachable).toBe(false)
  })
})
