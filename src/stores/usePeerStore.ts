import { create } from 'zustand'
import type Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

export type ConnectionStatus = 'idle' | 'connected' | 'reconnecting' | 'disconnected'

interface PeerState {
  peer: Peer | null
  connections: Map<string, DataConnection>
  isConnected: boolean
  peerId: string | null
  connectionStatus: ConnectionStatus
  serverReachable: boolean | null
  probeRetryAttempt: number
  sustainedUnreachable: boolean

  setPeer: (peer: Peer) => void
  setPeerId: (id: string) => void
  addConnection: (playerId: string, conn: DataConnection) => void
  removeConnection: (playerId: string) => void
  setConnected: (connected: boolean) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  disconnect: () => void
  probeServer: () => Promise<void>
  retryProbe: () => Promise<void>
  resetProbeState: () => void
}

export const usePeerStore = create<PeerState>((set, get) => ({
  peer: null,
  connections: new Map(),
  isConnected: false,
  peerId: null,
  connectionStatus: 'idle',
  serverReachable: null,
  probeRetryAttempt: 0,
  sustainedUnreachable: false,

  setPeer: (peer) => set({ peer }),

  setPeerId: (id) => set({ peerId: id }),

  addConnection: (playerId, conn) =>
    set((state) => {
      const connections = new Map(state.connections)
      connections.set(playerId, conn)
      return { connections, isConnected: true }
    }),

  removeConnection: (playerId) =>
    set((state) => {
      const connections = new Map(state.connections)
      connections.delete(playerId)
      return { connections, isConnected: connections.size > 0 }
    }),

  setConnected: (connected) => set({ isConnected: connected }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  disconnect: () => {
    const state = get()
    state.connections.forEach((conn) => conn.close())
    state.peer?.destroy()
    set({ peer: null, connections: new Map(), isConnected: false, peerId: null, connectionStatus: 'idle' })
  },

  probeServer: async () => {
    set({ serverReachable: null })
    try {
      const host = import.meta.env.VITE_PEER_HOST || 'localhost'
      const port = Number(import.meta.env.VITE_HEALTH_PORT) || Number(import.meta.env.VITE_PEER_PORT) + 1 || 9001
      const protocol = location.protocol === 'https:' ? 'https' : 'http'
      const res = await fetch(`${protocol}://${host}:${port}/isim-sehir/health`, {
        signal: AbortSignal.timeout(5000),
      })
      set({ serverReachable: res.ok, probeRetryAttempt: 0, sustainedUnreachable: false })
    } catch {
      const state = get()
      const sustained = state.sustainedUnreachable
      const wasEverReachable = state.serverReachable !== null && state.serverReachable !== undefined
      set({ serverReachable: false, sustainedUnreachable: sustained || (wasEverReachable && state.serverReachable === false) })
    }
  },

  retryProbe: async () => {
    const backoff = [0, 2000, 5000, 10000]
    const attempt = get().probeRetryAttempt ?? 0
    const delay = backoff[Math.min(attempt, backoff.length - 1)]
    set({ probeRetryAttempt: attempt + 1 })
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay))
    }
    await get().probeServer()
  },

  resetProbeState: () => set({ probeRetryAttempt: 0, sustainedUnreachable: false }),
}))
