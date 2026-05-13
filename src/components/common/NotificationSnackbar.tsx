import { Snackbar, Alert } from '@mui/material'
import { useNotificationStore } from '../../stores/useNotificationStore'

export function NotificationSnackbar() {
  const { message, severity, dismiss } = useNotificationStore()

  return (
    <Snackbar
      open={message !== null}
      autoHideDuration={4000}
      onClose={dismiss}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={dismiss} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
