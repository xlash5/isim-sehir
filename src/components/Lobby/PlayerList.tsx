import { Paper, Typography, Box } from '@mui/material'
import GroupIcon from '@mui/icons-material/Group'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { PlayerAvatar } from '../common/PlayerAvatar'

export function PlayerList() {
  const players = useGameStore((s) => s.room?.players ?? [])
  const adminId = useGameStore((s) => s.room?.adminId)
  const { t } = useLocale()

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupIcon fontSize="small" />
        <Typography variant="subtitle2">{t('lobby.players', { count: players.length })}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {players.map((p) => (
          <PlayerAvatar
            key={p.id}
            nickname={p.nickname}
            isAdmin={p.id === adminId}
            isReady={p.isReady}
          />
        ))}
      </Box>
    </Paper>
  )
}
