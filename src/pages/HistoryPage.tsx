import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Paper, Button, Collapse, IconButton, Container,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton,
  ListItemText, Chip, Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useLocale } from '../locales'
import { getGameHistory, clearGameHistory } from '../utils/history'
import type { GameHistoryEntry } from '../types'

export function HistoryPage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const [games, setGames] = useState<GameHistoryEntry[]>(() => getGameHistory())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleClear = () => {
    clearGameHistory()
    setGames([])
    setConfirmOpen(false)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t('history.title')}
            </Typography>
          </Box>
          {games.length > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setConfirmOpen(true)}
            >
              {t('history.clearAll')}
            </Button>
          )}
        </Box>

        {games.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              {t('history.noGames')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...games].reverse().map((game) => {
              const isExpanded = expandedId === game.id
              return (
                <Paper key={game.id} sx={{ overflow: 'hidden' }}>
                  <ListItemButton onClick={() => setExpandedId(isExpanded ? null : game.id)}>
                    <ListItemText
                      primary={t('history.played', {
                        date: formatDate(game.date),
                        count: game.playerCount,
                        rounds: game.totalRounds,
                      })}
                      secondary={t('history.rank', { rank: game.yourRank, score: game.yourScore })}
                    />
                    <Chip
                      label={`#${game.yourRank}`}
                      color={game.yourRank === 1 ? 'secondary' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Divider sx={{ mb: 1.5 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {t('scoreboard.total')}
                      </Typography>
                      {game.players.map((p) => (
                        <Box
                          key={p.nickname}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            py: 0.5,
                            px: 1,
                            borderRadius: 1,
                            bgcolor: p.rank === 1 ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                          }}
                        >
                          <Typography variant="body2">
                            {p.rank}. {p.nickname}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {p.score}
                          </Typography>
                        </Box>
                      ))}

                      {game.rounds.map((round) => (
                        <Box key={round.round} sx={{ mt: 2 }}>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                            {t('history.round', { n: round.round, letter: round.letter })}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {round.yourAnswers.map((a) => (
                              <Box
                                key={a.category}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  py: 0.25,
                                  px: 1,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {a.value || '—'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: a.points > 0 ? 'success.main' : 'text.disabled',
                                  }}
                                >
                                  {a.points > 0 ? `+${a.points}` : '0'}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Paper>
              )
            })}
          </List>
        )}
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('history.clearConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {games.length} {t('history.title')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleClear}>
            {t('history.clearAll')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
