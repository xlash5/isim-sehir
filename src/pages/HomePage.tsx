import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Paper, Divider, Container,
} from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LinkIcon from '@mui/icons-material/Link'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import { useGameStore } from '../stores/useGameStore'
import { usePeerStore } from '../stores/usePeerStore'
import { usePeer } from '../context/PeerContext'
import { generateRoomCode } from '../utils/letters'

export function HomePage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [pendingJoin, setPendingJoin] = useState<string | null>(null)
  const peerId = usePeerStore((s) => s.peerId)
  const { createPeer, connectToPeer } = usePeer()
  const setLocalPlayer = useGameStore((s) => s.setLocalPlayer)
  const createRoom = useGameStore((s) => s.createRoom)
  const joinRoom = useGameStore((s) => s.joinRoom)
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (peerId && pendingJoin && !navigatedRef.current) {
      navigatedRef.current = true
      joinRoom(pendingJoin)
      connectToPeer(pendingJoin)
      navigate(`/room/${pendingJoin}`)
      setPendingJoin(null)
    }
  }, [peerId, pendingJoin, joinRoom, connectToPeer, navigate])

  const validateNickname = (): boolean => {
    if (!nickname.trim()) {
      setNicknameError('Lütfen bir rumuz girin')
      return false
    }
    if (nickname.trim().length > 20) {
      setNicknameError('Rumuz en fazla 20 karakter olabilir')
      return false
    }
    setNicknameError('')
    return true
  }

  const handleCreateRoom = () => {
    if (!validateNickname()) return
    const playerId = crypto.randomUUID()
    setLocalPlayer(playerId, nickname.trim())
    const code = generateRoomCode()
    createPeer(code)
    createRoom()
    navigate(`/room/${code}`)
  }

  const handleJoinRoom = () => {
    if (!validateNickname()) return
    if (!joinCode.trim() || joinCode.trim().length !== 6 || !/^\d{6}$/.test(joinCode.trim())) {
      setCodeError('Geçerli 6 haneli oda kodu girin')
      return
    }
    setCodeError('')
    const playerId = crypto.randomUUID()
    setLocalPlayer(playerId, nickname.trim())
    createPeer()
    navigatedRef.current = false
    setPendingJoin(joinCode.trim())
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
            İsim Şehir
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            Klasik kelime oyunu, modern çok oyunculu versiyonu
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VpnKeyIcon fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Giriş
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Rumuzunuz"
            placeholder="Bir rumuz girin..."
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
            sx={{ mb: 1.5 }}
          >
            Oda Oluştur
          </Button>

          <Divider sx={{ my: 2 }}>veya</Divider>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth
              label="Oda Kodu"
              placeholder="6 haneli kod"
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
            disabled={joinCode.length !== 6}
          >
            Odaya Katıl
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
