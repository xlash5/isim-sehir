import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { CATEGORY_KEYS } from '../../utils/categories'
import { normalizeAnswer } from '../../utils/scoring'
import type { Round, Answer as AnswerType, Vote as VoteType } from '../../types'

function answerId(answer: AnswerType): string {
  return `${answer.playerId}-${answer.category}`
}

interface Props {
  playerId: string
  nickname: string
  open: boolean
  onClose: () => void
}

export function ScoreBreakdown({ playerId, nickname, open, onClose }: Props) {
  const room = useGameStore((s) => s.room)
  const { t } = useLocale()

  if (!room) return null

  const round = room.rounds[room.rounds.length - 1]
  if (!round) return null

  const playerAnswers = round.answers.filter((a) => a.playerId === playerId)
  const allVotes = round.votes

  const getVerdict = (answer: AnswerType): { label: string; points: number; verdictKey: string } => {
    if (!answer.value.trim()) {
      return { label: t('score.breakdown.blank'), points: 0, verdictKey: 'blank' }
    }

    const votes = allVotes.filter((v) => v.answerId === answerId(answer))
    if (votes.length === 0) return { label: t('score.breakdown.pending'), points: 0, verdictKey: 'pending' }

    const validVotes = votes.filter((v) => v.isValid).length
    const invalidVotes = votes.filter((v) => !v.isValid).length
    const isValid = validVotes > invalidVotes

    if (!isValid) {
      return { label: t('score.breakdown.invalid'), points: 0, verdictKey: 'invalid' }
    }

    const normalized = normalizeAnswer(answer.value)
    const isUnique = !round.answers.some(
      (other) =>
        other.playerId !== playerId &&
        other.category === answer.category &&
        normalizeAnswer(other.value) === normalized &&
        other.value.trim() !== '',
    )

    if (isUnique) {
      return { label: t('score.breakdown.unique'), points: 10, verdictKey: 'unique' }
    }
    return { label: t('score.breakdown.shared'), points: 5, verdictKey: 'shared' }
  }

  let totalPoints = 0
  const rows = playerAnswers.map((answer) => {
    const verdict = getVerdict(answer)
    totalPoints += verdict.points
    return { answer, verdict }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {nickname}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('score.breakdown.category')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('score.breakdown.answer')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('score.breakdown.verdict')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{t('score.breakdown.points')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ answer, verdict }) => {
              const catLabel = CATEGORY_KEYS.includes(answer.category)
                ? t(`category.${answer.category}`)
                : answer.category
              const chipColor = verdict.verdictKey === 'unique' ? 'success'
                : verdict.verdictKey === 'shared' ? 'warning'
                : verdict.verdictKey === 'invalid' ? 'error'
                : 'default'
              return (
                <TableRow key={answer.category}>
                  <TableCell>{catLabel}</TableCell>
                  <TableCell>{answer.value || '—'}</TableCell>
                  <TableCell>
                    <Chip label={verdict.label} size="small" color={chipColor} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{verdict.points}</TableCell>
                </TableRow>
              )
            })}
            <TableRow>
              <TableCell colSpan={3} sx={{ fontWeight: 700, borderBottom: 'none' }}>
                {t('score.breakdown.total')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, borderBottom: 'none', color: 'primary.main' }}>
                {totalPoints}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
