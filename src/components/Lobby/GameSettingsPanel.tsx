import { useState, useEffect } from 'react'
import {
  Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem,
  Chip, Button, Slider, TextField, OutlinedInput, Checkbox, ListItemText,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useGameStore } from '../../stores/useGameStore'
import { usePeer } from '../../context/PeerContext'
import { CATEGORIES } from '../../utils/categories'
import { TURKISH_LETTERS } from '../../utils/letters'
import type { PeerMessage } from '../../types'

export function GameSettingsPanel() {
  const room = useGameStore((s) => s.room)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const { broadcastMessage } = usePeer()

  const isAdmin = room?.adminId === localPlayerId
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
    if (categories.length < 2) return
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

  const letterDisplay = letterMode === 'all' ? 'Tüm Harfler' : `${selectedLetters.length} harf seçili`

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SettingsIcon fontSize="small" />
        <Typography variant="subtitle2">Oyun Ayarları</Typography>
      </Box>

      {!editMode ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>Kategoriler:</strong> {settings.categories.length} seçili
          </Typography>
          <Typography variant="body2">
            <strong>Tur:</strong> {settings.totalRounds}
          </Typography>
          <Typography variant="body2">
            <strong>Süre:</strong> {settings.roundDuration === null ? 'Limitsiz' : `${settings.roundDuration}sn`}
          </Typography>
          <Typography variant="body2">
            <strong>Harfler:</strong> {letterDisplay}
          </Typography>
          {isAdmin && (
            <Button size="small" variant="outlined" onClick={() => setEditMode(true)} sx={{ mt: 1 }}>
              Ayarları Düzenle
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Kategoriler (min 2, max 10)</InputLabel>
            <Select
              multiple
              value={categories}
              onChange={(e) => {
                const val = e.target.value as string[]
                if (val.length <= 10) setCategories(val)
              }}
              input={<OutlinedInput label="Kategoriler (min 2, max 10)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => (
                    <Chip key={v} label={v} size="small" />
                  ))}
                </Box>
              )}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  <Checkbox checked={categories.includes(cat)} />
                  <ListItemText primary={cat} />
                </MenuItem>
              ))}
            </Select>
            {categories.length < 2 && (
              <Typography variant="caption" color="error">
                En az 2 kategori seçmelisiniz
              </Typography>
            )}
          </FormControl>

          <Box>
            <Typography variant="body2" gutterBottom>
              Tur Sayısı: {totalRounds}
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
            <InputLabel>Süre</InputLabel>
            <Select
              value={roundDuration === null ? 'unlimited' : roundDuration}
              label="Süre"
              onChange={(e) => {
                setRoundDuration(e.target.value === 'unlimited' ? null : (e.target.value as number))
              }}
            >
              <MenuItem value={30}>30 saniye</MenuItem>
              <MenuItem value={60}>60 saniye</MenuItem>
              <MenuItem value={90}>90 saniye</MenuItem>
              <MenuItem value={120}>120 saniye</MenuItem>
              <MenuItem value="unlimited">Limitsiz</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Harf Havuzu</InputLabel>
            <Select
              value={letterMode}
              label="Harf Havuzu"
              onChange={(e) => setLetterMode(e.target.value as 'all' | 'select')}
            >
              <MenuItem value="all">Tüm Harfler (Ğ hariç)</MenuItem>
              <MenuItem value="select">Seçilen Harfler</MenuItem>
            </Select>
          </FormControl>

          {letterMode === 'select' && (
            <FormControl size="small" fullWidth>
              <InputLabel>Harfler</InputLabel>
              <Select
                multiple
                value={selectedLetters}
                onChange={(e) => setSelectedLetters(e.target.value as string[])}
                input={<OutlinedInput label="Harfler" />}
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
            <Button variant="contained" onClick={handleSave} disabled={categories.length < 2}>
              Kaydet
            </Button>
            <Button variant="text" onClick={() => setEditMode(false)}>
              İptal
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
