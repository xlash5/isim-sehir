# İsim Şehir — v3.0 Error Boundary & Error Monitoring

> **Priority:** P01 — production crash visibility and graceful degradation
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The application currently has no error handling beyond basic try/catch in a few places. A runtime crash in any component brings down the entire React tree (blank screen / white page). There is no error reporting — the developer has no visibility into production crashes. This spec adds React Error Boundaries at strategic levels and integrates Sentry for crash reporting.

## Requirements

### 1. React Error Boundaries

Wrap the app at three levels:

| Boundary | Scope | Behaviour |
|---|---|---|
| **Root boundary** (`App.tsx`) | Catches unhandled render errors anywhere in the app | Shows a full-page fallback: *"Bir hata oluştu. Sayfayı yenilemeyi deneyin."* + "Sayfayı Yenile" button. Reports to Sentry. |
| **Game boundary** (`GamePage.tsx`) | Catches errors in the game UI only | Shows game-specific fallback: preserves lobby/chat if possible, shows *"Oyun sırasında bir hata oluştu. Lobiye dönmeyi deneyin."* + "Lobiye Dön" and "Sayfayı Yenile" buttons. Reports to Sentry. |
| **Peer boundary** (`PeerContext.tsx`) | Catches PeerJS errors | Does NOT show a full-page error. Logs to Sentry, shows a snackbar: *"Bağlantı hatası. Yeniden bağlanılıyor…"*, triggers reconnect flow. |

Each boundary:
- Is a class component (React error boundaries require `componentDidCatch`).
- Logs `error` and `errorInfo` to Sentry.
- Renders a localised fallback UI with a recovery action.
- Does not unmount ancestor providers (theme, locale, peer).

### 2. Sentry Integration

| Item | Detail |
|---|---|
| SDK | `@sentry/react` (includes `ErrorBoundary` component, but we use custom boundaries for fine-grained control) |
| DSN | Set via `VITE_SENTRY_DSN` environment variable; no-op if absent |
| Environments | `development` (localhost), `production` (Vercel) — distinguished by `SENTRY_ENVIRONMENT` or auto-detected |
| Performance tracing | Optional, sample rate 0.1 (10%) — `SENTRY_TRACES_SAMPLE_RATE` env var |
| Replay | Optional, sample rate 0.1 — `SENTRY_REPLAY_SAMPLE_RATE` env var |

#### What to capture

| Event | Captured? | Level |
|---|---|---|
| Unhandled React render errors | ✅ via ErrorBoundary | `error` |
| Unhandled promise rejections | ✅ via `beforeunhandledrejection` handler | `error` |
| PeerJS connection errors | ✅ via `peer.on('error')` and `conn.on('error')` | `warning` |
| Rate limit violations | ✅ in `rateLimiter.ts` `console.warn` → Sentry `captureMessage` | `warning` |
| Message validation failures | ✅ in `messageValidator.ts` → Sentry `captureMessage` | `warning` |
| Admin transfer events | ✅ explicit `captureMessage` with context | `info` |
| Game start / end events | ✅ explicit `captureMessage` with player count, settings | `info` |

#### What NOT to capture

- Chat messages (privacy / noise)
- Individual votes or answers (privacy)
- Ping/pong heartbeats (noise)
- Console.debug / console.log calls

### 3. User Feedback Dialog

On production errors, offer a **"Bildir" (Report)** button in the error fallback that opens Sentry's User Feedback widget:

```
Bir hata oluştu.
Ne yapmak istiyordun? (opsiyonel)
[Gönder]
```

This gives the developer context around the crash.

### 4. Graceful Degradation per Component

For non-critical components, wrap individually so a crash in one doesn't take down the whole page:

| Component | Fallback |
|---|---|
| `ChatBox.tsx` | Hidden completely + snackbar *"Sohbet yüklenemedi."* |
| `SlotMachine.tsx` | Show letter as plain text instead of animation |
| `GradingPanel.tsx` | Show *"Değerlendirme yüklenemedi. Sayfayı yenilemeyi deneyin."* |
| `Scoreboard.tsx` | Show raw scores as a simple list, no styling |

