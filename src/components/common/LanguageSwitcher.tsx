import { ToggleButtonGroup, ToggleButton, Typography, Box } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { useLocale } from '../../locales'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 2 }}>
      <TranslateIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t('home.language')}:
      </Typography>
      <ToggleButtonGroup
        value={locale}
        exclusive
        onChange={(_, newLocale) => {
          if (newLocale) setLocale(newLocale)
        }}
        size="small"
      >
        <ToggleButton value="tr" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem' }}>
          🇹🇷 Türkçe
        </ToggleButton>
        <ToggleButton value="en" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem' }}>
          🇬🇧 English
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
