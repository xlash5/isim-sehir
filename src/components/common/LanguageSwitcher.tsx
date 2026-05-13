import { ToggleButtonGroup, ToggleButton, Typography, Box } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { useLocale } from '../../locales'

function TurkishFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#E30A17" rx="1" />
      <circle cx="8.2" cy="7" r="3.8" fill="white" />
      <circle cx="9.8" cy="7" r="3.2" fill="#E30A17" />
      <path d="M11.8 4.8l1 2.2 2.4.2-1.8 1.6.6 2.4-2.2-1.2-2.2 1.2.6-2.4-1.8-1.6 2.4-.2z" fill="white" />
    </svg>
  )
}

function EnglishFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#012169" rx="1" />
      <path d="M0 0l10 7M0 14l10-7M20 0l-10 7M20 14l-10 7" stroke="white" strokeWidth="2.2" />
      <path d="M0 0l10 7M0 14l10-7M20 0l-10 7M20 14l-10 7" stroke="#C8102E" strokeWidth="1.1" />
      <rect x="8" y="0" width="4" height="14" fill="white" />
      <rect x="0" y="5.5" width="20" height="3" fill="white" />
      <rect x="8.5" y="0" width="3" height="14" fill="#C8102E" />
      <rect x="0" y="6" width="20" height="2" fill="#C8102E" />
    </svg>
  )
}

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
        <ToggleButton value="tr" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem', gap: 0.5 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <TurkishFlag />
            Türkçe
          </Box>
        </ToggleButton>
        <ToggleButton value="en" sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem', gap: 0.5 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <EnglishFlag />
            English
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
