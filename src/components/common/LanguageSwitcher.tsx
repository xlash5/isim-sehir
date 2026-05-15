import { Autocomplete, TextField, Box, Typography } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import type { ReactNode } from 'react'
import { useLocale, type Locale } from '../../locales'

interface LanguageOption {
  code: Locale
  label: string
  Flag: () => ReactNode
}

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

function SpanishFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#C60B1E" rx="1" />
      <rect y="3" width="20" height="8" fill="#FFC400" />
      <rect y="5" width="20" height="4" fill="#C60B1E" />
    </svg>
  )
}

function PortugueseFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#006600" rx="1" />
      <rect x="4" y="0" width="8" height="14" fill="#FF0000" />
      <circle cx="10" cy="7" r="2.5" fill="#FFD700" />
      <circle cx="11.2" cy="7" r="1.8" fill="#006600" />
      <path d="M10.5 5.5l.6 1.2 1.3.1-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.1z" fill="#FFD700" />
    </svg>
  )
}

function FrenchFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#FFFFFF" rx="1" />
      <rect x="0" width="6.67" height="14" fill="#002395" />
      <rect x="13.33" width="6.67" height="14" fill="#ED2939" />
    </svg>
  )
}

function GermanFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" fill="#FFCE00" rx="1" />
      <rect width="20" height="4.67" fill="#000000" />
      <rect y="9.33" width="20" height="4.67" fill="#DD0000" />
    </svg>
  )
}

const LANGUAGES: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', Flag: TurkishFlag },
  { code: 'en', label: 'English', Flag: EnglishFlag },
  { code: 'es', label: 'Español', Flag: SpanishFlag },
  { code: 'pt', label: 'Português', Flag: PortugueseFlag },
  { code: 'fr', label: 'Français', Flag: FrenchFlag },
  { code: 'de', label: 'Deutsch', Flag: GermanFlag },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()
  const selected = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 3 }}>
      <TranslateIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {t('home.language')}:
      </Typography>
      <Autocomplete
        value={selected}
        onChange={(_, option) => {
          if (option) setLocale(option.code)
        }}
        options={LANGUAGES}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        disableClearable
        size="small"
        sx={{ minWidth: 160, maxWidth: 240, flex: { xs: 1, sm: 'none' } }}
        renderOption={(props, option) => {
          const { key, ...rest } = props
          return (
            <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
              <option.Flag />
              <Typography variant="body2">{option.label}</Typography>
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={t('home.language')}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                    <selected.Flag />
                  </Box>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  )
}
