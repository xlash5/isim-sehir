import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Paper, Divider, Container, Alert, CircularProgress, FormControlLabel, Switch, useMediaQuery, useTheme,
} from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LinkIcon from '@mui/icons-material/Link'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import HistoryIcon from '@mui/icons-material/History'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useGameStore } from '../stores/useGameStore'
import { usePeerStore } from '../stores/usePeerStore'
import { usePeer } from '../context/PeerContext'
import { generateRoomCode } from '../utils/letters'
import { saveSession } from '../utils/session'
import { sanitizeString } from '../utils/sanitize'
import { useLocale } from '../locales'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import type { PeerMessage } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [peerError, setPeerError] = useState(false)
  const peerId = usePeerStore((s) => s.peerId)
  const { createPeer, connectToPeer, sendMessage } = usePeer()
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const createRoom = useGameStore((s) => s.createRoom)
  const joinRoom = useGameStore((s) => s.joinRoom)
  const roomCodeRef = useRef<string | null>(null)
  const pendingActionRef = useRef<'create' | 'join' | null>(null)
  const navigatedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nicknameRef = useRef('')
  const [roomPassword, setRoomPassword] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinError, setJoinError] = useState('')
  const joinPasswordRef = useRef('')
  const awaitingJoinApprovalRef = useRef(false)
  const [isSpectator, setIsSpectator] = useState(false)
  const isSpectatorRef = useRef(false)

  useEffect(() => {
    isSpectatorRef.current = isSpectator
  }, [isSpectator])

  useEffect(() => {
    if (peerId && pendingActionRef.current && !navigatedRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setLoading(false)
      const code = roomCodeRef.current!
      if (pendingActionRef.current === 'join') {
        joinRoom(code)
        connectToPeer(code, joinPasswordRef.current, isSpectatorRef.current)
        if (joinPasswordRef.current) {
          pendingActionRef.current = null
          awaitingJoinApprovalRef.current = true
          return
        }
      } else {
        createRoom(code, roomPassword)
      }
      navigatedRef.current = true
      saveSession(peerId, useGameStore.getState().localPlayerId!, nicknameRef.current, code)
      setPeerError(false)
      navigate(`/room/${code}`)
      pendingActionRef.current = null
    }
  }, [peerId, joinRoom, createRoom, connectToPeer, navigate])

  const joinRejectedReason = useGameStore((s) => s.joinRejectedReason)
  const room = useGameStore((s) => s.room)

  useEffect(() => {
    if (!awaitingJoinApprovalRef.current) return
    if (joinRejectedReason) {
      awaitingJoinApprovalRef.current = false
      setLoading(false)
      setJoinError(joinRejectedReason === 'wrong-password' ? t('home.wrongPassword') : t('error.roomFull'))
      useGameStore.getState().clearJoinRejected()
      return
    }
    if (room && room.adminId && room.players.length > 1) {
      awaitingJoinApprovalRef.current = false
      setLoading(false)
      saveSession(peerId!, useGameStore.getState().localPlayerId!, nicknameRef.current, room.code)
      navigate(`/room/${room.code}`)
    }
  }, [joinRejectedReason, room, peerId, navigate, t])

  const handleRetryJoin = () => {
    if (!joinPassword) return
    setJoinError('')
    setLoading(true)
    joinPasswordRef.current = joinPassword
    awaitingJoinApprovalRef.current = true
    const msg: PeerMessage = {
      type: 'join-room',
      senderId: useGameStore.getState().localPlayerId!,
      payload: {
        id: useGameStore.getState().localPlayerId!,
        nickname: nicknameRef.current,
        password: joinPasswordRef.current,
      },
    } as PeerMessage
    sendMessage(roomCodeRef.current!, msg)
    setTimeout(() => {
      if (awaitingJoinApprovalRef.current) {
        awaitingJoinApprovalRef.current = false
        setLoading(false)
        setJoinError(t('home.joinTimeout'))
        useGameStore.getState().clearJoinRejected()
      }
    }, 15000)
  }

  const startPeerTimeout = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!peerId && pendingActionRef.current) {
        setLoading(false)
        setPeerError(true)
        pendingActionRef.current = null
        navigatedRef.current = false
      }
    }, 10000)
  }

  const validateNickname = (): boolean => {
    if (!nickname.trim()) {
      setNicknameError(t('home.nicknameRequired'))
      return false
    }
    if (nickname.trim().length > 20) {
      setNicknameError(t('home.nicknameTooLong'))
      return false
    }
    setNicknameError('')
    return true
  }

  const handleCreateRoom = () => {
    if (!validateNickname()) return
    const playerId = crypto.randomUUID()
    const clean = sanitizeString(nickname.trim(), 20)
    nicknameRef.current = clean
    setLocalPlayer(playerId, clean)
    const code = generateRoomCode()
    roomCodeRef.current = code
    createPeer(code)
    pendingActionRef.current = 'create'
    navigatedRef.current = false
    setPeerError(false)
    setJoinError('')
    setLoading(true)
    startPeerTimeout()
  }

  const handleJoinRoom = () => {
    if (!validateNickname()) return
    const trimmed = joinCode.trim().toUpperCase()
    if (!trimmed || trimmed.length < 4 || trimmed.length > 6 || !/^[A-Z0-9]{4,6}$/.test(trimmed)) {
      setCodeError(t('home.invalidCode'))
      return
    }
    setCodeError('')
    const playerId = crypto.randomUUID()
    const clean = sanitizeString(nickname.trim(), 20)
    nicknameRef.current = clean
    setLocalPlayer(playerId, clean)
    roomCodeRef.current = trimmed
    joinPasswordRef.current = joinPassword
    createPeer()
    pendingActionRef.current = 'join'
    navigatedRef.current = false
    setPeerError(false)
    setJoinError('')
    setLoading(true)
    startPeerTimeout()
    if (joinPassword) {
      setTimeout(() => {
        if (awaitingJoinApprovalRef.current) {
          awaitingJoinApprovalRef.current = false
          setLoading(false)
          setJoinError(t('home.joinTimeout'))
          useGameStore.getState().clearJoinRejected()
        }
      }, 15000)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <SportsEsportsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            {t('home.title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            {t('home.subtitle')}
          </Typography>
        </Box>

        <LanguageSwitcher />

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VpnKeyIcon fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('home.login')}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label={t('home.nickname')}
            placeholder={t('home.nicknamePlaceholder')}
            value={nickname}
            onChange={(e) => {
              if (e.target.value.length <= 20) setNickname(e.target.value)
              setNicknameError('')
            }}
            error={!!nicknameError}
            helperText={nicknameError}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('home.roomPassword')}
            placeholder={t('home.roomPasswordPlaceholder')}
            value={roomPassword}
            onChange={(e) => {
              if (e.target.value.length <= 30) setRoomPassword(e.target.value)
            }}
            sx={{ mb: 1.5 }}
            slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AddCircleIcon />}
            onClick={handleCreateRoom}
            disabled={loading}
            sx={{ mb: 1.5, minHeight: isMobile ? 44 : undefined }}
          >
            {t('home.createRoom')}
          </Button>

          <Divider sx={{ my: 2 }}>{t('home.or')}</Divider>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth
              label={t('home.roomCode')}
              placeholder={t('home.roomCodePlaceholder')}
              value={joinCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
                setJoinCode(val)
                setCodeError('')
              }}
              error={!!codeError}
              helperText={codeError}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace', letterSpacing: 4, fontSize: '1.2rem' } } }}
            />
          </Box>
          <TextField
            fullWidth
            label={t('home.roomPassword')}
            placeholder={t('home.roomPasswordPlaceholder')}
            value={joinPassword}
            onChange={(e) => {
              if (e.target.value.length <= 30) setJoinPassword(e.target.value)
            }}
            sx={{ mb: 1.5 }}
            slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isSpectator}
                onChange={(e) => setIsSpectator(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">{t('home.joinAsSpectator')}</Typography>
              </Box>
            }
            sx={{ mb: 1.5, ml: 0 }}
          />
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<LinkIcon />}
            onClick={handleJoinRoom}
            disabled={joinCode.length < 4 || loading}
            sx={{ minHeight: isMobile ? 44 : undefined }}
          >
            {t('home.joinRoom')}
          </Button>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('home.connecting')}
              </Typography>
            </Box>
          )}

          {joinError && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              action={
                <Button size="small" color="inherit" onClick={handleRetryJoin}>
                  {t('common.retry')}
                </Button>
              }
            >
              {joinError}
            </Alert>
          )}

          {peerError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t('home.connectionError')}
            </Alert>
          )}
        </Paper>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/history')}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            {t('history.cleared')}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
