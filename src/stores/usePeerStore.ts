import { create } from 'zustand'
import type Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

interface PeerState {
  peer: Peer | null
  connections: Map<string, DataConnection>
  isConnected: boolean
  peerId: string | null

  setPeer: (peer: Peer) => void
  setPeerId: (id: string) => void
  addConnection: (playerId: string, conn: DataConnection) => void
  removeConnection: (playerId: string) => void
  setConnected: (connected: boolean) => void
  disconnect: () => void
}

export const usePeerStore = create<PeerState>((set, get) => ({
  peer: null,
  connections: new Map(),
  isConnected: false,
  peerId: null,

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

  disconnect: () => {
    const state = get()
    state.connections.forEach((conn) => conn.close())
    state.peer?.destroy()
    set({ peer: null, connections: new Map(), isConnected: false, peerId: null })
  },
}))
