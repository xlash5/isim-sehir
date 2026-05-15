import { useState, useMemo, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, IconButton, Box } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import { darkTheme, lightTheme } from './theme'
import { PeerProvider } from './context/PeerContext'
import { LocaleProvider } from './locales'
import { LanguageSwitcher } from './components/common/LanguageSwitcher'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import { NotificationSnackbar } from './components/common/NotificationSnackbar'
import { SessionRestore } from './components/common/SessionRestore'
import { HomePage } from './pages/HomePage'
import { LobbyPage } from './pages/LobbyPage'
import { GamePage } from './pages/GamePage'
import { HistoryPage } from './pages/HistoryPage'
import { isSoundEnabled, setSoundEnabled } from './utils/sounds'

export default function App() {
  const [mode, setMode] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  )
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('theme', next)
  }

  const toggleSound = useCallback(() => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }, [soundOn])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LocaleProvider>
          <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            <IconButton
              onClick={toggleSound}
              sx={{ position: 'fixed', top: 16, right: 68, zIndex: 9999, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}
            >
              {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
            <IconButton
              onClick={toggleTheme}
              sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <PeerProvider>
              <ConnectionStatus />
              <NotificationSnackbar />
              <SessionRestore />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/room/:roomId" element={<LobbyPage />} />
                <Route path="/game/:roomId" element={<GamePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PeerProvider>
          </Box>
        </LocaleProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
