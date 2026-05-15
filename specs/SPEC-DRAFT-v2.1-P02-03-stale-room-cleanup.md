# İsim Şehir — v2.1 Stale Room Cleanup (Server-Side)

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** 📝 Draft

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

PeerJS Server does not expose a built-in peer enumeration API. Use the `allow_discovery: true` mechanism or maintain a local `Map<peerId, { createdAt, connectionCount }>` via the `connection` and `disconnect` events on the `PeerServer` instance.

```js
const peers = new Map()

peerServer.on('connection', (client) => {
  peers.set(client.getId(), { createdAt: Date.now(), connections: 0 })
})

peerServer.on('disconnect', (client) => {
  const entry = peers.get(client.getId())
  if (entry) entry.connections = Math.max(0, entry.connections - 1)
})
```

## Files to Modify

- `server/index.js` — add peer tracking and cleanup interval

## Acceptance Criteria

- [ ] Rooms with zero connections for >5 minutes are destroyed
- [ ] Active rooms (with ≥1 connection) are never destroyed
- [ ] Room codes are freed for reuse after destruction
- [ ] Server logs cleanup actions
