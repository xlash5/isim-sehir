import { Box, Typography, Paper, Button } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useGameStore } from '../../stores/useGameStore'

interface Props {
  isGameOver: boolean
  onNextRound?: () => void
  onBackToLobby?: () => void
  onPlayAgain?: () => void
}

export function Scoreboard({ isGameOver, onNextRound, onBackToLobby, onPlayAgain }: Props) {
  const room = useGameStore((s) => s.room)
  const scores = useGameStore((s) => s.scores)
  const localPlayerId = useGameStore((s) => s.localPlayerId)

  if (!room) return null

  const isAdmin = room.adminId === localPlayerId
  const sorted = [...room.players].sort((a, b) => b.score - a.score)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon color="secondary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isGameOver ? '🎉 Oyun Sonu! 🎉' : `Tur ${room.currentRound} Sonuçları`}
        </Typography>
      </Box>

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
                    +{roundScore} bu tur
                  </Typography>
                )}
              </Box>
            </Box>
          )
        })}
      </Paper>

      {isGameOver ? (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {onPlayAgain && (
            <Button variant="contained" color="secondary" onClick={onPlayAgain}>
              🔄 Tekrar Oyna
            </Button>
          )}
          {onBackToLobby && (
            <Button variant="outlined" onClick={onBackToLobby}>
              Lobiye Dön
            </Button>
          )}
        </Box>
      ) : (
        isAdmin && onNextRound && (
          <Button variant="contained" onClick={onNextRound}>
            Sonraki Tur
          </Button>
        )
      )}
    </Box>
  )
}
