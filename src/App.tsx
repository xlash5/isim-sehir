import { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, IconButton, Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
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
import { isSoundEnabled, setSoundEnabled } from './utils/sounds'

const LobbyPage = lazy(() => import('./pages/LobbyPage').then(m => ({ default: m.LobbyPage })))
const GamePage = lazy(() => import('./pages/GamePage').then(m => ({ default: m.GamePage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))


export default function App() {
  const [mode, setMode] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  )
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())
  const appTheme = useTheme()
  const isMobile = useMediaQuery(appTheme.breakpoints.down('md'))

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
              size={isMobile ? 'small' : 'medium'}
              sx={{
                position: 'fixed', zIndex: 9999,
                bgcolor: 'background.paper', boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' },
                top: isMobile ? 8 : 16, right: isMobile ? 52 : 68,
                width: isMobile ? 40 : undefined, height: isMobile ? 40 : undefined,
              }}
            >
              {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
            <IconButton
              onClick={toggleTheme}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                position: 'fixed', zIndex: 9999,
                bgcolor: 'background.paper', boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' },
                top: isMobile ? 8 : 16, right: isMobile ? 8 : 16,
                width: isMobile ? 40 : undefined, height: isMobile ? 40 : undefined,
              }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <PeerProvider>
              <ConnectionStatus />
              <NotificationSnackbar />
              <SessionRestore />
              <Suspense fallback={<CircularProgress />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/room/:roomId" element={<LobbyPage />} />
                  <Route path="/game/:roomId" element={<GamePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </PeerProvider>
          </Box>
        </LocaleProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
