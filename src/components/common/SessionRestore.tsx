import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { usePeer } from '../../context/PeerContext'
import { useGameStore } from '../../stores/useGameStore'
import { usePeerStore } from '../../stores/usePeerStore'
import { loadSession, clearSession, saveSession, type PersistedSession } from '../../utils/session'
import { useLocale } from '../../locales'

export function SessionRestore() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const { createPeer, reconnectToPeer } = usePeer()
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const joinRoom = useGameStore((s) => s.joinRoom)
  const peerId = usePeerStore((s) => s.peerId)

  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<PersistedSession | null>(null)
  const isRestoringRef = useRef(false)
  const sessionRef = useRef<PersistedSession | null>(null)
  const navigatedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const s = loadSession()
    if (s) {
      setSession(s)
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (peerId && isRestoringRef.current && !navigatedRef.current) {
      navigatedRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      isRestoringRef.current = false
      const s = sessionRef.current!
      joinRoom(s.roomCode)
      reconnectToPeer(s.roomCode)
      saveSession(peerId, s.playerId, s.nickname, s.roomCode)
      navigate(`/room/${s.roomCode}`, { replace: true })
    }
  }, [peerId, joinRoom, reconnectToPeer, navigate])

  const handleYes = () => {
    if (!session) return
    const s = session
    if (s.peerId === s.roomCode) {
      clearSession()
      setOpen(false)
      setSession(null)
      return
    }
    setOpen(false)
    setLocalPlayer(s.playerId, s.nickname)
    sessionRef.current = s
    createPeer(s.peerId)
    isRestoringRef.current = true
    navigatedRef.current = false
    timerRef.current = setTimeout(() => {
      if (isRestoringRef.current) {
        isRestoringRef.current = false
        navigatedRef.current = false
        clearSession()
      }
    }, 10000)
  }

  const handleNo = () => {
    clearSession()
    setOpen(false)
    setSession(null)
  }

  return (
    <Dialog open={open} onClose={handleNo}>
      <DialogTitle>{t('restore.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {session && t('restore.message', { nickname: session.nickname, roomCode: session.roomCode })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleNo}>{t('restore.no')}</Button>
        <Button onClick={handleYes} variant="contained" autoFocus>{t('restore.yes')}</Button>
      </DialogActions>
    </Dialog>
  )
}
