import { Avatar, Typography, Box } from '@mui/material'

interface Props {
  nickname: string
  isAdmin?: boolean
  isReady?: boolean
  size?: number
}

export function PlayerAvatar({ nickname, isAdmin, isReady, size = 40 }: Props) {
  const initial = nickname.charAt(0).toLocaleUpperCase('tr-TR')

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: isAdmin ? 'secondary.main' : 'primary.dark',
          fontSize: size * 0.45,
          fontWeight: 700,
        }}
      >
        {initial}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {nickname}
          {isAdmin && ' 👑'}
        </Typography>
        {isReady !== undefined && (
          <Typography variant="caption" sx={{ color: isReady ? 'success.main' : 'text.secondary' }}>
            {isReady ? '✅ Hazır' : '⏳ Hazır Değil'}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
