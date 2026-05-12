import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Peer } from 'peerjs'
import { usePeerStore } from '../stores/usePeerStore'
import { useGameStore } from '../stores/useGameStore'
import type { PeerMessage, GameRoom, Answer, Player } from '../types'

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
          console.log(`[Peer] join-room from ${payload.nickname} (${payload.id})`)
          store.addPlayer({ id: payload.id, nickname: payload.nickname, isAdmin: false, isReady: false, score: 0 })
          const fresh = gameStore.getState()
          if (fresh.room?.adminId === fresh.localPlayerId) {
            console.log('[Peer] Admin: sending room-state-sync to joiner')
            const syncMsg: PeerMessage = {
              type: 'room-state-sync',
              senderId: fresh.localPlayerId!,
              payload: { room: fresh.room },
            }
            const conn = pStore.connections.get(connId)
            if (conn) conn.send(syncMsg)
            pStore.connections.forEach((c, pid) => {
              if (pid !== connId && c.open) {
                c.send({
                  type: 'join-room',
                  senderId: fresh.localPlayerId!,
                  payload: { id: payload.id, nickname: payload.nickname },
                } as PeerMessage)
              }
            })
          }
          break
        }
        case 'room-state-sync': {
          const payload = msg.payload as { room: GameRoom }
          const syncedRoom = payload.room
          if (syncedRoom) {
            console.log('[Peer] Received room-state-sync with', syncedRoom.players.length, 'players')
            gameStore.setState({ room: syncedRoom })
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
          if (p.letter) store.setPendingLetter(p.letter)
          store.setPhase('wheel')
          break
        }
        case 'answers-submit': {
          const p = msg.payload as { answers: Answer[] }
          store.pushAnswersToRound(p.answers)
          store.markPlayerSubmitted(msg.senderId)
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
        case 'round-end': {
          const reP = msg.payload as { roundScores: Record<string, number>; updatedPlayers: Player[] }
          gameStore.setState({ scores: reP.roundScores })
          store.updatePlayers(reP.updatedPlayers)
          const storeState = gameStore.getState()
          if (storeState.room && storeState.room.currentRound >= storeState.room.settings.totalRounds) {
            store.setPhase('game-over')
          } else {
            store.setPhase('round-results')
          }
          break
        }
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
        console.log(`[Peer] New connection from ${conn.peer}`)
        conn.on('open', () => {
          console.log(`[Peer] Incoming connection open from ${conn.peer}`)
          addConnection(conn.peer, conn)
          const store = gameStore.getState()
          if (store.room?.adminId === store.localPlayerId && store.room) {
            conn.send({
              type: 'room-state-sync',
              senderId: store.localPlayerId!,
              payload: { room: store.room },
            } as PeerMessage)
          }
          conn.on('data', (data) => {
            const msg = data as PeerMessage
            console.log(`[Peer] Data from ${conn.peer}: ${msg.type}`)
            handleRef.current(conn.peer, data)
          })
        })
        conn.on('close', () => {
          console.log(`[Peer] Connection closed from ${conn.peer}`)
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
      if (!currentPeer) { console.warn('[Peer] No peer to connect with'); return }
      console.log(`[Peer] Connecting to ${targetId}`)
      const conn = currentPeer.connect(targetId, { reliable: true })
      conn.on('open', () => {
        console.log(`[Peer] Connection open to ${targetId}`)
        addConnection(targetId, conn)
        conn.send({
          type: 'join-room',
          senderId: localPlayerIdRef.current ?? '',
          payload: {
            id: localPlayerIdRef.current,
            nickname: localNicknameRef.current,
          },
        } as PeerMessage)
        conn.on('data', (data) => {
          const msg = data as PeerMessage
          console.log(`[Peer] Data from ${targetId}: ${msg.type}`)
          handleRef.current(targetId, data)
        })
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
