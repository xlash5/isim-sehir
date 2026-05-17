import { useState, useRef } from 'react'
import {
  Box, Tooltip, useMediaQuery, useTheme, Typography, Button, Paper, Popper, ClickAwayListener,
} from '@mui/material'
import { usePeerStore } from '../../stores/usePeerStore'
import type { ConnectionStatus as ConnectionStatusType } from '../../stores/usePeerStore'
import { useNotificationStore } from '../../stores/useNotificationStore'
import { useLocale } from '../../locales'

type DisplayState = 'idle' | 'connected' | 'reconnecting' | 'disconnected' | 'server-down'

const COLORS: Record<DisplayState, string> = {
  idle: 'rgba(158, 158, 158, 0.5)',
  connected: '#4caf50',
  reconnecting: '#ff9800',
  disconnected: '#f44336',
  'server-down': '#f44336',
}

const PULSING: DisplayState[] = ['reconnecting']

export function ConnectionStatus() {
  const connectionStatus = usePeerStore((s) => s.connectionStatus)
  const serverReachable = usePeerStore((s) => s.serverReachable)
  const connections = usePeerStore((s) => s.connections)
  const probeRetryAttempt = usePeerStore((s) => s.probeRetryAttempt)
  const retryProbe = usePeerStore((s) => s.retryProbe)
  const { t } = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const anchorRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const serverDown = serverReachable === false && connectionStatus === 'idle'
  const displayState: DisplayState = serverDown
    ? 'server-down'
    : connectionStatus

  const peerCount = connections.size

  let tooltipText: string
  switch (displayState) {
    case 'idle':
      tooltipText = t('connection.idle')
      break
    case 'connected':
      tooltipText = t('connection.peerCount', { count: peerCount })
      break
    case 'reconnecting':
      tooltipText = t('connection.reconnectingAttempt', { attempt: Math.min(probeRetryAttempt + 1, 6), max: 6 })
      break
    case 'disconnected':
      tooltipText = t('connection.disconnected')
      break
    case 'server-down':
      tooltipText = t('connection.serverDown')
      break
    default:
      tooltipText = ''
  }

  const handleClick = () => {
    setPopoverOpen((prev) => !prev)
  }

  const handleRetry = () => {
    retryProbe()
    setPopoverOpen(false)
  }

  return (
    <>
      <Tooltip title={tooltipText} arrow>
        <Box
          ref={anchorRef}
          onClick={handleClick}
          sx={{
            position: isMobile ? 'absolute' : 'fixed',
            top: isMobile ? 14 : 20,
            left: isMobile ? 14 : 16,
            zIndex: 9999,
            width: isMobile ? 10 : 12,
            height: isMobile ? 10 : 12,
            borderRadius: '50%',
            bgcolor: COLORS[displayState],
            boxShadow: 2,
            cursor: displayState === 'disconnected' || displayState === 'server-down' || displayState === 'connected' ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(PULSING.includes(displayState) && {
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.3 },
                '100%': { opacity: 1 },
              },
            }),
            '&::after': displayState === 'server-down'
              ? {
                  content: '"!"',
                  color: '#fff',
                  fontSize: isMobile ? 6 : 8,
                  fontWeight: 700,
                  lineHeight: 1,
                }
              : {},
          }}
        />
      </Tooltip>
      <Popper
        open={popoverOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 10000 }}
      >
        <ClickAwayListener onClickAway={() => setPopoverOpen(false)}>
          <Paper
            sx={{
              p: 1.5,
              minWidth: 220,
              maxWidth: 300,
              mt: 0.5,
              bgcolor: 'background.paper',
              boxShadow: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {tooltipText}
            </Typography>
            {displayState === 'connected' && (
              <Typography variant="caption" color="text.secondary">
                {t('connection.peerCount', { count: peerCount })}
              </Typography>
            )}
            {(displayState === 'disconnected' || displayState === 'reconnecting') && (
              <Button size="small" variant="outlined" onClick={handleRetry} sx={{ mt: 1 }}>
                {t('connection.retry')}
              </Button>
            )}
            {displayState === 'reconnecting' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {t('connection.reconnectingAttempt', { attempt: Math.min(probeRetryAttempt + 1, 6), max: 6 })}
              </Typography>
            )}
            {(displayState === 'disconnected' || displayState === 'server-down') && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {t('connection.troubleshoot')}
              </Typography>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  )
}
