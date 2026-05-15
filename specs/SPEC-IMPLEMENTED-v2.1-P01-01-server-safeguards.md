# İsim Şehir — v2.1 Security: Server-Side Connection Safeguards

> **Priority:** High
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

The PeerJS server (`server/index.js`) allows unlimited discovery and any number of connections. This spec adds rate limiting, connection caps, and IP-based throttling at the signalling-server layer.

## Requirements

1. **CORS/Origin restriction** — configure PeerJS server to accept connections only from the known frontend origin(s).
2. **Max peers per room** — hard cap of 8 peers per room ID (configurable via `MAX_PEERS_PER_ROOM` env var).
3. **IP-level rate limiting** — max 5 connection attempts per second per IP (configurable via `MAX_CONNECTIONS_PER_SEC` env var).
4. **Connection timeouts** — destroy peers that have not established a data connection within 30 seconds of signalling.
5. **Logging** — log all rejected connections with reason (origin mismatch, rate limit, room full).
6. **Key rotation consideration** — document that PeerJS server uses the default `allow_discovery: true` which exposes room IDs; move to a key-based approach if feasible.

## Files to Modify

- `server/index.js` — add configuration, CORS, rate limiting, peer caps
- `server/package.json` — may need `express` or a rate-limit middleware (e.g. `express-rate-limit`)

Note: `peer` (PeerJS Server 1.x) has limited built-in middleware support. If the above cannot be achieved via configuration, wrap the PeerServer in an Express app with middleware:

```js
import express from 'express'
import { ExpressPeerServer } from 'peer'
import rateLimit from 'express-rate-limit'

const app = express()
app.use('/isim-sehir', rateLimit({ windowMs: 1000, max: 5 }))
// ...
```

## Acceptance Criteria

- [x] Connections from unknown origins are rejected (via `corsOptions.origin`)
- [x] More than 8 peers trying to join the same room are blocked after 8 (OFFER-intercept, `MAX_PEERS_PER_ROOM`)
- [x] More than 5 connection attempts / sec from the same IP are throttled (`ipTimestamps` tracker)
- [x] Unused signalling peers are cleaned up after 30s (via `expire_timeout`)
- [x] Server logs show clear rejection reasons (`[REJECT]` prefix with reason and detail)
