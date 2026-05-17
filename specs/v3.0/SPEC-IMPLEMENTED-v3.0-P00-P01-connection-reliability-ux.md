# İsim Şehir — v3.0 Connection Reliability & UX Overhaul

> **Priority:** P00 — highest priority, supersedes all P01+ items
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

Users report that the home page sometimes displays "Could not reach server" and the "Retry Connection" button keeps failing, yet a page refresh resolves the issue. Additionally, the coloured connection dot (top-left) and its tooltip are confusing — they reflect P2P mesh health (not server reachability), give no useful detail, and provide no actionable feedback.

This spec fixes the root cause of the unreliable probe, makes the connection indicator meaningful, and improves the overall connection UX without shifting layout elements.

## Root Cause Analysis

### Why does the probe fail (but refresh fixes it)?

The current `probeServer()` in `usePeerStore` does:

```typescript
await fetch(`${protocol}://${host}:${port}/`, {
  signal: controller.signal,
  mode: 'no-cors',
})
```

Three problems:

1. **Wrong probe path.** The PeerJS server (`peer` npm package, `uWebSockets.js`-based) listens on the configured port but only handles WebSocket upgrades at `/isim-sehir` and its internal PeerJS REST paths (`/peerjs/...`). A plain `GET /` to the server produces no valid HTTP response from uWS — the request hangs until the 3-second AbortController timeout fires, causing the probe to *always* fail when the server is idle.

2. **`no-cors` mode makes responses opaque.** Even if the server *did* respond, `no-cors` prevents JavaScript from reading the HTTP status. The fetch resolves on *any* response (even 404/500), making it impossible to distinguish "server healthy" from "server broken-but-speaking-HTTP".

3. **No cooldown or backoff on retry.** Clicking "Retry" calls `probeServer()` immediately. If the server is under load or warming up from a cold start, the second probe hits the same 3-second window and fails identically. A page refresh gives enough time for the server to become responsive, which is why it "fixes" the issue.

### Why is the coloured dot confusing?

The `ConnectionStatus` component reads `connectionStatus` from `usePeerStore`, which tracks P2P mesh health (ping/pong between connected peers):

| State | Meaning | When it shows |
|---|---|---|
| `connected` | All peer pongs received within 15s | In a game room with active connections |
| `reconnecting` | Some pongs stale, auto-retry active | During transient network issues |
| `disconnected` | No connections exist, or all retries failed | **Home page before joining a room** |

On the home page, the user has no P2P connections yet, so the dot shows **red ("disconnected")** from the moment they land. This looks alarming but is completely normal. The tooltip says "Disconnected" which is misleading — the signalling server may be perfectly healthy.

## Requirements

### 1. Reliable Server Health Probe

**1a. Add a health endpoint to the signalling server (`server/index.js`)**

The PeerJS server must expose a lightweight HTTP health check that responds quickly (sub-100ms) and returns a 200 status:

```
GET /isim-sehir/health → 200 { "status": "ok", "uptime": 12345 }
```

- Must set `Content-Type: application/json`
- Must set CORS headers (`Access-Control-Allow-Origin: *` or the configured `ALLOWED_ORIGINS`)
- Must respond within 50ms (no async work)
- Must include process uptime for observability

**1b. Fix the probe path and remove `no-cors`**

Update `probeServer()` in `usePeerStore`:

```
Before:  fetch(`http://${host}:${port}/`, { mode: 'no-cors' })
After:   fetch(`http://${host}:${port}/isim-sehir/health`)
```

- Remove `mode: 'no-cors'` — the health endpoint will set proper CORS headers
- Remove the 3-second `AbortController` timeout, or increase to 5 seconds (the health endpoint is trivial)
- Re-probe interval stays at 30s for the home page

**1c. Add exponential backoff to retry**

When the user clicks "Retry" on the unreachable banner:

- First retry: immediate
- Second retry: 2s delay before probe
- Third retry: 5s delay before probe
- Fourth+ retry: 10s delay before probe
- Reset backoff on successful probe or page refresh

This prevents hammering a server that's still warming up.

**1d. Detect stale probe state and auto-recover**

If `serverReachable` is `false` and the user is still on the home page, the existing 30s interval will re-probe. But if the probe failed due to a transient issue and the interval tick doesn't align, the user can be stuck. Add a secondary recovery mechanism:

- If `serverReachable` was `true` and transitions to `false`, schedule an accelerated probe every 10s for the first minute (3 attempts), then fall back to the standard 30s interval.
- This handles the "server went down briefly and came back" case without a page refresh.

### 2. Server Health Probe Implementation

#### `server/index.js`

Add a health endpoint before or after the `PeerServer` creation. Since the `peer` package uses uWS internally, we need to access the underlying HTTP server or add a uWS route:

```javascript
// Option A: Use the peer server's internal HTTP server
// (peerServer._server is the uWS App or http.Server depending on version)
// For uWS: add a route before listen
// For http.Server: add a request listener

