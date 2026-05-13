import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeer } from '../../context/PeerContext'
import { useGameStore } from '../../stores/useGameStore'
import { usePeerStore } from '../../stores/usePeerStore'
import { loadSession, clearSession, saveSession, type PersistedSession } from '../../utils/session'

export function SessionRestore() {
  const navigate = useNavigate()
  const { createPeer, reconnectToPeer } = usePeer()
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const joinRoom = useGameStore((s) => s.joinRoom)
  const peerId = usePeerStore((s) => s.peerId)

  const isRestoringRef = useRef(false)
  const sessionRef = useRef<PersistedSession | null>(null)
  const navigatedRef = useRef(false)
  const initDoneRef = useRef(false)

  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true

    const s = loadSession()
    if (!s) return
    if (s.peerId === s.roomCode) {
      clearSession()
      return
    }

    sessionRef.current = s
    setLocalPlayer(s.playerId, s.nickname)
    createPeer(s.peerId)
    isRestoringRef.current = true
    navigatedRef.current = false

    setTimeout(() => {
      if (isRestoringRef.current) {
        isRestoringRef.current = false
        navigatedRef.current = false
        clearSession()
      }
    }, 10000)
  }, [])

  useEffect(() => {
    if (peerId && isRestoringRef.current && !navigatedRef.current) {
      navigatedRef.current = true
      isRestoringRef.current = false
      const s = sessionRef.current!
      joinRoom(s.roomCode)
      reconnectToPeer(s.roomCode)
      saveSession(peerId, s.playerId, s.nickname, s.roomCode)
      navigate(`/room/${s.roomCode}`, { replace: true })
    }
  }, [peerId, joinRoom, reconnectToPeer, navigate])

  return null
}
