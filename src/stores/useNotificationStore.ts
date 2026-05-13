import { create } from 'zustand'

interface NotificationState {
  message: string | null
  severity: 'info' | 'warning' | 'error' | 'success'
  show: (message: string, severity?: NotificationState['severity']) => void
  dismiss: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  severity: 'info',
  show: (message, severity = 'info') => set({ message, severity }),
  dismiss: () => set({ message: null, severity: 'info' }),
}))
