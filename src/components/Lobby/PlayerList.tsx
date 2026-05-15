import { useState } from 'react'
import { Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import GroupIcon from '@mui/icons-material/Group'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useGameStore } from '../../stores/useGameStore'
import { usePeer } from '../../context/PeerContext'
import { useLocale } from '../../locales'
import { PlayerAvatar } from '../common/PlayerAvatar'
import type { PeerMessage } from '../../types'

export function PlayerList() {
  const players = useGameStore((s) => s.room?.players ?? [])
  const adminId = useGameStore((s) => s.room?.adminId)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const phase = useGameStore((s) => s.room?.phase)
  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const { broadcastMessage } = usePeer()
  const { t } = useLocale()

  const isAdmin = localPlayerId === adminId
  const canTransfer = isAdmin && (phase === 'lobby' || phase === 'round-results' || phase === 'game-over')

  const handleTransfer = () => {
    if (!transferTarget) return
    broadcastMessage({
      type: 'admin-transfer-request',
      senderId: localPlayerId!,
      payload: { newAdminId: transferTarget },
    } as PeerMessage)
    setTransferTarget(null)
  }

  const targetPlayer = transferTarget ? players.find((p) => p.id === transferTarget) : null

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupIcon fontSize="small" />
        <Typography variant="subtitle2">{t('lobby.players', { count: players.length })}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {players.map((p) => (
          <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <PlayerAvatar
                nickname={p.nickname}
                isAdmin={p.id === adminId}
                isReady={p.isReady}
              />
            </Box>
            {canTransfer && p.id !== localPlayerId && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => setTransferTarget(p.id)}
              >
                {t('admin.transfer')}
              </Button>
            )}
          </Box>
        ))}
      </Box>

      <Dialog open={!!transferTarget} onClose={() => setTransferTarget(null)}>
        <DialogTitle>{t('admin.transfer')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.transferConfirm', { nickname: targetPlayer?.nickname ?? '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferTarget(null)}>{t('admin.transferNo')}</Button>
          <Button variant="contained" onClick={handleTransfer}>{t('admin.transferYes')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
