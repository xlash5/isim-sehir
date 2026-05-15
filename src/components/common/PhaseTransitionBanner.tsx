import { useEffect, useState, useRef } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import type { GamePhase } from '../../types'

interface PhaseTransition {
  from: GamePhase
  to: GamePhase
}

const TRANSITION_MESSAGES: Record<string, string> = {
  'lobby->wheel': 'phase.transition.lobbyToWheel',
  'wheel->answering': 'phase.transition.wheelToAnswering',
  'answering->grading': 'phase.transition.answeringToGrading',
  'grading->round-results': 'phase.transition.gradingToResults',
  'round-results->wheel': 'phase.transition.resultsToWheel',
  'round-results->game-over': 'phase.transition.resultsToGameOver',
}

export function PhaseTransitionBanner() {
  const phase = useGameStore((s) => s.room?.phase)
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const prevPhaseRef = useRef<GamePhase | undefined>(undefined)

  useEffect(() => {
    if (!phase) return

    if (prevPhaseRef.current && prevPhaseRef.current !== phase) {
      const key = `${prevPhaseRef.current}->${phase}`
      const msgKey = TRANSITION_MESSAGES[key]
      if (msgKey) {
        setMessage(t(msgKey))
        setOpen(true)
      }
    }

    prevPhaseRef.current = phase
  }, [phase, t])

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => setOpen(false)}
        sx={{ width: '100%', maxWidth: 500 }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