// Option B: Create a separate lightweight HTTP server for health
import http from 'http'

const healthServer = http.createServer((req, res) => {
  if (req.url === '/isim-sehir/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

healthServer.listen(PORT)
```

- Use a dedicated `http.Server` on a separate port, or reuse the PeerJS server's HTTP layer if accessible.
- If a separate port is used, update the `VITE_PEER_PORT` / health probe URL accordingly. **Prefer reusing the same port** by hooking into the PeerJS server's HTTP layer to avoid firewall/port complexity.

For simplicity and reliability, the preferred approach is to run a lightweight `http.createServer` alongside the PeerJS server on the same port by wrapping them with `http.createServer` and routing manually, or by adding a uWS route. Since PeerJS abstracts the server, the simplest reliable approach is:

**Recommended approach:** Use Node.js `http.createServer` on the same port, inspect incoming requests, and forward WebSocket upgrades to PeerJS's handler while responding to `GET /isim-sehir/health` directly.

If a clean interop with PeerJS's internal server is not feasible, run the health server on `PORT + 1` (configurable via `HEALTH_PORT` env var) and update the client probe URL.

#### `src/stores/usePeerStore.ts`

```typescript
probeServer: async () => {
  set({ serverReachable: null })
  try {
    const host = import.meta.env.VITE_PEER_HOST || 'localhost'
    const port = Number(import.meta.env.VITE_PEER_PORT) || 9000
    const protocol = location.protocol === 'https:' ? 'https' : 'http'
    const res = await fetch(`${protocol}://${host}:${port}/isim-sehir/health`)
    set({ serverReachable: res.ok })
  } catch {
    set({ serverReachable: false })
  }
},
```

Add a backoff-aware retry:

```typescript
retryProbe: async () => {
  const backoff = [0, 2000, 5000, 10000]
  const attempt = get().probeRetryAttempt ?? 0
  const delay = backoff[Math.min(attempt, backoff.length - 1)]
  set({ probeRetryAttempt: attempt + 1 })
  await new Promise(r => setTimeout(r, delay))
  await get().probeServer()
},
```

### 3. Meaningful Connection Status Dot

The `ConnectionStatus` dot must distinguish between:

| State | Dot Colour | Tooltip | When |
|---|---|---|---|
| `idle` | Grey (translucent) | "Not connected to a game" | Home page, no active session |
| `connected` | Green (solid) | "Connected · {n} peer(s)" | In a room with active P2P links |
| `reconnecting` | Orange (pulse) | "Reconnecting… attempting {n}/{6}" | Stale pongs, retry in progress |
| `disconnected` | Red (solid) | "Connection lost · click for details" | All pongs lost, retries exhausted |
| `server-down` | Red with `!` | "Signalling server unreachable" | Home page when `serverReachable === false` |

**No layout shifts.** The dot stays at its current fixed/absolute position (top-left, z-index 9999). Size remains 10–12px. Only the colour, tooltip, and optional inner indicator change.

**Grey idle state.** Currently the dot defaults to `disconnected` on the home page, which looks like an error. Change the initial `connectionStatus` in `usePeerStore` from `'disconnected'` to a new state `'idle'`:

```typescript
export type ConnectionStatus = 'idle' | 'connected' | 'reconnecting' | 'disconnected'
```

- `idle` = no peer exists, user is on the home page — not an error condition
- `disconnected` = peer exists but all connections failed — genuine error

**Clickable tooltip.** On click (or tap on mobile), show a small popover or an MUI `Alert` with:
- Current status description
- Number of active peer connections (when connected)
- "Retry" action button (when reconnecting or disconnected)
- "Troubleshoot" link (opens a small card with: "Try refreshing the page. If the issue persists, the server may be under maintenance.")

**In-corner status icon refinement.** For `server-down` state, overlay a small `!` icon inside (or next to) the dot — a 4px white exclamation on red circle. This is the *only* case where the dot has inner content. For all other states, the dot stays a plain circle.

### 4. Consistent State Terminology

The user sees two separate "connection" concepts. Make them distinct:

| Term | What it means | Where it's shown |
|---|---|---|
| "Server" | The PeerJS signalling server | Home page banner, dot tooltip when idle |
| "Mesh" / "Peers" | P2P connections to other players | In-game dot tooltip, lobby |
| "Game" | Your session in a room | SessionRestore dialog |

Update locale keys:

| Existing | New (if needed) | Notes |
|---|---|---|
| `connection.connected` | — | Keep, used by dot tooltip |
| `connection.reconnecting` | — | Keep |
| `connection.disconnected` | — | Keep, now only shown for genuine disconnect |
| `connection.probing` | — | Keep |
| `connection.unreachable` | — | Keep |
| `connection.retry` | — | Keep |
| `connection.reconnected` | — | Keep |
| — | `connection.idle` | New: "Not connected to a game" |
| — | `connection.serverDown` | New: "Server unreachable" (for dot tooltip) |
| — | `connection.peerCount` | New: "{count} peer(s)" |

### 5. UX Refinements (No Layout Shifts)

**Dot behaves differently per page:**

| Page | Dot shows | Interaction |
|---|---|---|
| Home (`/`) | `idle` (grey) or `server-down` (red+`!`) | Tooltip: status + suggestion |
| Lobby (`/room/:id`) | `connected` / `reconnecting` / `disconnected` | Tooltip: peer count + "click for details" popover |
| Game (`/game/:id`) | `connected` / `reconnecting` / `disconnected` | Tooltip: peer count + "click for details" popover |
| History (`/history`) | `idle` (grey) | Tooltip: "Not connected to a game" |

- The dot never animates or changes position — no layout shift.
- The colour on mobile is 10px, desktop 12px — unchanged.
- On `idle`, the grey colour uses a translucent tone (e.g., `rgba(158, 158, 158, 0.5)`) so it's visibly different from `disconnected` red.

**Notification snackbar for connection changes.**

Currently, connection state changes are silent (except the dot). Add a one-time snackbar via `useNotificationStore` when:

| Transition | Snackbar |
|---|---|
| `connected` → `reconnecting` | "Connection unstable — attempting to reconnect…" (warning, auto-dismiss 5s) |
| `reconnecting` → `connected` | "Connection restored." (success, auto-dismiss 3s) |
| `reconnecting` → `disconnected` | "Connection lost." (error, persistent until dismissed) |

- Only fire when the user is in a lobby or game (not on home page, where the dot alone is sufficient).
- Throttle to avoid spam: if a transition fires, no new snackbar from connection changes for 10 seconds.

**Home page "Retry" button improvement.**

Replace the current inline "Retry" button on the `serverReachable === false` alert with a more prominent action:

- "Retry Connection" is a standard MUI `Button` (kept as-is).
- The tooltip on disabled "Create Room" / "Join Room" buttons now reads: *"Server unreachable. Retrying automatically…"* when an accelerated probe cycle is active.
- After 60 seconds of sustained unreachability, the tooltip changes to: *"Server has been unreachable for a while. Check your connection or try again later."*

## Changed Files

### server/
| File | Change |
|---|---|
| `server/index.js` | Add `/isim-sehir/health` endpoint (HTTP 200 + JSON status + CORS) |

### src/
| File | Change |
|---|---|
| `src/stores/usePeerStore.ts` | Add `'idle'` to `ConnectionStatus` type; fix `probeServer()` path & remove `no-cors`; add `retryProbe()` with backoff; add `probeRetryAttempt` field; add accelerated recovery probe |
| `src/components/common/ConnectionStatus.tsx` | Handle `'idle'` state (grey); handle `server-down` (red+`!`); richer tooltip with peer count & action; optional click-to-popover |
| `src/pages/HomePage.tsx` | Wire `retryProbe` to Retry button; update tooltip text for long-running unreachability |
| `src/context/PeerContext.tsx` | Throttled snackbar on connection state transitions (lobby/game only) |
| `src/types/index.ts` | Export new `ConnectionStatus` type or re-export from peer store |
| `src/locales/*.ts` | Add `connection.idle`, `connection.serverDown`, `connection.peerCount`, `connection.unstable`, `connection.unstableRestored` keys for all 6 languages |

## Technical Design

### Data Flow: Reliable Probe

```
HomePage mounts
  ↓
useEffect → probeServer()
  ↓
fetch(`/isim-sehir/health`) → 200 { status: "ok" }
  ↓
serverReachable = true → banner hidden, buttons enabled
  ↓
If probe fails:
  → serverReachable = false → banner shown, buttons disabled
  → accelerated probe every 10s × 3
  → then back to 30s interval
  → user clicks Retry → retryProbe() with backoff
```

### Data Flow: Dot States

```
Initial load (no peer):
  connectionStatus = 'idle' → grey dot → "Not connected to a game"

User creates/joins room:
  Peer created + connections established → 'connected' → green dot

Transient network issue (in-game):
  Pong missing >15s → 'reconnecting' → orange pulse → snackbar

Permanent loss (in-game):
  All 6 retries fail → 'disconnected' → red dot → snackbar

User navigates back to home:
  Peer destroyed → 'idle' → grey dot
```

### Health Endpoint Implementation Notes

- **uWS interop:** The `peer` package uses `uWebSockets.js` internally. We can access the underlying `App` via `peerServer._app` (or equivalent). If interop is fragile, **create a separate `http.Server` on the same port** by wrapping:

```javascript
import http from 'http'
import { PeerServer } from 'peer'

const server = http.createServer((req, res) => {
  if (req.url === '/isim-sehir/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }
  // Let PeerServer handle everything else
  // But this is tricky with uWS — PeerServer may not use the same http.Server
})

// Alternative: run health on a different port if interop is too complex
```

If full interop with PeerJS's server proves too complex, fall back to a separate health server on `HEALTH_PORT` (default: `PORT + 1`) and update the client `.env`/probe URL accordingly.

- **`no-cors` removal safety:** The health endpoint sets `Access-Control-Allow-Origin: *`, so the browser will accept the response. For production, lock this to the configured `ALLOWED_ORIGINS`.

- **Backward compatibility:** Older clients using `no-cors` on `GET /` will still work (they'll keep failing as before). The fix is on both sides: server (new endpoint) + client (new URL). The roll-forward is clean.

### Snackbar Throttling

In `PeerContext.tsx`, add state to throttle notifications:

```typescript
const lastConnectionSnackbarRef = useRef(0)

// In pingMonitor's state transition handler:
const now = Date.now()
if (now - lastConnectionSnackbarRef.current > 10000) {
  lastConnectionSnackbarRef.current = now
  useNotificationStore.getState().show(message, severity)
}
```

## Acceptance Criteria

- [ ] `GET /isim-sehir/health` returns `200 { "status": "ok", "uptime": <number> }` with CORS headers
- [ ] `probeServer()` targets the health endpoint and correctly resolves `serverReachable` based on `res.ok`
- [ ] `probeServer()` no longer uses `mode: 'no-cors'`
- [ ] Clicking "Retry" on the unreachable banner uses exponential backoff (0s, 2s, 5s, 10s)
- [ ] After a failed probe, accelerated re-probes fire every 10s for the first 3 attempts
- [ ] `ConnectionStatus` shows a **grey translucent dot** with tooltip "Not connected to a game" on the home page
- [ ] `ConnectionStatus` shows a **green dot** with tooltip "Connected · {n} peer(s)" in a room
- [ ] `ConnectionStatus` shows a **red dot with `!` icon** when `serverReachable === false` on the home page
- [ ] `ConnectionStatus` shows an **orange pulsing dot** during reconnection
- [ ] `ConnectionStatus` shows a **red solid dot** when P2P connection is genuinely lost
- [ ] The dot never changes position or size across all states (no layout shift)
- [ ] Connection state transitions in lobby/game fire a throttled snackbar (max 1 per 10s)
- [ ] All new locale keys are translated in 6 languages (tr, en, es, pt, fr, de)
- [ ] Existing functionality is unaffected — users in active games see no change in behaviour
- [ ] The bug "Retry keeps failing but refresh fixes it" is no longer reproducible
