import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Paper, Divider, Container, Alert, CircularProgress,
} from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LinkIcon from '@mui/icons-material/Link'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import HistoryIcon from '@mui/icons-material/History'
import { useGameStore } from '../stores/useGameStore'
import { usePeerStore } from '../stores/usePeerStore'
import { usePeer } from '../context/PeerContext'
import { generateRoomCode } from '../utils/letters'
import { saveSession } from '../utils/session'
import { useLocale } from '../locales'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'

export function HomePage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [peerError, setPeerError] = useState(false)
  const peerId = usePeerStore((s) => s.peerId)
  const { createPeer, connectToPeer } = usePeer()
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const createRoom = useGameStore((s) => s.createRoom)
  const joinRoom = useGameStore((s) => s.joinRoom)
  const roomCodeRef = useRef<string | null>(null)
  const pendingActionRef = useRef<'create' | 'join' | null>(null)
  const navigatedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nicknameRef = useRef('')

  useEffect(() => {
    if (peerId && pendingActionRef.current && !navigatedRef.current) {
      navigatedRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      setLoading(false)
      const code = roomCodeRef.current!
      if (pendingActionRef.current === 'join') {
        joinRoom(code)
        connectToPeer(code)
      } else {
        createRoom(code)
      }
      saveSession(peerId, useGameStore.getState().localPlayerId!, nicknameRef.current, code)
      setPeerError(false)
      navigate(`/room/${code}`)
      pendingActionRef.current = null
    }
  }, [peerId, joinRoom, createRoom, connectToPeer, navigate])

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
    nicknameRef.current = nickname.trim()
    setLocalPlayer(playerId, nickname.trim())
    const code = generateRoomCode()
    roomCodeRef.current = code
    createPeer(code)
    pendingActionRef.current = 'create'
    navigatedRef.current = false
    setPeerError(false)
    setLoading(true)
    startPeerTimeout()
  }

  const handleJoinRoom = () => {
    if (!validateNickname()) return
    if (!joinCode.trim() || joinCode.trim().length !== 6 || !/^\d{6}$/.test(joinCode.trim())) {
      setCodeError(t('home.invalidCode'))
      return
    }
    setCodeError('')
    const playerId = crypto.randomUUID()
    nicknameRef.current = nickname.trim()
    setLocalPlayer(playerId, nickname.trim())
    roomCodeRef.current = joinCode.trim()
    createPeer()
    pendingActionRef.current = 'join'
    navigatedRef.current = false
    setPeerError(false)
    setLoading(true)
    startPeerTimeout()
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
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AddCircleIcon />}
            onClick={handleCreateRoom}
            disabled={loading}
            sx={{ mb: 1.5 }}
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
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setJoinCode(val)
                setCodeError('')
              }}
              error={!!codeError}
              helperText={codeError}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace', letterSpacing: 4, fontSize: '1.2rem' } } }}
            />
          </Box>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<LinkIcon />}
            onClick={handleJoinRoom}
            disabled={joinCode.length !== 6 || loading}
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
