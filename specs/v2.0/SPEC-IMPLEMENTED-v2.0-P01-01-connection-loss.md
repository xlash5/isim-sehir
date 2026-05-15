# İsim Şehir — v2.0 Connection Loss Handling

> **Priority:** High
> **Version target:** v2.0
> **Status:** ✅ Implemented

## Overview

Network interruptions during a game cause silent data loss. Players may be in inconsistent states without realising it. This spec adds a heartbeat/ping system, visual connection status, and auto-reconnect.

## Requirements

1. **Ping/pong system:** every 10 seconds, peers exchange a ping-pong message to verify the connection is alive.
2. **Visual indicator:** a connection status icon in the top bar (green = connected, yellow = reconnecting, red = disconnected).
3. **Auto-reconnect:** on temporary network loss, attempt to reconnect for up to 30 seconds before declaring the player disconnected.
4. **Graceful degradation:** if connection is lost during answering, allow the player to continue filling inputs locally. Answers are submitted once the connection is restored.
5. **Re-sync on reconnect:** when a player reconnects, the admin sends a full state sync so they catch up on any missed transitions.

## New Message Types

| Message | Description | Sender |
|---|---|---|
| `ping` | Connection health check | Anyone |
| `pong` | Response to ping | Anyone |

## Types to Add (`src/types/index.ts`)

```typescript
export type PeerMessageType =
  | ...existing...
  | 'ping'
  | 'pong'
```

Also add connection status tracking to `usePeerStore`:
```typescript
type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'
```

## Technical Design

### Ping/Pong
- Use `setInterval` in `PeerContext` to send `ping` every 10 seconds.
- Track `lastPongTimestamp` per connection (a `Map<string, number>` in a ref).
- If no pong within 15 seconds, consider the connection stale.
- On receiving a `ping`, immediately respond with a `pong`.

### Connection Status Indicator
- New component: `ConnectionStatus` — renders a `<Chip>` or `<Badge>` in the app bar.
- Reads from `usePeerStore`'s connection status.
- 🟢 `connected` — all pong timestamps recent
- 🟡 `reconnecting` — some connections stale, attempting reconnect
- 🔴 `disconnected` — all connections lost

### Auto-reconnect
- On detecting stale connections, set status to `reconnecting`.
- Attempt to reconnect every 5s up to 30s (6 attempts).
- Track attempts in a ref to avoid infinite loops.
- If all attempts fail, declare disconnected and clean up.

### Re-sync
- On successful reconnect, the reconnecting peer sends a `reconnect` message.
- Admin responds with `reconnect-accepted` including full `GameRoom` state.
- Already partially implemented in v1.x — extend to include connection status reset.

## Acceptance Criteria

- [x] Ping/pong messages are exchanged every 10s
- [x] Connection status indicator is visible and accurate
- [x] Temporary network interruptions do not cause data loss
- [x] Auto-reconnect restores the player to the correct game state
- [x] Re-sync on reconnect works for game phase, timer, and player list
