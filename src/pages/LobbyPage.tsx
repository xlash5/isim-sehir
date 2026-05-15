import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Grid2 as Grid, Typography, Button, Paper, Tooltip, useMediaQuery, useTheme,
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
import { InlineTip } from '../components/common/InlineTip'
import type { PeerMessage, CountdownSyncPayload } from '../types'
import { getRandomLetter } from '../utils/letters'
import { clearSession } from '../utils/session'
import { getTipForEvent } from '../utils/tips'

export function LobbyPage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const room = useGameStore((s) => s.room)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const setPlayerReady = useGameStore((s) => s.setPlayerReady)
  const resetRoom = useGameStore((s) => s.resetRoom)
  const { broadcastMessage, disconnectAll } = usePeer()
  const { startGame, sendChatMessage } = useGame()
  const countdown = useGameStore((s) => s.countdown)
  const setCountdown = useGameStore((s) => s.setCountdown)
  const settingsEditMode = useGameStore((s) => s.settingsEditMode)
  const setSettingsEditMode = useGameStore((s) => s.setSettingsEditMode)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          <Button onClick={() => { clearSession(); disconnectAll(); resetRoom(); navigate('/') }}>{t('lobby.homePage')}</Button>
        </Box>
      </Container>
    )
  }

  const currentPlayer = room.players.find((p) => p.id === localPlayerId)
  const isAdmin = room.adminId === localPlayerId
  const activePlayers = room.players.filter((p) => !p.isSpectator)
  const allReady = activePlayers.every((p) => p.isReady)
  const hasEnoughPlayers = activePlayers.length >= 2
  const hasCategories = room.settings.categories.length >= 3
  const isSpectator = currentPlayer?.isSpectator ?? false

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    const conditions = allReady && hasEnoughPlayers && hasCategories && !settingsEditMode

    if (!conditions && countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
      setCountdown(null)
      broadcastMessage({ type: 'countdown-cancel', senderId: localPlayerId!, payload: {} } as PeerMessage)
      return
    }

    if (conditions && countdownIntervalRef.current === null) {
      setCountdown(10)
      broadcastMessage({ type: 'countdown-sync', senderId: localPlayerId!, payload: { remaining: 10 } } as PeerMessage)
      countdownIntervalRef.current = setInterval(() => {
        const s = useGameStore.getState()
        const actives = s.room?.players.filter((p) => !p.isSpectator) ?? []
        const stillMet = actives.every((p) => p.isReady) && actives.length >= 2 && (s.room?.settings.categories.length ?? 0) >= 3 && !s.settingsEditMode

        if (!stillMet) {
          clearInterval(countdownIntervalRef.current!)
          countdownIntervalRef.current = null
          s.setCountdown(null)
          broadcastMessage({ type: 'countdown-cancel', senderId: s.localPlayerId!, payload: {} } as PeerMessage)
          return
        }

        const current = s.countdown
        if (current !== null && current <= 1) {
          clearInterval(countdownIntervalRef.current!)
          countdownIntervalRef.current = null
          s.setCountdown(null)
          broadcastMessage({ type: 'game-start', senderId: s.localPlayerId!, payload: {} } as PeerMessage)
          s.setPhase('wheel')
          const letter = getRandomLetter(s.room?.settings.letterPool)
          broadcastMessage({ type: 'round-start', senderId: s.localPlayerId!, payload: { letter } } as PeerMessage)
          s.setPendingLetter(letter)
          navigate(`/game/${s.room?.code}`)
          return
        }

        const next = (current ?? 10) - 1
        s.setCountdown(next)
        broadcastMessage({ type: 'countdown-sync', senderId: s.localPlayerId!, payload: { remaining: next } } as PeerMessage)
      }, 1000)
    }
  }, [isAdmin, allReady, hasEnoughPlayers, hasCategories, settingsEditMode])

  const handleToggleReady = () => {
    if (!hasCategories) return
    const newReady = !currentPlayer?.isReady
    setPlayerReady(localPlayerId, newReady)
    broadcastMessage({
      type: 'player-ready',
      senderId: localPlayerId,
      payload: { playerId: localPlayerId, ready: newReady },
    } as PeerMessage)

    if (newReady) {
      const tipKey = getTipForEvent('first-ready')
      if (tipKey) {
        useGameStore.getState().addChatMessage({
          playerId: 'system',
          nickname: '🎯',
          text: t(tipKey),
          timestamp: Date.now(),
        })
      }
    }
  }

  const handleGameStart = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(null)
    broadcastMessage({ type: 'countdown-cancel', senderId: localPlayerId!, payload: {} } as PeerMessage)
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
          <Button variant="text" onClick={() => { clearSession(); disconnectAll(); resetRoom(); navigate('/') }}>
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

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
          {countdown !== null ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '4px solid',
                    borderColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 1s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                    },
                  }}
                >
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {countdown}
                  </Typography>
                </Box>
                {isAdmin && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={handleGameStart}
                  >
                    {t('lobby.startNow')}
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <>
              {!isSpectator && (
                <Tooltip title={!hasCategories ? t('lobby.needCategories') : t('tooltip.readyToggle')}>
                  <span>
                    <Button
                      variant={currentPlayer?.isReady ? 'outlined' : 'contained'}
                      size="large"
                      disabled={!hasCategories}
                      fullWidth={isMobile}
                      startIcon={currentPlayer?.isReady ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                      onClick={handleToggleReady}
                      sx={isMobile ? { minHeight: 44 } : {}}
                    >
                      {t('lobby.ready_toggle')}
                    </Button>
                  </span>
                </Tooltip>
              )}
              {isSpectator && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                  {t('lobby.spectatorNotice')}
                </Typography>
              )}
              {isAdmin && (
                <Tooltip title={(!allReady || !hasEnoughPlayers || !hasCategories) ? t('tooltip.startGameDisabled') : ''}>
                  <span>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      fullWidth={isMobile}
                      startIcon={<RocketLaunchIcon />}
                      onClick={handleGameStart}
                      disabled={!allReady || !hasEnoughPlayers || !hasCategories}
                      sx={isMobile ? { minHeight: 44 } : {}}
                    >
                      {t('lobby.startGame')}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
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
