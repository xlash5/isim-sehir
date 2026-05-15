import { Box, Tooltip } from '@mui/material'
import { usePeerStore } from '../../stores/usePeerStore'
import type { ConnectionStatus as ConnectionStatusType } from '../../stores/usePeerStore'
import { useLocale } from '../../locales'

const COLORS: Record<ConnectionStatusType, string> = {
  connected: '#4caf50',
  reconnecting: '#ff9800',
  disconnected: '#f44336',
}

const LOCALE_KEYS: Record<ConnectionStatusType, string> = {
  connected: 'connection.connected',
  reconnecting: 'connection.reconnecting',
  disconnected: 'connection.disconnected',
}

export function ConnectionStatus() {
  const connectionStatus = usePeerStore((s) => s.connectionStatus)
  const { t } = useLocale()

  return (
    <Tooltip title={t(LOCALE_KEYS[connectionStatus])}>
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          left: 16,
          zIndex: 9999,
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: COLORS[connectionStatus],
          boxShadow: 2,
          ...(connectionStatus === 'reconnecting' && {
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.3 },
              '100%': { opacity: 1 },
            },
          }),
        }}
      />
    </Tooltip>
  )
}