Use `@sentry/react`'s `withErrorBoundary` HOC for these simple cases with a minimal inline fallback.

## Technical Design

### Sentry Initialisation

In `src/main.tsx`, before `ReactDOM.createRoot`:

```ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' | 'production'
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0'),
  replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || '0'),
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter out known non-actionable errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') return null
    return event
  },
})
```

### Error Boundary Component

```tsx
// src/components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  // Standard error boundary lifecycle
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
    this.props.onError?.(error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback || <DefaultFallback />
    return this.props.children
  }
}
```

### Error Levels Map

| Area | Capture Method | Level | Sample Rate |
|---|---|---|---|
| Error boundaries | `captureException` | error | 1.0 |
| Unhandled promise rejections | `Sentry.browserTracingIntegration` (auto) | error | 1.0 |
| PeerJS connection errors | `captureException` in `peer.on('error')` | warning | 1.0 |
| Rate limit violations | `captureMessage('rate-limit', …)` | warning | 1.0 |
| Message validation failures | `captureMessage('validation', …)` | warning | 1.0 |
| Admin transfer events | `captureMessage('admin-transfer', …)` | info | 1.0 |
| Game lifecycle events | `captureMessage('game-start', …)` | info | 0.5 |
| Performance traces | Auto via `browserTracingIntegration` | — | 0.1 |
| Session replays | Auto via `replayIntegration` | — | 0.1 |

### Environment Variables

| Variable | Default | Required | Purpose |
|---|---|---|---|
| `VITE_SENTRY_DSN` | — | No (Sentry no-op if absent) | Sentry project DSN |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0` | No | Performance tracing sample rate (0-1) |
| `VITE_SENTRY_REPLAY_SAMPLE_RATE` | `0` | No | Session replay sample rate (0-1) |

## Files to Create

- `src/components/common/ErrorBoundary.tsx` — configurable error boundary component
- `src/components/common/ErrorFallback.tsx` — default full-page fallback UI
- `src/components/common/GameErrorFallback.tsx` — game-specific fallback with "Lobiye Dön"

## Files to Modify

- `src/main.tsx` — add Sentry.init
- `src/App.tsx` — wrap with root ErrorBoundary
- `src/pages/GamePage.tsx` — wrap with game ErrorBoundary
- `src/context/PeerContext.tsx` — add PeerJS error → Sentry capture
- `src/utils/rateLimiter.ts` — add Sentry captureMessage on violations
- `src/utils/messageValidator.ts` — add Sentry captureMessage on validation failures
- `src/components/common/ChatBox.tsx` — wrap with withErrorBoundary
- `src/components/Game/SlotMachine.tsx` — wrap with withErrorBoundary
- `src/components/Game/GradingPanel.tsx` — wrap with withErrorBoundary
- `src/components/Game/Scoreboard.tsx` — wrap with withErrorBoundary

## Dependencies to Add

| Package | Reason |
|---|---|
| `@sentry/react` | React SDK with ErrorBoundary HOC, browser tracing |
| `@sentry/browser` | PeerJS error capture (non-React contexts) |

## Acceptance Criteria

- [ ] Unhandled render error shows localised fallback UI (not blank white page)
- [ ] Error in ChatBox does not break the main game UI
- [ ] Error in GamePage preserves lobby navigation
- [ ] PeerJS connection error is captured at warning level, triggers reconnect
- [ ] Rate limit violations are captured at warning level
- [ ] Message validation failures are captured at warning level
- [ ] Game start/end events are captured at info level
- [ ] Sentry is no-op when `VITE_SENTRY_DSN` is not set (dev friendliness)
- [ ] User feedback dialog available on production errors
- [ ] All new strings are localised in 6 languages
