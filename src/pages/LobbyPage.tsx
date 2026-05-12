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
import { PlayerList } from '../components/Lobby/PlayerList'
import { GameSettingsPanel } from '../components/Lobby/GameSettingsPanel'
import { ChatBox } from '../components/common/ChatBox'
import { CopyCode } from '../components/common/CopyCode'
import type { PeerMessage } from '../types'

export function LobbyPage() {
  const navigate = useNavigate()
  const room = useGameStore((s) => s.room)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const setPlayerReady = useGameStore((s) => s.setPlayerReady)
  const { broadcastMessage } = usePeer()
  const { startGame, sendChatMessage } = useGame()

  if (!room || !localPlayerId) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Oda bulunamadı. Ana sayfaya dönün.</Typography>
          <Button onClick={() => navigate('/')}>Ana Sayfa</Button>
        </Box>
      </Container>
    )
  }

  const currentPlayer = room.players.find((p) => p.id === localPlayerId)
  const isAdmin = room.adminId === localPlayerId
  const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady)
  const hasEnoughPlayers = room.players.length >= 2

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
            <Typography variant="subtitle2">Oda Kodu:</Typography>
            <CopyCode code={room.code} />
          </Box>
          <Button variant="text" onClick={() => navigate('/')}>
            Çıkış
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
            {currentPlayer?.isReady ? 'Hazır' : 'Hazır'}
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<RocketLaunchIcon />}
              onClick={handleGameStart}
              disabled={!allReady || !hasEnoughPlayers}
            >
              Oyuna Başla
            </Button>
          )}
        </Box>
        {!hasEnoughPlayers && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Oyunun başlaması için en az 2 oyuncu gereklidir.
          </Typography>
        )}

        <ChatBox onSend={sendChatMessage} />
      </Box>
    </Container>
  )
}
