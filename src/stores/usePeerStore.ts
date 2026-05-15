import { create } from 'zustand'
import type Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface PeerState {
  peer: Peer | null
  connections: Map<string, DataConnection>
  isConnected: boolean
  peerId: string | null
  connectionStatus: ConnectionStatus
  serverReachable: boolean | null

  setPeer: (peer: Peer) => void
  setPeerId: (id: string) => void
  addConnection: (playerId: string, conn: DataConnection) => void
  removeConnection: (playerId: string) => void
  setConnected: (connected: boolean) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  disconnect: () => void
  probeServer: () => Promise<void>
}

export const usePeerStore = create<PeerState>((set, get) => ({
  peer: null,
  connections: new Map(),
  isConnected: false,
  peerId: null,
  connectionStatus: 'disconnected',
  serverReachable: null,

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
    set({ peer: null, connections: new Map(), isConnected: false, peerId: null, connectionStatus: 'disconnected' })
  },

  probeServer: async () => {
    set({ serverReachable: null })
    try {
      const host = import.meta.env.VITE_PEER_HOST || 'localhost'
      const port = Number(import.meta.env.VITE_PEER_PORT) || 9000
      const protocol = location.protocol === 'https:' ? 'https' : 'http'
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 3000)
      await fetch(`${protocol}://${host}:${port}/`, {
        signal: controller.signal,
        mode: 'no-cors',
      })
      clearTimeout(id)
      set({ serverReachable: true })
    } catch {
      set({ serverReachable: false })
    }
  },
}))
