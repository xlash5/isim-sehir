import { useState, memo } from 'react'
import { Box, TextField, Typography, Paper, Button, Chip, useMediaQuery, useTheme } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { CATEGORY_KEYS } from '../../utils/categories'
import { playSound } from '../../utils/sounds'

interface Props {
  onSubmit: () => void
}

export const AnswerTable = memo(function AnswerTable({ onSubmit }: Props) {
  const room = useGameStore((s) => s.room)
  const answers = useGameStore((s) => s.answers)
  const setAnswer = useGameStore((s) => s.setAnswer)
  const isSubmitting = useGameStore((s) => s.isSubmitting)
  const submittedPlayers = useGameStore((s) => s.submittedPlayers)
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expanded, setExpanded] = useState<string | false>(false)

  if (!room) return null

  const categories = room.settings.categories
  const letter = room.currentLetter
  const allFilled = categories.every((cat) => (answers.get(cat) ?? '').trim().length > 0)

  const handleAccordion = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const renderTextField = (category: string) => {
    const catLabel = CATEGORY_KEYS.includes(category) ? t(`category.${category}`) : category
    return (
      <TextField
        key={category}
        label={catLabel}
        placeholder={t('game.answering.placeholder', { category: catLabel })}
        value={answers.get(category) ?? ''}
        onChange={(e) => {
          if (e.target.value.length <= 50) setAnswer(category, e.target.value)
        }}
        disabled={isSubmitting}
        size="small"
        fullWidth
        slotProps={{ htmlInput: { inputMode: 'text' } }}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: isMobile ? '80px' : 0 }}>
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        {t('game.answering.prompt', { letter: letter ?? '?' })}
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

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {categories.map((category, idx) => {
            const catLabel = CATEGORY_KEYS.includes(category) ? t(`category.${category}`) : category
            return (
              <Accordion
                key={category}
                expanded={expanded === category}
                onChange={handleAccordion(category)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {answers.get(category)?.trim()
                      ? `${catLabel} ✅`
                      : catLabel}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1 }}>
                  {renderTextField(category)}
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categories.map(renderTextField)}
          </Box>
        </Paper>
      )}

      {!isSubmitting && (
        <Box sx={{
          ...(isMobile ? {
            position: 'fixed', bottom: 0, left: 0, right: 0,
            p: 2, bgcolor: 'background.paper', borderTop: '1px solid',
            borderColor: 'divider', zIndex: 1100,
          } : { alignSelf: 'center' }),
        }}>
          <Button
            variant="contained"
            size="large"
            fullWidth={isMobile}
            startIcon={<SendIcon />}
            onClick={() => { playSound('answer-submit'); onSubmit() }}
            sx={isMobile ? { minHeight: 48 } : {}}
          >
            {t('game.answering.submit')}
          </Button>
        </Box>
      )}
    </Box>
  )
})
