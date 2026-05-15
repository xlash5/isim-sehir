import { Avatar, Typography, Box } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useLocale } from '../../locales'

interface Props {
  nickname: string
  isAdmin?: boolean
  isReady?: boolean
  isSpectator?: boolean
  size?: number
}

export function PlayerAvatar({ nickname, isAdmin, isReady, isSpectator, size = 40 }: Props) {
  const initial = nickname.charAt(0).toLocaleUpperCase('tr-TR')
  const { t } = useLocale()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: isAdmin ? 'secondary.main' : isSpectator ? 'grey.600' : 'primary.dark',
          fontSize: size * 0.45,
          fontWeight: 700,
        }}
      >
        {isSpectator ? <VisibilityIcon sx={{ fontSize: size * 0.55 }} /> : initial}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {nickname}
          {isAdmin && ' 👑'}
        </Typography>
        {isSpectator && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {t('player.spectator')}
          </Typography>
        )}
        {!isSpectator && isReady !== undefined && (
          <Typography variant="caption" sx={{ color: isReady ? 'success.main' : 'text.secondary' }}>
            {isReady ? t('player.ready') : t('player.notReady')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
