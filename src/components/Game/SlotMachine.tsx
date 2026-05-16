import { useEffect, useState, useRef } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { withErrorBoundary } from '@sentry/react'
import { TURKISH_LETTERS } from '../../utils/letters'
import { useGameStore } from '../../stores/useGameStore'
import { useLocale } from '../../locales'
import { playSound } from '../../utils/sounds'

interface Props {
  onComplete: (letter: string) => void
}

const randomLetter = () =>
  TURKISH_LETTERS[Math.floor(Math.random() * TURKISH_LETTERS.length)]

function SlotMachineInner({ onComplete }: Props) {
  const pendingLetter = useGameStore((s) => s.room?.pendingLetter)
  const { t } = useLocale()

  const [displayLetter, setDisplayLetter] = useState('?')
  const [isSpinning, setIsSpinning] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!pendingLetter) return

    console.log('[SlotMachine] starting animation for letter:', pendingLetter)
    setShowResult(false)
    setIsSpinning(true)

    const totalDuration = 3000 + Math.random() * 1000
    const fastPhase = 1000
    const startTime = Date.now()
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false

    const scheduleNext = () => {
      if (cancelled) return
      const elapsed = Date.now() - startTime

      if (elapsed >= totalDuration) {
        console.log('[SlotMachine] animation complete, letter:', pendingLetter)
        setDisplayLetter(pendingLetter)
        setIsSpinning(false)
        playSound('letter-reveal')
        setTimeout(() => {
          setShowResult(true)
          setTimeout(() => onCompleteRef.current(pendingLetter), 1000)
        }, 400)
        return
      }

      let interval: number
      if (elapsed < fastPhase) {
        interval = 50 + Math.random() * 30
      } else {
        const progress = (elapsed - fastPhase) / (totalDuration - fastPhase)
        interval = 80 + progress * 400
      }

      setDisplayLetter(randomLetter())
      playSound('wheel-tick')
      timeoutId = setTimeout(scheduleNext, interval)
    }

    timeoutId = setTimeout(scheduleNext, 50)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [pendingLetter])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, my: 4 }}>
      <Box
        sx={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: 4,
          border: '3px solid rgba(255,255,255,0.15)',
          p: 4,
          boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)',
        }}
      >
        <Box
          sx={{
            width: 140,
            height: 160,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showResult
              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
              : isSpinning
                ? 'linear-gradient(135deg, #2d2d44, #3d3d5c)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: showResult
              ? '0 0 50px rgba(255,215,0,0.7), 0 0 100px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,215,0,0.2)'
              : !isSpinning
                ? '0 0 30px rgba(124,58,237,0.5)'
                : 'inset 0 0 15px rgba(0,0,0,0.5)',
            border: showResult
              ? '3px solid #FFD700'
              : '2px solid rgba(255,255,255,0.1)',
            transform: showResult ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: '4.5rem',
              fontFamily: '"Courier New", monospace',
              color: showResult
                ? '#1a1a2e'
                : isSpinning
                  ? 'rgba(255,255,255,0.3)'
                  : '#ffffff',
              textShadow: showResult
                ? '0 0 25px rgba(255,215,0,0.9)'
                : !isSpinning
                  ? '0 0 15px rgba(255,255,255,0.6)'
                  : 'none',
              userSelect: 'none',
            }}
          >
            {displayLetter}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          animation: isSpinning ? 'pulse 0.8s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.4 },
            '50%': { opacity: 1 },
          },
        }}
      >
        {showResult ? t('game.wheel.letter') : isSpinning ? t('game.wheel.spinning') : ''}
      </Typography>
    </Box>
  )
}

function SlotMachineFallback() {
  const pendingLetter = useGameStore((s) => s.room?.pendingLetter)
  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontFamily: '"Courier New", monospace' }}>
        {pendingLetter ?? '?'}
      </Typography>
    </Paper>
  )
}

export const SlotMachine = withErrorBoundary(SlotMachineInner, { fallback: <SlotMachineFallback /> })
