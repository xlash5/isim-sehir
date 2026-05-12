import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { Peer } from 'peerjs'
import { usePeerStore } from '../stores/usePeerStore'
import { useGameStore } from '../stores/useGameStore'
import type { PeerMessage } from '../types'

interface PeerContextType {
  createPeer: (id?: string) => void
  connectToPeer: (peerId: string) => void
  sendMessage: (targetId: string, message: PeerMessage) => void
  broadcastMessage: (message: PeerMessage) => void
  disconnectAll: () => void
}

const PeerContext = createContext<PeerContextType | null>(null)

export function PeerProvider({ children }: { children: ReactNode }) {
  const { peer, setPeer, setPeerId, addConnection, removeConnection, disconnect } = usePeerStore()
  const { localPlayerId, localNickname, room } = useGameStore()

  const handleMessage = useCallback(
    (connId: string, data: unknown) => {
      const msg = data as PeerMessage
      const store = useGameStore.getState()

      switch (msg.type) {
        case 'join-room': {
          const payload = msg.payload as { id: string; nickname: string }
          store.addPlayer({ id: payload.id, nickname: payload.nickname, isAdmin: false, isReady: false, score: 0 })
          if (store.room?.adminId === store.localPlayerId) {
            const syncMsg: PeerMessage = {
              type: 'join-room',
              senderId: store.localPlayerId!,
              payload: {
                room: store.room,
              },
            }
            const conn = usePeerStore.getState().connections.get(connId)
            if (conn) conn.send(syncMsg)
          }
          break
        }
        case 'player-ready':
          store.setPlayerReady(
            (msg.payload as { playerId: string }).playerId,
            (msg.payload as { ready: boolean }).ready,
          )
          break
        case 'settings-update':
          store.updateSettings(msg.payload as Record<string, unknown>)
          break
        case 'game-start':
          store.setPhase('wheel')
          break
        case 'round-start': {
          const p = msg.payload as { letter: string }
          store.setPhase('wheel')
          setTimeout(() => {
            store.startRound(p.letter)
            const duration = useGameStore.getState().room?.settings.roundDuration ?? null
            if (duration !== null) store.setTimer(duration)
          }, 3000)
          break
        }
        case 'answers-submit': {
          const p = msg.payload as { answers: unknown[] }
          const round = store.room?.rounds[store.room.rounds.length - 1]
          if (round) {
            round.answers.push(...(p.answers as never[]))
            useGameStore.setState({ room: { ...store.room!, rounds: [...store.room!.rounds] } })
          }
          break
        }
        case 'vote':
          store.addVote(msg.payload as never)
          break
        case 'chat-message':
          store.addChatMessage(msg.payload as never)
          break
        case 'player-disconnected':
          store.removePlayer((msg.payload as { playerId: string }).playerId)
          break
      }
    },
    [],
  )

  const createPeer = useCallback(
    (id?: string) => {
      const p = id ? new Peer(id) : new Peer()
      p.on('open', (pid) => {
        setPeerId(pid)
      })
      p.on('connection', (conn) => {
        conn.on('open', () => {
          addConnection(conn.peer, conn)
          conn.on('data', (data) => handleMessage(conn.peer, data))
        })
        conn.on('close', () => {
          removeConnection(conn.peer)
        })
      })
      p.on('error', () => {
        if (!id) {
          const fallback = new Peer()
          fallback.on('open', (pid) => setPeerId(pid))
          setPeer(fallback)
          return
        }
      })
      setPeer(p)
    },
    [addConnection, removeConnection, setPeer, setPeerId, handleMessage],
  )

  const connectToPeer = useCallback(
    (targetId: string) => {
      if (!peer) return
      const conn = peer.connect(targetId, { reliable: true })
      conn.on('open', () => {
        addConnection(targetId, conn)
        conn.send({
          type: 'join-room',
          senderId: localPlayerId,
          payload: { id: localPlayerId, nickname: localNickname },
        } as PeerMessage)
        conn.on('data', (data) => handleMessage(targetId, data))
      })
      conn.on('close', () => {
        removeConnection(targetId)
      })
    },
    [peer, localPlayerId, localNickname, addConnection, removeConnection, handleMessage],
  )

  const sendMessage = useCallback(
    (targetId: string, message: PeerMessage) => {
      const conn = usePeerStore.getState().connections.get(targetId)
      if (conn && conn.open) {
        conn.send(message)
      }
    },
    [],
  )

  const broadcastMessage = useCallback(
    (message: PeerMessage) => {
      const { connections } = usePeerStore.getState()
      connections.forEach((conn) => {
        if (conn.open) {
          conn.send(message)
        }
      })
    },
    [],
  )

  const disconnectAll = useCallback(() => {
    disconnect()
  }, [disconnect])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return (
    <PeerContext.Provider value={{ createPeer, connectToPeer, sendMessage, broadcastMessage, disconnectAll }}>
      {children}
    </PeerContext.Provider>
  )
}

export function usePeer() {
  const ctx = useContext(PeerContext)
  if (!ctx) throw new Error('usePeer must be used within PeerProvider')
  return ctx
}
