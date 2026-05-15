import { Box, Typography, Paper, Button, Chip } from '@mui/material'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { CATEGORY_KEYS } from '../../utils/categories'

interface Props {
  onVote: (answerId: string, isValid: boolean) => void
  onComplete: () => void
}

export function GradingPanel({ onVote, onComplete }: Props) {
  const room = useGameStore((s) => s.room)
  const gradingItems = useGameStore((s) => s.gradingItems)
  const myVotes = useGameStore((s) => s.myVotes)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const { t } = useLocale()

  if (!room || gradingItems.length === 0) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
        {t('grading.noData')}
      </Typography>
    )
  }

  const round = room.rounds[room.rounds.length - 1]
  const allVotes = round?.votes ?? []
  const categories = room.settings.categories
  const isAdmin = room.adminId === localPlayerId

  const getVotesForAnswer = (answerId: string) =>
    allVotes.filter((v) => v.answerId === answerId)

  const allVotesComplete = gradingItems.every((item) =>
    item.answers.every((a) => {
      const eligible = room.players.filter((p) => p.id !== item.playerId).length
      return getVotesForAnswer(a.answerId).length >= eligible
    }),
  )

  const playerNameMap = new Map(room.players.map((p) => [p.id, p.nickname]))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        {t('grading.title')}
      </Typography>

      {categories.map((category) => {
        const answersInCategory = gradingItems.flatMap((item) =>
          item.answers.filter((a) => a.category === category).map((a) => ({ ...a, playerId: item.playerId, nickname: item.nickname })),
        )

        return (
          <Paper key={category} sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.light' }}>
              {CATEGORY_KEYS.includes(category) ? t(`category.${category}`) : category}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {answersInCategory.map((answer) => {
                const votes = getVotesForAnswer(answer.answerId)
                const votedCount = votes.length
                const eligibleCount = room.players.filter((p) => p.id !== answer.playerId).length
                const isOwnAnswer = answer.playerId === localPlayerId
                const hasVoted = answer.answerId in myVotes
                const allAnswered = votedCount >= eligibleCount

                const validVoters = votes.filter((v) => v.isValid).map((v) => v.voterId)
                const invalidVoters = votes.filter((v) => !v.isValid).map((v) => v.voterId)

                return (
                  <Box
                    key={answer.answerId}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {answer.nickname}
                          {answer.playerId === room.adminId && ' 👑'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {answer.value || t('game.answering.answerEmpty')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!isOwnAnswer && (
                          <>
                            <Button size="small"
                              variant={hasVoted && myVotes[answer.answerId] ? 'contained' : 'outlined'}
                              color="success" startIcon={<ThumbUpIcon />}
                              onClick={() => onVote(answer.answerId, true)}>
                              {t('grading.valid')}
                            </Button>
                            <Button size="small"
                              variant={hasVoted && !myVotes[answer.answerId] ? 'contained' : 'outlined'}
                              color="error" startIcon={<ThumbDownIcon />}
                              onClick={() => onVote(answer.answerId, false)}>
                              {t('grading.invalid')}
                            </Button>
                          </>
                        )}
                        {isOwnAnswer && (
                          <Chip label={t('grading.yourVote')} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>

                    {allAnswered && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {validVoters.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: 'success.main' }}>✅</Typography>
                            {validVoters.map((vid) => (
                              <Chip key={vid} label={playerNameMap.get(vid)} size="small" color="success" variant="outlined" sx={{ height: 22 }} />
                            ))}
                          </Box>
                        )}
                        {invalidVoters.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: 'error.main' }}>❌</Typography>
                            {invalidVoters.map((vid) => (
                              <Chip key={vid} label={playerNameMap.get(vid)} size="small" color="error" variant="outlined" sx={{ height: 22 }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                      {t('grading.voting', { voted: votedCount, eligible: eligibleCount })}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Paper>
        )
      })}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {isAdmin && allVotesComplete ? (
          <Button variant="contained" color="secondary" size="large" onClick={onComplete}>
            {t('grading.showResults')}
          </Button>
        ) : allVotesComplete ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('grading.waitingAdmin')}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('grading.waitingVotes')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
