import { Box, Typography, Button } from '@mui/material'
import * as Sentry from '@sentry/react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../../locales'

interface Props {
  roomCode?: string
  eventId?: string
}

export function GameErrorFallback({ roomCode, eventId }: Props) {
  const { t } = useLocale()
  const navigate = useNavigate()

  const handleReport = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId, lang: 'tr' })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
      <Typography variant="h5">{t('error.game.title')}</Typography>
      <Typography variant="body1" color="text.secondary">{t('error.game.message')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Button variant="contained" onClick={() => roomCode ? navigate(`/room/${roomCode}`) : navigate('/')}>
          {t('error.game.backToLobby')}
        </Button>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t('error.boundary.refresh')}
        </Button>
        {eventId && (
          <Button variant="text" onClick={handleReport}>
            {t('error.boundary.report')}
          </Button>
        )}
      </Box>
    </Box>
  )
}
