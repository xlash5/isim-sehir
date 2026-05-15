import { Box, Typography, Step, StepLabel, Stepper, useMediaQuery, useTheme, Select, MenuItem, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { GamePhase } from '../../types'
import { useLocale } from '../../locales'

const PHASES: GamePhase[] = ['lobby', 'wheel', 'answering', 'grading', 'round-results']

const PHASE_ICONS: Partial<Record<GamePhase, string>> = {
  'round-results': '✅',
}

interface Props {
  currentPhase: GamePhase
  completedPhases: GamePhase[]
  onPhaseClick?: (phase: GamePhase) => void
}

export function PhaseIndicator({ currentPhase, completedPhases, onPhaseClick }: Props) {
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const activeStep = PHASES.indexOf(currentPhase)
  const isGameOver = currentPhase === 'game-over'

  if (isMobile) {
    const currentIdx = PHASES.indexOf(currentPhase)
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', py: 1 }}>
        <Chip
          label={t(`phase.${currentPhase}`)}
          color="primary"
          size="small"
          icon={completedPhases.includes(currentPhase) ? <CheckCircleIcon /> : undefined}
        />
        <Typography variant="caption" color="text.secondary">
          {currentIdx >= 0 ? `${currentIdx + 1}/${PHASES.length}` : ''}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Stepper activeStep={isGameOver ? PHASES.length : activeStep} alternativeLabel>
        {PHASES.map((phase) => {
          const isCompleted = completedPhases.includes(phase)
          const isCurrent = phase === currentPhase
          return (
            <Step key={phase} completed={isCompleted}>
              <StepLabel
                onClick={() => isCompleted && onPhaseClick?.(phase)}
                sx={{
                  cursor: isCompleted ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? 'primary.main' : isCompleted ? 'text.secondary' : 'text.disabled',
                  },
                }}
              >
                {t(`phase.${phase}`)}
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>
    </Box>
  )
}
