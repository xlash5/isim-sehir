import { useState, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, IconButton, Box } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { darkTheme, lightTheme } from './theme'
import { PeerProvider } from './context/PeerContext'
import { LocaleProvider } from './locales'
import { LanguageSwitcher } from './components/common/LanguageSwitcher'
import { HomePage } from './pages/HomePage'
import { LobbyPage } from './pages/LobbyPage'
import { GamePage } from './pages/GamePage'

export default function App() {
  const [mode, setMode] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  )

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('theme', next)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LocaleProvider>
          <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            <IconButton
              onClick={toggleTheme}
              sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <PeerProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/room/:roomId" element={<LobbyPage />} />
                <Route path="/game/:roomId" element={<GamePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PeerProvider>
          </Box>
        </LocaleProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
