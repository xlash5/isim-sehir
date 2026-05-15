import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Peer } from 'peerjs'
import { usePeerStore } from '../stores/usePeerStore'
import { useGameStore } from '../stores/useGameStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { playSound } from '../utils/sounds'
import { validateMessage } from '../utils/messageValidator'
import type { PeerMessage, GameRoom, Answer, Player } from '../types'

function formatAdminTransferred(nickname: string): string {
  const locale = (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null) || 'tr'
  return locale === 'en' ? `${nickname} is the new admin.` : `${nickname} yeni admin oldu.`
}

function formatAdminTransferredByRequest(oldAdmin: string, newAdmin: string): string {
  const locale = (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null) || 'tr'
  return locale === 'en'
    ? `${oldAdmin} transferred admin to ${newAdmin}.`
    : `${oldAdmin} admin yetkisini ${newAdmin} kullanıcısına devretti.`
}

function formatPlayerDisconnected(nickname: string): string {
  const locale = (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null) || 'tr'
  return locale === 'en' ? `${nickname} left the game.` : `${nickname} oyundan ayrıldı.`
}

interface PeerContextType {
  createPeer: (id?: string) => void
  connectToPeer: (peerId: string) => void
  reconnectToPeer: (targetId: string) => void
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
  const peerToPlayerMap = useRef<Map<string, { playerId: string; nickname: string }>>(new Map())
  const lastHeartbeatAtRef = useRef<number>(Date.now())
  const adminPlayerIdRef = useRef<string | null>(null)
  const heartbeatSenderRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAdoptingPeerRef = useRef(false)
  const lastPongTimestampsRef = useRef<Map<string, number>>(new Map())
  const pingSenderRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      const msg = validateMessage(data)
      if (!msg) {
        if (import.meta.env.DEV) {
          console.warn('[Peer] Dropped invalid message', data)
        }
        return
      }
      const store = gameStore.getState()
      const pStore = peerStore.getState()

