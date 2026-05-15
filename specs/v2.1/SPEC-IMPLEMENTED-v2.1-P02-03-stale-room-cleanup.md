# İsim Şehir — v2.1 Stale Room Cleanup (Server-Side)

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

When all players leave a room or the admin disconnects without transferring, the room ID remains allocated on the PeerJS server. This spec adds a periodic cleanup that destroys stale peer IDs (room codes) that have been inactive for a configurable period.

## Requirements

1. **Cleanup interval** — every 60 seconds, iterate over all known peer IDs on the server.
2. **Stale detection** — a peer is stale if it has zero active data connections and has existed for more than 5 minutes (configurable via `ROOM_TTL_MINUTES` env var).
3. **Destruction** — call `peer.destroy()` on stale peers to free the room code for reuse.
4. **Logging** — log each destroyed stale room with its age.
5. **Safety** — do not destroy peers with active data connections under any circumstances.
6. **Admin disconnection edge case** — if admin disconnects but other peers remain, the new admin adopts the room code (handled by existing `isAdoptingPeerRef` logic); the server should see the new connection and not clean up.

## Implementation Approach

A local `Map<peerId, { createdAt, connectionCount }>` is maintained via the `connection` and `disconnect` events on the `PeerServer` instance. A 60-second `setInterval` iterates the map and destroys entries with `connectionCount === 0` and age ≥ `ROOM_TTL_MINUTES` (default 5). The existing `roomMembers`/`peerToRoom` maps handle room code cleanup on disconnect, so the stale peer removal primarily frees tracking state and logs.

```js
const peers = new Map()

peerServer.on('connection', (client) => {
  const peerId = client.getId()
  const existing = peers.get(peerId)
  if (existing) {
    existing.connectionCount++
  } else {
    peers.set(peerId, { createdAt: Date.now(), connectionCount: 1 })
  }
})

peerServer.on('disconnect', (client) => {
  const entry = peers.get(client.getId())
  if (entry) entry.connectionCount = Math.max(0, entry.connectionCount - 1)
})
```

## Files Modified

- `server/index.js` — added peer tracking, cleanup interval, `ROOM_TTL_MINUTES` env var

## Acceptance Criteria

- [x] Rooms with zero connections for >5 minutes are destroyed
- [x] Active rooms (with ≥1 connection) are never destroyed
- [x] Room codes are freed for reuse after destruction
- [x] Server logs cleanup actions
