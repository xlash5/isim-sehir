import { useEffect, useRef, memo } from 'react'
import { Box, Typography, Paper, Button, useMediaQuery, useTheme } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { playSound } from '../../utils/sounds'

interface Props {
  isGameOver: boolean
  onNextRound?: () => void
  onBackToLobby?: () => void
  onPlayAgain?: () => void
}

export const Scoreboard = memo(function Scoreboard({ isGameOver, onNextRound, onBackToLobby, onPlayAgain }: Props) {
  const room = useGameStore((s) => s.room)
  const scores = useGameStore((s) => s.scores)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (hasPlayedRef.current) return
    if (!room) return
    hasPlayedRef.current = true
    if (isGameOver) {
      const sorted = [...room.players].sort((a, b) => b.score - a.score)
      const isWinner = sorted[0]?.id === localPlayerId
      playSound(isWinner ? 'game-over-victory' : 'game-over-defeat')
    } else {
      playSound('round-results')
    }
  }, [isGameOver, room, localPlayerId])

  if (!room) return null

  const isAdmin = room.adminId === localPlayerId
  const sorted = [...room.players].sort((a, b) => b.score - a.score)
  const medals = ['🥇', '🥈', '🥉']

  const renderActionButtons = () => {
    if (isGameOver) {
      return (
        <Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
          {onPlayAgain && (
            <Button variant="contained" color="secondary" onClick={onPlayAgain} fullWidth={isMobile} sx={isMobile ? { minHeight: 44 } : {}}>
              {t('scoreboard.playAgain')}
            </Button>
          )}
          {onBackToLobby && (
            <Button variant="outlined" onClick={onBackToLobby} fullWidth={isMobile} sx={isMobile ? { minHeight: 44 } : {}}>
              {t('scoreboard.backToLobby')}
            </Button>
          )}
        </Box>
      )
    }
    return isAdmin && onNextRound ? (
      <Button variant="contained" onClick={onNextRound} fullWidth={isMobile} sx={isMobile ? { minHeight: 44 } : {}}>
        {t('scoreboard.nextRound')}
      </Button>
    ) : null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon color="secondary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isGameOver ? t('scoreboard.gameOver') : t('scoreboard.round', { round: room.currentRound })}
        </Typography>
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {sorted.map((player, i) => {
            const roundScore = scores[player.id] ?? 0
            const isWinner = i === 0 && isGameOver
            return (
              <Paper
                key={player.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: i === 0 && isGameOver ? 'rgba(255, 215, 0, 0.08)' : i === 0 ? 'rgba(206, 147, 216, 0.08)' : undefined,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
                    {medals[i] ?? `${i + 1}.`}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {player.nickname}
                    {player.isAdmin && ' 👑'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {player.score}
                  </Typography>
                  {!isGameOver && roundScore > 0 && (
                    <Typography variant="caption" sx={{ color: 'success.main', display: 'block', lineHeight: 1 }}>
                      {t('scoreboard.thisRound', { score: roundScore })}
                    </Typography>
                  )}
                </Box>
              </Paper>
            )
          })}
        </Box>
      ) : (
        <Paper sx={{ p: 2, minWidth: 300, width: '100%', maxWidth: 500 }}>
          {sorted.map((player, i) => {
            const roundScore = scores[player.id] ?? 0
            const isWinner = i === 0 && isGameOver
            return (
              <Box
                key={player.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  px: 2,
                  borderBottom: i < sorted.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: i === 0 && isGameOver ? 'rgba(255, 215, 0, 0.08)' : i === 0 ? 'rgba(206, 147, 216, 0.08)' : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
                    {medals[i] ?? `${i + 1}.`}
                  </Typography>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {player.nickname}
                      {player.isAdmin && ' 👑'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {player.score}
                  </Typography>
                  {!isGameOver && roundScore > 0 && (
                    <Typography variant="caption" sx={{ color: 'success.main', display: 'block', lineHeight: 1 }}>
                      {t('scoreboard.thisRound', { score: roundScore })}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Paper>
      )}

      {renderActionButtons()}
    </Box>
  )
})
