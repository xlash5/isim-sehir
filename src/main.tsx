import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0'),
  replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || '0'),
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') return null
    return event
  },
})

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    level: 'error',
    extra: { type: 'unhandled-promise-rejection' },
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
