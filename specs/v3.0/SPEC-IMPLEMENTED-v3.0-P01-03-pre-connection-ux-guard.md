# İsim Şehir — v3.0 Pre-Connection UX Guard

> **Priority:** P01 — every user hits this on every visit; silent failure causes confusion
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

The home page currently gives no upfront indication of signaling server health. A user opens the app, enters a nickname, clicks "Create Room" or "Join Room", then stares at a spinner for 10 seconds before learning the server is unreachable. This is a poor first impression and creates confusion — the user cannot distinguish between "loading" and "broken".

The existing `ConnectionStatus` component (a 12px coloured dot in the top-left corner) only shows connection state *after* a peer is created, and its tiny size is easy to miss.

This spec adds **proactive server health probing**, **gated action buttons**, and a **prominent status banner** so the user always knows whether the server is reachable *before* attempting to play.

## Requirements

### 1. Connection Health Probe on Page Load

When the home page mounts, the app performs a lightweight reachability check against the PeerJS signaling server **before** the user clicks anything.

```
Page load → probe signaling server → set initial connection state
                                           ↓
                              connected / probing / unreachable
```

- The probe must complete within **3 seconds** and resolve one of three states: `connected`, `probing` (still waiting), or `unreachable`.
- The probe is a simple HTTP HEAD / GET to the PeerJS server health endpoint (or a WebSocket health probe if no HTTP endpoint exists).
- A successful probe (server responds) → `connected`.
- A failed / timed-out probe (no response in 3s) → `unreachable`.
- While probing → `probing`.
- Re-probe every **30 seconds** while on the home page (in case server recovers).
- Re-probe immediately after a failed connection attempt.

### 2. Prominent Connection Banner

Replace the tiny fixed-position `ConnectionStatus` dot on the home page with a **full-width banner** between the title and the login paper:

| State | Banner Colour | Message (example) |
|---|---|---|
| `connected` | `success.main` (green) *or* hidden once proven | *"Sunucuya bağlandı — oyun oluşturabilir veya katılabilirsiniz."* |
| `probing` | `info.main` (blue) with subtle pulse animation | *"Sunucu kontrol ediliyor…"* |
| `unreachable` | `error.main` (red) | *"Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin."* |

- The `connected` banner may auto-dismiss after 3 seconds since it is a happy path — the user does not need to see it forever.
- The `unreachable` banner is persistent until the server becomes reachable again. It includes a **"Tekrar Dene" / "Retry"** button that re-probes immediately.
- The `probing` banner auto-dismisses when the state resolves.

### 3. Gated Action Buttons

The "Create Room" and "Join Room" buttons must reflect the connection state:

| State | Button Behaviour |
|---|---|
| `connected` | Enabled normally (current behaviour) |
| `probing` | Disabled with tooltip: *"Sunucu kontrol ediliyor, lütfen bekleyin…"* |
| `unreachable` | Disabled with tooltip: *"Sunucuya bağlanılamadı. Bağlantı kurulduğunda tekrar deneyin."* |

- Buttons are wrapped in MUI `Tooltip` so the user always understands *why* they are disabled.
- The disabled state has reduced opacity (MUI default) to signal non-interactivity.
- No spinner on the buttons themselves — the banner handles all progress communication.

### 4. Existing ConnectionStatus Component Update

The `ConnectionStatus` component (the coloured dot used in-room) must be **extracted** to a shared signal that also drives the home-page probe state. The dot is fine inside the game/lobby, but the home page should use the banner instead.

- Refactor `usePeerStore.connectionStatus` to also expose a new field `serverReachable` (`boolean | null`).
- The home page reads `serverReachable` to decide banner + button gating.
- Expose a `probeServer()` action on `usePeerStore` that the home page calls in `useEffect`.
- When `peer` is already created and connected, `serverReachable` is trivially `true`.
- When no `peer` exists (home page initial state), `probeServer()` performs the HTTP reachability check.

### 5. Faster Failure Feedback

