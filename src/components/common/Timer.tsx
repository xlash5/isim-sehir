import { Typography, Box } from '@mui/material'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import { useGameStore } from '../../stores/useGameStore'

export function Timer() {
  const timer = useGameStore((s) => s.timer)
  const duration = useGameStore((s) => s.room?.settings.roundDuration)

  if (timer === null || duration === null) return null

  const pct = duration ? (timer / duration) * 100 : 100
  const isUrgent = timer <= 10

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <HourglassTopIcon color={isUrgent ? 'error' : 'primary'} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isUrgent ? 'error.main' : 'text.primary',
          animation: isUrgent ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        }}
      >
        {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
      </Typography>
      <Box
        sx={{
          width: 100,
          height: 6,
          bgcolor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: '100%',
            bgcolor: isUrgent ? 'error.main' : 'primary.main',
            borderRadius: 3,
            transition: 'width 1s linear',
          }}
        />
      </Box>
    </Box>
  )
}