      switch (msg.type) {
        case 'join-room': {
          const payload = msg.payload as { id: string; nickname: string }
          console.log(`[Peer] join-room from ${payload.nickname} (${payload.id})`)
          if (payload.id !== store.localPlayerId) {
            playSound('player-connect')
          }
          store.addPlayer({ id: payload.id, nickname: payload.nickname, isAdmin: false, isReady: false, score: 0 })
          peerToPlayerMap.current.set(connId, { playerId: payload.id, nickname: payload.nickname })
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
            adminPlayerIdRef.current = syncedRoom.adminId
            lastHeartbeatAtRef.current = Date.now()
            gameStore.setState({ room: syncedRoom })
          }
          break
        }
        case 'player-ready':
          store.setPlayerReady(
            (msg.payload as { playerId: string }).playerId,
            (msg.payload as { ready: boolean }).ready,
          )
          {
            const fresh = gameStore.getState()
            if (fresh.room?.adminId === fresh.localPlayerId) {
              pStore.connections.forEach((c, pid) => {
                if (pid !== connId && c.open) {
                  c.send(msg as PeerMessage)
                }
              })
            }
          }
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
        case 'heartbeat':
          lastHeartbeatAtRef.current = Date.now()
          break
        case 'ping': {
          const pongMsg: PeerMessage = {
            type: 'pong',
            senderId: localPlayerIdRef.current ?? '',
            payload: {},
          }
          pStore.connections.get(connId)?.send(pongMsg)
          break
        }
        case 'pong': {
          lastPongTimestampsRef.current.set(connId, Date.now())
          const pStore = peerStore.getState()
          const now = Date.now()
          let allRecent = pStore.connections.size > 0
          for (const peerId of pStore.connections.keys()) {
            const lastPong = lastPongTimestampsRef.current.get(peerId) ?? 0
            if (now - lastPong > 15000) { allRecent = false; break }
          }
          if (allRecent && pStore.connectionStatus !== 'connected') {
            pStore.setConnectionStatus('connected')
            reconnectAttemptsRef.current = 0
            if (reconnectIntervalRef.current) {
              clearInterval(reconnectIntervalRef.current)
              reconnectIntervalRef.current = null
            }
          }
          break
        }
        case 'player-disconnected': {
          const { playerId } = msg.payload as { playerId: string }
          const currentState = gameStore.getState()
          const player = currentState.room?.players.find((p) => p.id === playerId)
          const nickname = player?.nickname ?? playerId
          const wasAdmin = currentState.room?.adminId === playerId
          playSound('player-disconnect')
          store.removePlayer(playerId)
          if (wasAdmin) {
            const fresh = gameStore.getState()
            const remaining = fresh.room?.players ?? []
            if (remaining.length > 0) {
              const newAdmin = remaining[0]
              store.transferAdmin(newAdmin.id)
              adminPlayerIdRef.current = newAdmin.id
              lastHeartbeatAtRef.current = Date.now()
              broadcastRef.current({
                type: 'admin-transfer',
                senderId: currentState.localPlayerId!,
                payload: { newAdminId: newAdmin.id },
              })
            }
          }
          store.addChatMessage({
            playerId: 'system',
            nickname: 'System',
            text: formatPlayerDisconnected(nickname),
            timestamp: Date.now(),
          })
          useNotificationStore.getState().show(formatPlayerDisconnected(nickname), 'warning')
          break
        }
        case 'admin-transfer': {
          const atPayload = msg.payload as { newAdminId: string }
          store.transferAdmin(atPayload.newAdminId)
          adminPlayerIdRef.current = atPayload.newAdminId
          const fresh = gameStore.getState()
          const newAdmin = fresh.room?.players.find((p) => p.id === atPayload.newAdminId)
          if (newAdmin) {
            store.addChatMessage({
              playerId: 'system',
              nickname: 'System',
              text: formatAdminTransferred(newAdmin.nickname),
              timestamp: Date.now(),
            })
          }
          break
        }
        case 'admin-transfer-request': {
          const atrPayload = msg.payload as { newAdminId: string }
          store.transferAdmin(atrPayload.newAdminId)
          adminPlayerIdRef.current = atrPayload.newAdminId
          const atrState = gameStore.getState()
          const oldAdminPlayer = atrState.room?.players.find((p) => p.id === msg.senderId)
          const newAdminPlayer = atrState.room?.players.find((p) => p.id === atrPayload.newAdminId)
          if (oldAdminPlayer && newAdminPlayer) {
            store.addChatMessage({
              playerId: 'system',
              nickname: 'System',
              text: formatAdminTransferredByRequest(oldAdminPlayer.nickname, newAdminPlayer.nickname),
              timestamp: Date.now(),
            })
          }
          break
        }
        case 'reconnect': {
          const reconnectPayload = msg.payload as { playerId: string; nickname: string }
          const storeState = gameStore.getState()
          if (storeState.room?.adminId === storeState.localPlayerId) {
            console.log(`[Peer] Reconnect from ${reconnectPayload.nickname} (${reconnectPayload.playerId})`)
            store.addPlayer({ id: reconnectPayload.playerId, nickname: reconnectPayload.nickname, isAdmin: false, isReady: false, score: 0 })
            peerToPlayerMap.current.set(connId, { playerId: reconnectPayload.playerId, nickname: reconnectPayload.nickname })
            const fresh = gameStore.getState()
            const ack: PeerMessage = {
              type: 'reconnect-accepted',
              senderId: storeState.localPlayerId!,
              payload: { room: fresh.room, timer: fresh.timer },
            }
            const conn = pStore.connections.get(connId)
            if (conn) conn.send(ack)
            pStore.connections.forEach((c, pid) => {
              if (pid !== connId && c.open) {
                c.send({
                  type: 'join-room',
                  senderId: storeState.localPlayerId!,
                  payload: { id: reconnectPayload.playerId, nickname: reconnectPayload.nickname },
                } as PeerMessage)
              }
            })
          }
          break
        }
        case 'reconnect-accepted': {
          const reconnPayload = msg.payload as { room: GameRoom; timer: number | null }
          if (reconnPayload.room) {
            console.log('[Peer] Reconnect accepted, applying room state and timer')
            adminPlayerIdRef.current = reconnPayload.room.adminId
            lastHeartbeatAtRef.current = Date.now()
            gameStore.setState({ room: reconnPayload.room, timer: reconnPayload.timer ?? null })
          }
          break
        }
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
  const broadcastRef = useRef<(msg: PeerMessage) => void>(() => {})
  const sendMessageRef = useRef<(targetId: string, msg: PeerMessage) => void>(() => {})

