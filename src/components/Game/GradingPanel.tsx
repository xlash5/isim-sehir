import { useEffect } from 'react'
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
  const currentAnswerVoters = useGameStore((s) => s.currentAnswerVoters)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const advanceGrading = useGameStore((s) => s.advanceGrading)

  if (!room || gradingItems.length === 0) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        Değerlendirme için veri bulunamadı.
      </Typography>
    )
  }

  const item = gradingItems[currentGradingIndex]
  if (!item) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        Oyuncu bulunamadı.
      </Typography>
    )
  }

  const currentAnswer = item.answers[currentAnswerIndex]
  if (!currentAnswer) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        Bu oyuncuya ait cevap bulunamadı.
      </Typography>
    )
  }

  const answerId = currentAnswer.answerId
  const hasVoted = answerId in myVotes
  const isOwnAnswer = item.playerId === localPlayerId
  const eligibleVoters = room.players.filter((p) => p.id !== item.playerId)
  const votedCount = currentAnswerVoters.length

  const allVoted = votedCount >= eligibleVoters.length

  const roundVotes = room.rounds[room.rounds.length - 1]?.votes.filter((v) => v.answerId === answerId) ?? []
  const validVotes = roundVotes.filter((v) => v.isValid).length
  const invalidVotes = roundVotes.filter((v) => !v.isValid).length

  let finalResult: 'valid' | 'invalid' | 'pending' = 'pending'
  if (allVoted) {
    finalResult = validVotes > invalidVotes ? 'valid' : 'invalid'
  }

  useEffect(() => {
    if (allVoted) {
      const timer = setTimeout(() => advanceGrading(), 1500)
      return () => clearTimeout(timer)
    }
  }, [allVoted, advanceGrading])

  const isLastItem =
    currentGradingIndex === gradingItems.length - 1 &&
    currentAnswerIndex === item.answers.length - 1

  const handleAdvance = () => {
    if (isLastItem && allVoted) {
      onComplete()
    } else {
      advanceGrading()
    }
  }

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

        {!isOwnAnswer && !allVoted && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant={hasVoted && myVotes[answerId] ? 'contained' : 'outlined'}
              color="success"
              startIcon={<ThumbUpIcon />}
              onClick={() => {
                if (!hasVoted) onVote(answerId, true)
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
                if (!hasVoted) onVote(answerId, false)
              }}
              disabled={hasVoted}
            >
              Geçersiz
            </Button>
          </Box>
        )}

        {isOwnAnswer && (
          <Typography variant="body2" color="text.secondary">
            Kendi cevabınızı değerlendiremezsiniz.
          </Typography>
        )}

        {hasVoted && !allVoted && (
          <Chip
            label={myVotes[answerId] ? '✅ Geçerli oyu verdiniz' : '❌ Geçersiz oyu verdiniz'}
            color={myVotes[answerId] ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Oylama: {votedCount}/{eligibleVoters.length}
        </Typography>
        {allVoted && (
          <Chip
            label={finalResult === 'valid' ? '✅ Geçerli' : '❌ Geçersiz'}
            color={finalResult === 'valid' ? 'success' : 'error'}
            size="small"
          />
        )}
      </Box>

      <Button
        variant="outlined"
        onClick={handleAdvance}
        sx={{ alignSelf: 'center' }}
        disabled={!allVoted}
      >
        {isLastItem ? 'Tur Sonuçlarını Gör' : 'Sonraki Cevap'}
      </Button>
    </Box>
  )
}
