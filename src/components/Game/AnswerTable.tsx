import { Box, TextField, Typography, Paper, Button, Chip } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { useGameStore } from '../../stores/useGameStore'

interface Props {
  onSubmit: () => void
}

export function AnswerTable({ onSubmit }: Props) {
  const room = useGameStore((s) => s.room)
  const answers = useGameStore((s) => s.answers)
  const setAnswer = useGameStore((s) => s.setAnswer)
  const isSubmitting = useGameStore((s) => s.isSubmitting)
  const submittedPlayers = useGameStore((s) => s.submittedPlayers)
  const timer = useGameStore((s) => s.timer)

  if (!room) return null

  const categories = room.settings.categories
  const letter = room.currentLetter
  const localPlayerId = useGameStore.getState().localPlayerId
  const allFilled = categories.every((cat) => (answers.get(cat) ?? '').trim().length > 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        <strong>{letter}</strong> harfi ile başlayan kelimeler yazın
      </Typography>

      <Paper sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {room.players.map((p) => {
          const hasSubmitted = submittedPlayers.includes(p.id)
          return (
            <Chip
              key={p.id}
              icon={hasSubmitted ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              label={p.nickname}
              color={hasSubmitted ? 'success' : 'default'}
              variant={hasSubmitted ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: hasSubmitted ? 600 : 400 }}
            />
          )
        })}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categories.map((category) => (
            <TextField
              key={category}
              label={category}
              placeholder={`${category}...`}
              value={answers.get(category) ?? ''}
              onChange={(e) => {
                if (e.target.value.length <= 50) setAnswer(category, e.target.value)
              }}
              disabled={isSubmitting}
              size="small"
              fullWidth
            />
          ))}
        </Box>
      </Paper>
      {!isSubmitting && (
        <Button
          variant="contained"
          size="large"
          startIcon={<SendIcon />}
          onClick={onSubmit}
          sx={{ alignSelf: 'center' }}
        >
          Cevapları Gönder
        </Button>
      )}
    </Box>
  )
}