Currently, when the user clicks "Create Room" with an unreachable server, they wait 10 seconds before `peerError` fires. With the probe in place:

- If `serverReachable` is already `false` when the user clicks → **immediate feedback** — do not call `createPeer()` at all, show a snackbar: *"Sunucu kapalı. Lütfen bağlantı kurulduğunda tekrar deneyin."*
- If `serverReachable` is `true` but the actual PeerJS connection fails → reduce the timeout from 10 seconds to **5 seconds** for a snappier failure.

### 6. Reconnection Awareness on Home Page

If the server goes down while the user is still on the home page (e.g. they are filling in the nickname field):

- The banner transitions from `connected` → `probing` → `unreachable`.
- Buttons become disabled automatically.
- The "Retry" button on the banner triggers `probeServer()` immediately.
- When the server comes back, the banner transitions to `connected` and buttons re-enable automatically.

### 7. Locale Keys

All 6 languages need translations for:

| Key | Purpose |
|---|---|
| `connection.probing` | "Checking server…" |
| `connection.unreachable` | "Could not reach server. Please refresh or try again later." |
| `connection.retry` | "Retry Connection" |
| `connection.reconnected` | "Server connection restored." |
| `tooltip.connecting` | "Checking server connection, please wait…" |
| `tooltip.serverDown` | "Server unreachable. Please try again when the connection is established." |
| `tooltip.serverDownAction` | "Server is down. Please try again once connected." |

The existing `connection.connected`, `connection.reconnecting`, `connection.disconnected` keys are reused.

## Technical Design

### New / Modified Files

| File | Change |
|---|---|
| `src/stores/usePeerStore.ts` | Add `serverReachable` field + `probeServer()` action |
| `src/pages/HomePage.tsx` | Read `serverReachable`, add banner, gate buttons, `useEffect` probe on mount |
| `src/components/common/ConnectionStatus.tsx` | Keep as-is for in-game; no longer used on home page |
| `src/locales/*.ts` | Add ~7 new keys per language |

### Data Flow

```
HomePage mounts
  ↓
useEffect → probeServer()
  ↓
usePeerStore.serverReachable = null → 'probing' → true | false
  ↓
Banner renders based on state
Buttons gated based on state
  ↓
30s interval re-probes
User clicks "Retry" re-probes
```

### Probe Implementation

```typescript
// In usePeerStore
serverReachable: boolean | null = null

probeServer: async () => {
  set({ serverReachable: null }) // probing
  try {
    const host = import.meta.env.VITE_PEER_HOST || 'localhost'
    const port = Number(import.meta.env.VITE_PEER_PORT) || 9000
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`https://${host}:${port}/health`, {
      signal: controller.signal,
      mode: 'no-cors', // PeerJS server may not have CORS
    })
    clearTimeout(timeout)
    set({ serverReachable: true })
  } catch {
    set({ serverReachable: false })
  }
}
```

If the PeerJS server does not expose a `/health` endpoint, use a WebSocket connection attempt instead, or a simple TCP socket connect via a lightweight proxy. If neither is feasible, probe by attempting `new Peer()` and listening for `open` / `error` events — but this is slower and creates side effects. The preferred approach is a lightweight HTTP probe.

## Acceptance Criteria

- [ ] Home page shows a connection banner (probing → connected or unreachable) within 3 seconds of mount
- [ ] "Create Room" and "Join Room" buttons are disabled while probing and when unreachable, with explanatory tooltips
- [ ] Connected banner auto-dismisses after 3 seconds; unreachable banner persists with Retry button
- [ ] Retry button re-probes the server immediately
- [ ] Server going down while on home page triggers banner transition and disables buttons automatically
- [ ] Server coming back re-enables buttons and dismisses error banner
- [ ] When user clicks a button while server is unreachable, feedback is immediate (no spinner wait)
- [ ] All new UI strings are localised in all 6 languages
- [ ] No breaking changes to existing game or lobby behaviour
- [ ] Existing `ConnectionStatus` dot still works inside game/lobby pages
