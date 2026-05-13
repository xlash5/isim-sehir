import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Grid2 as Grid, Typography, Button, Paper,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import { useGameStore } from '../stores/useGameStore'
import { usePeer } from '../context/PeerContext'
import { useGame } from '../hooks/useGame'
import { useLocale } from '../locales'
import { PlayerList } from '../components/Lobby/PlayerList'
import { GameSettingsPanel } from '../components/Lobby/GameSettingsPanel'
import { ChatBox } from '../components/common/ChatBox'
import { CopyCode } from '../components/common/CopyCode'
import type { PeerMessage } from '../types'

export function LobbyPage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const room = useGameStore((s) => s.room)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const setPlayerReady = useGameStore((s) => s.setPlayerReady)
  const { broadcastMessage } = usePeer()
  const { startGame, sendChatMessage } = useGame()

  useEffect(() => {
    const id = setInterval(() => {
      const s = useGameStore.getState()
      console.log('[DEBUG] room?.players:', s.room?.players.map((p) => p.nickname))
      console.log('[DEBUG] room?.adminId:', s.room?.adminId)
      console.log('[DEBUG] localPlayerId:', s.localPlayerId)
      console.log('[DEBUG] localNickname:', s.localNickname)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (room && room.phase !== 'lobby') {
      navigate(`/game/${room.code}`)
    }
  }, [room?.phase, navigate])

  if (!room || !localPlayerId) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>{t('lobby.roomNotFound')}</Typography>
          <Button onClick={() => navigate('/')}>{t('lobby.homePage')}</Button>
        </Box>
      </Container>
    )
  }

  const currentPlayer = room.players.find((p) => p.id === localPlayerId)
  const isAdmin = room.adminId === localPlayerId
  const allReady = room.players.every((p) => p.isReady)
  const hasEnoughPlayers = room.players.length >= 2
  const hasCategories = room.settings.categories.length >= 3

  const handleToggleReady = () => {
    const newReady = !currentPlayer?.isReady
    setPlayerReady(localPlayerId, newReady)
    broadcastMessage({
      type: 'player-ready',
      senderId: localPlayerId,
      payload: { playerId: localPlayerId, ready: newReady },
    } as PeerMessage)
  }

  const handleGameStart = () => {
    startGame()
    navigate(`/game/${room.code}`)
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon fontSize="small" />
            <Typography variant="subtitle2">{t('lobby.roomCode')}</Typography>
            <CopyCode code={room.code} />
          </Box>
          <Button variant="text" onClick={() => navigate('/')}>
            {t('lobby.exit')}
          </Button>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <PlayerList />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <GameSettingsPanel />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant={currentPlayer?.isReady ? 'outlined' : 'contained'}
            size="large"
            startIcon={currentPlayer?.isReady ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
            onClick={handleToggleReady}
          >
            {t('lobby.ready_toggle')}
          </Button>
          {isAdmin && allReady && hasEnoughPlayers && hasCategories && (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<RocketLaunchIcon />}
              onClick={handleGameStart}
            >
              {t('lobby.startGame')}
            </Button>
          )}
        </Box>
        {!hasEnoughPlayers && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('lobby.waitingForPlayers')}
          </Typography>
        )}

        <ChatBox onSend={sendChatMessage} />

        <Paper sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.3)' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('lobby.debug.players', { count: room.players.length, admin: room.adminId.slice(0, 8), players: room.players.map(p => p.nickname).join(', ') || 'yok' })}
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