  const createPeer = useCallback(
    (id?: string) => {
      const p = id ? new Peer(id, PEER_OPTIONS) : new Peer(PEER_OPTIONS)
      p.on('open', (pid) => {
        setPeerId(pid)
        isAdoptingPeerRef.current = false
      })
      p.on('connection', (conn) => {
        console.log(`[Peer] New connection from ${conn.peer}`)
        conn.on('open', () => {
          console.log(`[Peer] Incoming connection open from ${conn.peer}`)
          addConnection(conn.peer, conn)
          lastPongTimestampsRef.current.set(conn.peer, Date.now())
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
        const handleIncomingClose = () => {
          console.log(`[Peer] Connection closed/errored from ${conn.peer}`)
          const mapping = peerToPlayerMap.current.get(conn.peer)
          if (mapping) {
            const store = gameStore.getState()
            const wasAdmin = store.room?.adminId === mapping.playerId
            playSound('player-disconnect')
            const disconnectMsg: PeerMessage = {
              type: 'player-disconnected',
              senderId: store.localPlayerId!,
              payload: { playerId: mapping.playerId },
            }
            broadcastRef.current(disconnectMsg)
            store.removePlayer(mapping.playerId)
            useNotificationStore.getState().show(
              formatPlayerDisconnected(mapping.nickname),
              'warning',
            )
            if (wasAdmin) {
              const fresh = gameStore.getState()
              const remaining = fresh.room?.players ?? []
              if (remaining.length > 0) {
                const newAdmin = remaining[0]
                store.transferAdmin(newAdmin.id)
                adminPlayerIdRef.current = newAdmin.id
                lastHeartbeatAtRef.current = Date.now()
                broadcastRef.current({
                  type: 'admin-transfer',
                  senderId: store.localPlayerId!,
                  payload: { newAdminId: newAdmin.id },
                })
              }
            }
            peerToPlayerMap.current.delete(conn.peer)
          }
          removeConnection(conn.peer)
          lastPongTimestampsRef.current.delete(conn.peer)
        }
        conn.on('close', handleIncomingClose)
        conn.on('error', handleIncomingClose)
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
    [addConnection, removeConnection, setPeer, setPeerId, gameStore],
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
        lastPongTimestampsRef.current.set(targetId, Date.now())
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
        const handleOutgoingClose = () => {
          console.log(`[Peer] Connection closed/errored to ${targetId}`)
          const activeConn = peerStore.getState().connections.get(targetId)
          if (activeConn !== conn) return
          removeConnection(targetId)
          lastPongTimestampsRef.current.delete(targetId)
          lastHeartbeatAtRef.current = Date.now()
          const store = gameStore.getState()
          if (!store.room) return
          if (targetId !== store.room.code) return
          const adminId = store.room.adminId
          const adminStillExists = store.room.players.some((p) => p.id === adminId)
          if (!adminStillExists) return
          const adminPlayer = store.room.players.find((p) => p.id === adminId)
          playSound('player-disconnect')
          broadcastRef.current({
            type: 'player-disconnected',
            senderId: store.localPlayerId!,
            payload: { playerId: adminId },
          })
          useNotificationStore.getState().show(
            formatPlayerDisconnected(adminPlayer?.nickname ?? adminId),
            'warning',
          )
          const remaining = store.room.players.filter((p) => p.id !== adminId)
          if (remaining.length > 0) {
            const newAdmin = remaining[0]
            store.transferAdmin(newAdmin.id)
            store.removePlayer(adminId)
            lastHeartbeatAtRef.current = Date.now()
            store.addChatMessage({
              playerId: 'system',
              nickname: 'System',
              text: formatAdminTransferred(newAdmin.nickname),
              timestamp: Date.now(),
            })
            adminPlayerIdRef.current = newAdmin.id
          } else {
            store.removePlayer(adminId)
          }
          const fresh = gameStore.getState()
          if (!fresh.room) return
          if (fresh.room.adminId === fresh.localPlayerId) {
            const pStore = peerStore.getState()
            if (pStore.peerId !== fresh.room.code && !isAdoptingPeerRef.current) {
              isAdoptingPeerRef.current = true
              pStore.peer?.destroy()
              createPeer(fresh.room.code)
            }
          } else {
            connectToPeer(fresh.room.code)
          }
        }
      conn.on('close', handleOutgoingClose)
      conn.on('error', handleOutgoingClose)
    },
    [addConnection, removeConnection, peerStore, gameStore],
  )

  const reconnectToPeer = useCallback(
    (targetId: string) => {
      const currentPeer = peerStore.getState().peer
      if (!currentPeer) { console.warn('[Peer] No peer to reconnect with'); return }
      console.log(`[Peer] Reconnecting to ${targetId}`)
      const conn = currentPeer.connect(targetId, { reliable: true })
      conn.on('open', () => {
        console.log(`[Peer] Reconnect connection open to ${targetId}`)
        addConnection(targetId, conn)
        lastPongTimestampsRef.current.set(targetId, Date.now())
        conn.send({
          type: 'reconnect',
          senderId: localPlayerIdRef.current ?? '',
          payload: { playerId: localPlayerIdRef.current, nickname: localNicknameRef.current },
        } as PeerMessage)
        conn.on('data', (data) => {
          const msg = data as PeerMessage
          console.log(`[Peer] Data from ${targetId}: ${msg.type}`)
          handleRef.current(targetId, data)
        })
      })
      const handleReconnectClose = () => {
        console.log(`[Peer] Reconnect connection closed/errored to ${targetId}`)
        const activeConn = peerStore.getState().connections.get(targetId)
        if (activeConn !== conn) return
        removeConnection(targetId)
        lastPongTimestampsRef.current.delete(targetId)
        lastHeartbeatAtRef.current = Date.now()
        const store = gameStore.getState()
        if (!store.room) return
        if (targetId !== store.room.code) return
        const adminId = store.room.adminId
        const adminStillExists = store.room.players.some((p) => p.id === adminId)
        if (!adminStillExists) return
        const adminPlayer = store.room.players.find((p) => p.id === adminId)
        playSound('player-disconnect')
        broadcastRef.current({
          type: 'player-disconnected',
          senderId: store.localPlayerId!,
          payload: { playerId: adminId },
        })
        useNotificationStore.getState().show(
          formatPlayerDisconnected(adminPlayer?.nickname ?? adminId),
          'warning',
        )
        const remaining = store.room.players.filter((p) => p.id !== adminId)
        if (remaining.length > 0) {
          const newAdmin = remaining[0]
          store.transferAdmin(newAdmin.id)
          store.removePlayer(adminId)
          lastHeartbeatAtRef.current = Date.now()
          store.addChatMessage({
            playerId: 'system',
            nickname: 'System',
            text: formatAdminTransferred(newAdmin.nickname),
            timestamp: Date.now(),
          })
          adminPlayerIdRef.current = newAdmin.id
        } else {
          store.removePlayer(adminId)
        }
        const fresh = gameStore.getState()
        if (!fresh.room) return
        if (fresh.room.adminId === fresh.localPlayerId) {
          const pStore = peerStore.getState()
          if (pStore.peerId !== fresh.room.code && !isAdoptingPeerRef.current) {
            isAdoptingPeerRef.current = true
            pStore.peer?.destroy()
            createPeer(fresh.room.code)
          }
        } else {
          connectToPeer(fresh.room.code)
        }
      }
      conn.on('close', handleReconnectClose)
      conn.on('error', handleReconnectClose)
    },
    [addConnection, removeConnection, peerStore, gameStore],
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

  broadcastRef.current = broadcastMessage
  sendMessageRef.current = sendMessage
  const connectToPeerRef = useRef(connectToPeer)
  connectToPeerRef.current = connectToPeer

  const disconnectAll = useCallback(() => {
    disconnect()
  }, [disconnect])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  useEffect(() => {
    if (heartbeatSenderRef.current) return
    heartbeatSenderRef.current = setInterval(() => {
      const store = gameStore.getState()
      if (store.localPlayerId === store.room?.adminId) {
        broadcastMessage({
          type: 'heartbeat',
          senderId: store.localPlayerId!,
          payload: {},
        })
      }
    }, 8000)
    return () => {
      if (heartbeatSenderRef.current) {
        clearInterval(heartbeatSenderRef.current)
        heartbeatSenderRef.current = null
      }
    }
  }, [gameStore, broadcastMessage])

  useEffect(() => {
    if (heartbeatMonitorRef.current) return
    heartbeatMonitorRef.current = setInterval(() => {
      const store = gameStore.getState()
      if (!store.room || store.localPlayerId === store.room.adminId) return
      if (Date.now() - lastHeartbeatAtRef.current > 25000) {
        lastHeartbeatAtRef.current = Date.now()
        const adminId = store.room.adminId
        const adminStillExists = store.room.players.some((p) => p.id === adminId)
        if (!adminStillExists) return
        const adminPlayer = store.room.players.find((p) => p.id === adminId)
        playSound('player-disconnect')
        broadcastRef.current({
          type: 'player-disconnected',
          senderId: store.localPlayerId!,
          payload: { playerId: adminId },
        })
        useNotificationStore.getState().show(
          formatPlayerDisconnected(adminPlayer?.nickname ?? adminId),
          'warning',
        )
        const remaining = store.room.players.filter((p) => p.id !== adminId)
        if (remaining.length > 0) {
          const newAdmin = remaining[0]
          store.transferAdmin(newAdmin.id)
          store.removePlayer(adminId)
          lastHeartbeatAtRef.current = Date.now()
          store.addChatMessage({
            playerId: 'system',
            nickname: 'System',
            text: formatAdminTransferred(newAdmin.nickname),
            timestamp: Date.now(),
          })
          adminPlayerIdRef.current = newAdmin.id
        } else {
          store.removePlayer(adminId)
        }
        const fresh = gameStore.getState()
        if (!fresh.room) return
        if (fresh.room.adminId === fresh.localPlayerId) {
          const pStore = peerStore.getState()
          if (pStore.peerId !== fresh.room.code && !isAdoptingPeerRef.current) {
            isAdoptingPeerRef.current = true
            pStore.peer?.destroy()
            createPeer(fresh.room.code)
          }
        } else {
          connectToPeer(fresh.room.code)
        }
      }
    }, 5000)
    return () => {
      if (heartbeatMonitorRef.current) {
        clearInterval(heartbeatMonitorRef.current)
        heartbeatMonitorRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (pingSenderRef.current) return
    pingSenderRef.current = setInterval(() => {
      const msg: PeerMessage = {
        type: 'ping',
        senderId: localPlayerIdRef.current ?? '',
        payload: {},
      }
      broadcastRef.current(msg)
    }, 10000)
    return () => {
      if (pingSenderRef.current) {
        clearInterval(pingSenderRef.current)
        pingSenderRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    pingMonitorRef.current = setInterval(() => {
      const pStore = peerStore.getState()
      const gStore = gameStore.getState()
      const now = Date.now()

      if (!gStore.room) {
        pStore.setConnectionStatus('connected')
        return
      }

      const connections = pStore.connections
      if (connections.size === 0) return

      let allRecent = true
      let anyStale = false

      for (const peerId of connections.keys()) {
        const lastPong = lastPongTimestampsRef.current.get(peerId) ?? 0
        if (now - lastPong > 15000) {
          allRecent = false
          if (lastPong > 0) anyStale = true
        }
      }

      const currentStatus = pStore.connectionStatus

      if (allRecent) {
        if (currentStatus !== 'connected') {
          pStore.setConnectionStatus('connected')
          reconnectAttemptsRef.current = 0
          if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current)
            reconnectIntervalRef.current = null
          }
        }
      } else if (anyStale && currentStatus === 'connected') {
        pStore.setConnectionStatus('reconnecting')
        if (!reconnectIntervalRef.current) {
          reconnectAttemptsRef.current = 0
          reconnectIntervalRef.current = setInterval(() => {
            reconnectAttemptsRef.current++
            if (reconnectAttemptsRef.current > 6) {
              peerStore.getState().setConnectionStatus('disconnected')
              if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current)
                reconnectIntervalRef.current = null
              }
              return
            }
            const gStoreState = gameStore.getState()
            if (gStoreState.room && gStoreState.localPlayerId !== gStoreState.room.adminId) {
              connectToPeerRef.current(gStoreState.room.code)
            }
          }, 5000)
        }
      }
    }, 5000)

    return () => {
      if (pingMonitorRef.current) {
        clearInterval(pingMonitorRef.current)
        pingMonitorRef.current = null
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current)
        reconnectIntervalRef.current = null
      }
    }
  }, [peerStore, gameStore])

  return (
    <PeerContext.Provider value={{ createPeer, connectToPeer, reconnectToPeer, sendMessage, broadcastMessage, disconnectAll }}>
      {children}
    </PeerContext.Provider>
  )
}

export function usePeer() {
  const ctx = useContext(PeerContext)
  if (!ctx) throw new Error('usePeer must be used within PeerProvider')
  return ctx
}
