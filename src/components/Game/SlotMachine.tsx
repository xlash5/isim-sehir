import { useEffect, useState, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { TURKISH_LETTERS } from '../../utils/letters'
import { useGameStore } from '../../stores/useGameStore'

interface Props {
  onComplete: (letter: string) => void
}

const SPIN_DURATIONS = [900, 1900, 3100]
const TICK_MS = 60

const randomLetter = () =>
  TURKISH_LETTERS[Math.floor(Math.random() * TURKISH_LETTERS.length)]

export function SlotMachine({ onComplete }: Props) {
  const pendingLetter = useGameStore((s) => s.room?.pendingLetter)

  const [reelLetters, setReelLetters] = useState<string[]>([randomLetter(), randomLetter(), randomLetter()])
  const [stopped, setStopped] = useState([false, false, false])
  const [showResult, setShowResult] = useState(false)
  const lastLetterRef = useRef<string | null>(null)
  const reelsRef = useRef(reelLetters)
  const stoppedRef = useRef(stopped)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!pendingLetter || pendingLetter === lastLetterRef.current) return
    lastLetterRef.current = pendingLetter
    setShowResult(false)

    const targetLetters = [randomLetter(), pendingLetter, randomLetter()]
    const startTime = Date.now()
    let frameId: number

    const tick = () => {
      const elapsed = Date.now() - startTime
      const newLetters = [...reelsRef.current]
      const newStopped = [...stoppedRef.current]

      for (let i = 0; i < 3; i++) {
        if (!newStopped[i] && elapsed >= SPIN_DURATIONS[i]) {
          newLetters[i] = targetLetters[i]
          newStopped[i] = true
        } else if (!newStopped[i]) {
          newLetters[i] = randomLetter()
        }
      }

      reelsRef.current = newLetters
      stoppedRef.current = newStopped
      setReelLetters(newLetters)
      setStopped(newStopped)

      if (newStopped.every(Boolean)) {
        setTimeout(() => {
          setShowResult(true)
          setTimeout(() => onCompleteRef.current(pendingLetter), 1200)
        }, 600)
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [pendingLetter])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, my: 4 }}>
      <Box sx={slotFrameStyles}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {reelLetters.map((letter, i) => {
            const isCenter = i === 1
            const isStopped = stopped[i]
            const isResult = isCenter && showResult
            return (
              <Box
                key={i}
                sx={{
                  ...reelStyles,
                  background: !isStopped
                    ? 'linear-gradient(135deg, #2d2d44, #3d3d5c)'
                    : isResult
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : (reelGradients as [string, string, string])[i],
                  boxShadow: !isStopped
                    ? 'inset 0 0 15px rgba(0,0,0,0.5)'
                    : isResult
                      ? '0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,215,0,0.2)'
                      : '0 0 20px rgba(255,255,255,0.15)',
                  border: isResult
                    ? '3px solid #FFD700'
                    : '2px solid rgba(255,255,255,0.1)',
                  transform: isResult ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: '3.5rem',
                    fontFamily: '"Courier New", monospace',
                    color: !isStopped
                      ? 'rgba(255,255,255,0.25)'
                      : isResult
                        ? '#1a1a2e'
                        : '#ffffff',
                    textShadow: isStopped && !isResult
                      ? '0 0 12px rgba(255,255,255,0.6)'
                      : isResult
                        ? '0 0 25px rgba(255,215,0,0.9)'
                        : 'none',
                    userSelect: 'none',
                  }}
                >
                  {letter}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Typography
        sx={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          animation: showResult
            ? 'none'
            : stopped.every(Boolean)
              ? 'none'
              : 'pulse 0.8s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.4 },
            '50%': { opacity: 1 },
          },
        }}
      >
        {showResult ? 'Seçilen Harf' : ''}
      </Typography>
    </Box>
  )
}

const slotFrameStyles: Record<string, unknown> = {
  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  borderRadius: 4,
  border: '3px solid rgba(255,255,255,0.15)',
  p: 4,
  boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)',
}

const reelStyles: Record<string, unknown> = {
  width: 110,
  height: 130,
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}

const reelGradients = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #ec4899, #f97316)',
]
