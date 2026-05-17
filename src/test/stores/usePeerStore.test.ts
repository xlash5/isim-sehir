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
      connectionStatus: 'disconnected',
      serverReachable: null,
    })
  })

  it('has correct initial state', () => {
    const state = usePeerStore.getState()
    expect(state.peer).toBeNull()
    expect(state.connections.size).toBe(0)
    expect(state.isConnected).toBe(false)
    expect(state.peerId).toBeNull()
    expect(state.connectionStatus).toBe('disconnected')
    expect(state.serverReachable).toBeNull()
  })

  it('setPeer updates peer', () => {
    const fakePeer = {} as any
    usePeerStore.getState().setPeer(fakePeer)
    expect(usePeerStore.getState().peer).toBe(fakePeer)
  })

  it('setPeerId updates id', () => {
    usePeerStore.getState().setPeerId('abc123')
    expect(usePeerStore.getState().peerId).toBe('abc123')
  })

  it('addConnection adds and sets isConnected', () => {
    const fakeConn = { close: vi.fn() } as any
    usePeerStore.getState().addConnection('p1', fakeConn)
    const state = usePeerStore.getState()
    expect(state.connections.get('p1')).toBe(fakeConn)
    expect(state.isConnected).toBe(true)
  })

  it('removeConnection removes and updates isConnected', () => {
    const fakeConn = { close: vi.fn() } as any
    usePeerStore.getState().addConnection('p1', fakeConn)
    usePeerStore.getState().removeConnection('p1')
    const state = usePeerStore.getState()
    expect(state.connections.has('p1')).toBe(false)
    expect(state.isConnected).toBe(false)
  })

  it('setConnected updates isConnected', () => {
    usePeerStore.getState().setConnected(true)
    expect(usePeerStore.getState().isConnected).toBe(true)
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
    expect(state.connectionStatus).toBe('disconnected')
  })

  it('probeServer sets serverReachable to false on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    await usePeerStore.getState().probeServer()
    expect(usePeerStore.getState().serverReachable).toBe(false)
  })
})
