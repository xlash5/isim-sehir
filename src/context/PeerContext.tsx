import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Peer } from 'peerjs'
import { usePeerStore } from '../stores/usePeerStore'
import { useGameStore } from '../stores/useGameStore'
import type { PeerMessage, GameRoom } from '../types'

interface PeerContextType {
  createPeer: (id?: string) => void
  connectToPeer: (peerId: string) => void
  sendMessage: (targetId: string, message: PeerMessage) => void
  broadcastMessage: (message: PeerMessage) => void
  disconnectAll: () => void
}

const PEER_OPTIONS = {
  host: import.meta.env.VITE_PEER_HOST || 'localhost',
  port: Number(import.meta.env.VITE_PEER_PORT) || 9000,
  path: import.meta.env.VITE_PEER_PATH || '/isim-sehir',
}

const PeerContext = createContext<PeerContextType | null>(null)

export function PeerProvider({ children }: { children: ReactNode }) {
  const { setPeer, setPeerId, addConnection, removeConnection, disconnect } = usePeerStore()
  const localPlayerIdRef = useRef<string | null>(null)
  const localNicknameRef = useRef<string | null>(null)

  const gameStore = useGameStore
  const peerStore = usePeerStore

  useEffect(() => {
    const unsub = gameStore.subscribe((s) => {
      localPlayerIdRef.current = s.localPlayerId
      localNicknameRef.current = s.localNickname
    })
    return unsub
  }, [gameStore])

  const handleMessage = useCallback(
    (connId: string, data: unknown) => {
      const msg = data as PeerMessage
      const store = gameStore.getState()
      const pStore = peerStore.getState()

      switch (msg.type) {
        case 'join-room': {
          const payload = msg.payload as { id: string; nickname: string }
          store.addPlayer({ id: payload.id, nickname: payload.nickname, isAdmin: false, isReady: false, score: 0 })
          if (store.room?.adminId === store.localPlayerId) {
            const syncMsg: PeerMessage = {
              type: 'room-state-sync',
              senderId: store.localPlayerId!,
              payload: { room: store.room },
            }
            const conn = pStore.connections.get(connId)
            if (conn) conn.send(syncMsg)
            pStore.connections.forEach((c, pid) => {
              if (pid !== connId && c.open) {
                c.send({
                  type: 'join-room',
                  senderId: store.localPlayerId!,
                  payload: { id: payload.id, nickname: payload.nickname },
                } as PeerMessage)
              }
            })
          }
          break
        }
        case 'room-state-sync': {
          const payload = msg.payload as { room: GameRoom }
          const room = payload.room
          if (room) {
            gameStore.setState({ room })
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
            const duration = gameStore.getState().room?.settings.roundDuration ?? null
            if (duration !== null) store.setTimer(duration)
          }, 3000)
          break
        }
        case 'answers-submit': {
          const p = msg.payload as { answers: unknown[] }
          const currentRoom = store.room
          if (!currentRoom) break
          const round = currentRoom.rounds[currentRoom.rounds.length - 1]
          if (round) {
            round.answers.push(...(p.answers as never[]))
            gameStore.setState({ room: { ...currentRoom, rounds: [...currentRoom.rounds] } })
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
    [gameStore, peerStore],
  )

  const handleRef = useRef(handleMessage)
  handleRef.current = handleMessage

  const createPeer = useCallback(
    (id?: string) => {
      const p = id ? new Peer(id, PEER_OPTIONS) : new Peer(PEER_OPTIONS)
      p.on('open', (pid) => {
        setPeerId(pid)
      })
      p.on('connection', (conn) => {
        conn.on('open', () => {
          addConnection(conn.peer, conn)
          conn.on('data', (data) => handleRef.current(conn.peer, data))
        })
        conn.on('close', () => {
          removeConnection(conn.peer)
        })
      })
      p.on('error', (err) => {
        console.error(`[Peer] Error${id ? ' (id: ' + id + ')' : ''}:`, err)
        if (!id) {
          const fallback = new Peer(PEER_OPTIONS)
          fallback.on('open', (pid) => setPeerId(pid))
          setPeer(fallback)
        }
      })
      setPeer(p)
    },
    [addConnection, removeConnection, setPeer, setPeerId],
  )

  const connectToPeer = useCallback(
    (targetId: string) => {
      const currentPeer = peerStore.getState().peer
      if (!currentPeer) return
      const conn = currentPeer.connect(targetId, { reliable: true })
      conn.on('open', () => {
        addConnection(targetId, conn)
        conn.send({
          type: 'join-room',
          senderId: localPlayerIdRef.current ?? '',
          payload: {
            id: localPlayerIdRef.current,
            nickname: localNicknameRef.current,
          },
        } as PeerMessage)
        conn.on('data', (data) => handleRef.current(targetId, data))
      })
      conn.on('close', () => {
        removeConnection(targetId)
      })
    },
    [addConnection, removeConnection, peerStore],
  )

  const sendMessage = useCallback(
    (targetId: string, message: PeerMessage) => {
      const conn = peerStore.getState().connections.get(targetId)
      if (conn && conn.open) {
        conn.send(message)
      }
    },
    [peerStore],
  )

  const broadcastMessage = useCallback(
    (message: PeerMessage) => {
      const { connections } = peerStore.getState()
      connections.forEach((conn) => {
        if (conn.open) {
          conn.send(message)
        }
      })
    },
    [peerStore],
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
