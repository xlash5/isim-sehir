import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { TURKISH_LETTERS } from '../../utils/letters'

const SEGMENT_COUNT = TURKISH_LETTERS.length
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

interface Props {
  onComplete: (letter: string) => void
  spinning?: boolean
}

export function SpinningWheel({ onComplete, spinning: externalSpinning }: Props) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(true)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  useEffect(() => {
    if (externalSpinning === false) return

    const targetIndex = Math.floor(Math.random() * SEGMENT_COUNT)
    const targetAngle = 360 * 5 + targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    const startRotation = rotation

    const startTime = performance.now()
    const duration = 3000 + Math.random() * 2000

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      const currentRotation = startRotation + (targetAngle - startRotation) * eased
      setRotation(currentRotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        const letter = TURKISH_LETTERS[targetIndex]
        setSelectedLetter(letter)
        onComplete(letter)
      }
    }

    requestAnimationFrame(animate)
  }, [externalSpinning])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 4 }}>
      {isSpinning ? (
        <Box
          sx={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '4px solid',
            borderColor: 'primary.main',
            position: 'relative',
            overflow: 'hidden',
            transform: `rotate(${rotation}deg)`,
            transition: 'none',
          }}
        >
          {TURKISH_LETTERS.map((letter, i) => {
            const angle = i * SEGMENT_ANGLE
            const colors = ['#1e2937', '#0a1929']
            return (
              <Box
                key={letter}
                sx={{
                  position: 'absolute',
                  width: '50%',
                  height: '50%',
                  left: '50%',
                  top: 0,
                  transformOrigin: '0 100%',
                  transform: `rotate(${angle}deg)`,
                  bgcolor: colors[i % 2],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  clipPath: `polygon(0 0, 100% 0, 0 100%)`,
                }}
              >
                <Typography
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(90deg)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: '#f1f5f9',
                  }}
                >
                  {letter}
                </Typography>
              </Box>
            )
          })}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '4px solid',
              borderColor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(206, 147, 216, 0.1)',
              animation: 'glow 2s ease-in-out infinite',
              '@keyframes glow': {
                '0%, 100%': { boxShadow: '0 0 20px rgba(206, 147, 216, 0.3)' },
                '50%': { boxShadow: '0 0 40px rgba(206, 147, 216, 0.6)' },
              },
            }}
          >
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: '5rem' }}>
              {selectedLetter}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Seçilen Harf
          </Typography>
        </Box>
      )}
    </Box>
  )
}
