import { Box, Typography, Paper, Button, Chip } from '@mui/material'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import { useGameStore } from '../../stores/useGameStore'

interface Props {
  onVote: (answerId: string, isValid: boolean) => void
  onComplete: () => void
}

export function GradingPanel({ onVote, onComplete }: Props) {
  const room = useGameStore((s) => s.room)
  const gradingItems = useGameStore((s) => s.gradingItems)
  const currentGradingIndex = useGameStore((s) => s.currentGradingIndex)
  const currentAnswerIndex = useGameStore((s) => s.currentAnswerIndex)
  const myVotes = useGameStore((s) => s.myVotes)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const advanceGrading = useGameStore((s) => {
    return () => {
      const state = useGameStore.getState()
      const item = state.gradingItems[state.currentGradingIndex]
      if (!item) return

      if (state.currentAnswerIndex < item.answers.length - 1) {
        useGameStore.setState({ currentAnswerIndex: state.currentAnswerIndex + 1 })
      } else if (state.currentGradingIndex < state.gradingItems.length - 1) {
        useGameStore.setState({
          currentGradingIndex: state.currentGradingIndex + 1,
          currentAnswerIndex: 0,
        })
      } else {
        onComplete()
      }
    }
  })

  if (!room || gradingItems.length === 0) return null

  const item = gradingItems[currentGradingIndex]
  if (!item) return null

  const currentAnswer = item.answers[currentAnswerIndex]
  if (!currentAnswer) return null

  const answerId = `${item.playerId}-${currentAnswer.category}`
  const hasVoted = answerId in myVotes

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        Değerlendirme
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        {item.nickname} oyuncusunun cevapları ({currentGradingIndex + 1}/{gradingItems.length})
      </Typography>

      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {currentAnswer.category}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, my: 2 }}>
          {currentAnswer.value || '(boş)'}
        </Typography>

        {item.playerId !== localPlayerId && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant={hasVoted && myVotes[answerId] ? 'contained' : 'outlined'}
              color="success"
              startIcon={<ThumbUpIcon />}
              onClick={() => {
                if (!hasVoted) {
                  onVote(answerId, true)
                }
              }}
              disabled={hasVoted}
            >
              Geçerli
            </Button>
            <Button
              variant={hasVoted && !myVotes[answerId] ? 'contained' : 'outlined'}
              color="error"
              startIcon={<ThumbDownIcon />}
              onClick={() => {
                if (!hasVoted) {
                  onVote(answerId, false)
                }
              }}
              disabled={hasVoted}
            >
              Geçersiz
            </Button>
          </Box>
        )}
        {item.playerId === localPlayerId && (
          <Typography variant="body2" color="text.secondary">
            Kendi cevabınızı değerlendiremezsiniz.
          </Typography>
        )}
        {hasVoted && (
          <Chip
            label={myVotes[answerId] ? '✅ Geçerli oyu verdiniz' : '❌ Geçersiz oyu verdiniz'}
            color={myVotes[answerId] ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      <Button variant="outlined" onClick={advanceGrading} sx={{ alignSelf: 'center' }}>
        {currentAnswerIndex < item.answers.length - 1
          ? 'Sonraki Cevap'
          : currentGradingIndex < gradingItems.length - 1
            ? 'Sonraki Oyuncu'
            : 'Tur Sonuçlarını Gör'}
      </Button>
    </Box>
  )
}
