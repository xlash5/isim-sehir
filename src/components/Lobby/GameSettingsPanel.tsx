import { useState, useEffect } from 'react'
import {
  Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem,
  Chip, Button, Slider, OutlinedInput, Checkbox, ListItemText,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useGameStore } from '../../stores/useGameStore'
import { usePeer } from '../../context/PeerContext'
import { useLocale } from '../../locales'
import { CATEGORY_KEYS } from '../../utils/categories'
import { TURKISH_LETTERS } from '../../utils/letters'
import type { PeerMessage } from '../../types'

export function GameSettingsPanel() {
  const room = useGameStore((s) => s.room)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const { broadcastMessage } = usePeer()
  const { t } = useLocale()

  const isAdmin = room?.adminId === localPlayerId
  const isAdminReady = isAdmin && room?.players.find((p) => p.id === localPlayerId)?.isReady
  const settings = room?.settings
  const [editMode, setEditMode] = useState(false)
  const [categories, setCategories] = useState<string[]>(settings?.categories ?? [])
  const [totalRounds, setTotalRounds] = useState(settings?.totalRounds ?? 3)
  const [roundDuration, setRoundDuration] = useState<number | null>(settings?.roundDuration ?? 60)
  const [letterMode, setLetterMode] = useState<'all' | 'select'>('all')
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])

  useEffect(() => {
    if (settings) {
      setCategories(settings.categories)
      setTotalRounds(settings.totalRounds)
      setRoundDuration(settings.roundDuration)
    }
  }, [settings])

  if (!settings) return null

  const handleSave = () => {
    if (categories.length < 3) return
    const newSettings = {
      categories,
      totalRounds,
      roundDuration,
      letterPool: letterMode === 'all' ? TURKISH_LETTERS : selectedLetters,
    }
    updateSettings(newSettings)
    broadcastMessage({
      type: 'settings-update',
      senderId: localPlayerId!,
      payload: newSettings,
    } as PeerMessage)
    setEditMode(false)
  }

  const letterDisplay = letterMode === 'all'
    ? t('settings.letterDisplayAll')
    : t('settings.letterDisplaySelected', { count: selectedLetters.length })

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SettingsIcon fontSize="small" />
        <Typography variant="subtitle2">{t('lobby.settings')}</Typography>
      </Box>

      {(!editMode || isAdminReady) ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>{t('settings.categoriesCount', { count: settings.categories.length })}</strong>
          </Typography>
          <Typography variant="body2">
            <strong>{t('settings.roundsCount', { count: settings.totalRounds })}</strong>
          </Typography>
          <Typography variant="body2">
            <strong>{t('settings.durationValue', { value: settings.roundDuration === null ? t('settings.unlimited') : t('settings.seconds', { value: settings.roundDuration }) })}</strong>
          </Typography>
          <Typography variant="body2">
            <strong>{t('settings.letterPool')}:</strong> {letterDisplay}
          </Typography>
          {isAdmin && (
            <Button size="small" variant="outlined" onClick={() => setEditMode(true)} disabled={isAdminReady} sx={{ mt: 1 }}>
              {t('settings.edit')}
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('settings.categories')}</InputLabel>
            <Select
              multiple
              value={categories}
              onChange={(e) => {
                const val = e.target.value as string[]
                setCategories(val)
              }}
              input={<OutlinedInput label={t('settings.categories')} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => (
                    <Chip key={v} label={t(`category.${v}`)} size="small" />
                  ))}
                </Box>
              )}
            >
              {CATEGORY_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  <Checkbox checked={categories.includes(key)} />
                  <ListItemText primary={t(`category.${key}`)} />
                </MenuItem>
              ))}
            </Select>
            {categories.length < 3 && categories.length > 0 && (
              <Typography variant="caption" color="error">
                {t('settings.minCategories')}
              </Typography>
            )}
          </FormControl>

          <Box>
            <Typography variant="body2" gutterBottom>
              {t('settings.rounds', { count: totalRounds })}
            </Typography>
            <Slider
              value={totalRounds}
              onChange={(_, v) => setTotalRounds(v as number)}
              min={1}
              max={15}
              step={1}
              marks
            />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>{t('settings.duration')}</InputLabel>
            <Select
              value={roundDuration === null ? 'unlimited' : roundDuration}
              label={t('settings.duration')}
              onChange={(e) => {
                setRoundDuration(e.target.value === 'unlimited' ? null : (e.target.value as number))
              }}
            >
              <MenuItem value={30}>{t('settings.seconds', { value: 30 })}</MenuItem>
              <MenuItem value={60}>{t('settings.seconds', { value: 60 })}</MenuItem>
              <MenuItem value={90}>{t('settings.seconds', { value: 90 })}</MenuItem>
              <MenuItem value={120}>{t('settings.seconds', { value: 120 })}</MenuItem>
              <MenuItem value="unlimited">{t('settings.unlimited')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>{t('settings.letterPool')}</InputLabel>
            <Select
              value={letterMode}
              label={t('settings.letterPool')}
              onChange={(e) => setLetterMode(e.target.value as 'all' | 'select')}
            >
              <MenuItem value="all">{t('settings.letterPoolAll')}</MenuItem>
              <MenuItem value="select">{t('settings.letterPoolSelected')}</MenuItem>
            </Select>
          </FormControl>

          {letterMode === 'select' && (
            <FormControl size="small" fullWidth>
              <InputLabel>{t('settings.letterPool')}</InputLabel>
              <Select
                multiple
                value={selectedLetters}
                onChange={(e) => setSelectedLetters(e.target.value as string[])}
                input={<OutlinedInput label={t('settings.letterPool')} />}
                renderValue={(selected) => selected.join(', ')}
              >
                {TURKISH_LETTERS.map((l) => (
                  <MenuItem key={l} value={l}>
                    <Checkbox checked={selectedLetters.includes(l)} />
                    <ListItemText primary={l} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleSave} disabled={categories.length < 3}>
              {t('settings.save')}
            </Button>
            <Button variant="text" onClick={() => setEditMode(false)}>
              {t('settings.cancel')}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
