import { Box, Typography, Button } from '@mui/material'
import * as Sentry from '@sentry/react'
import { useLocale } from '../../locales'

interface Props {
  eventId?: string
}

export function ErrorFallback({ eventId }: Props) {
  const { t } = useLocale()

  const handleReport = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId, lang: 'tr' })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
      <Typography variant="h5">{t('error.boundary.title')}</Typography>
      <Typography variant="body1" color="text.secondary">{t('error.boundary.message')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Button variant="contained" onClick={() => window.location.reload()}>
          {t('error.boundary.refresh')}
        </Button>
        {eventId && (
          <Button variant="outlined" onClick={handleReport}>
            {t('error.boundary.report')}
          </Button>
        )}
      </Box>
    </Box>
  )
}
