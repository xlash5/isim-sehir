# İsim Şehir — v3.0 Server Observability

> **Priority:** P03 — improves production operations but not user-facing
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The signalling server currently logs to `console.log`/`console.error` with no structured format, no health endpoint, no metrics, and no way to monitor production health beyond Render's built-in logs. This spec adds a health endpoint, structured logging (aligned with the TS migration from `P02-04`), and basic Prometheus metrics.

## Requirements

### 1. Health Endpoint

A `GET /health` endpoint on the signalling server that returns:

```json
{
  "status": "ok",
  "uptime": 123456,
  "version": "1.0.0",
  "peers": {
    "total": 12,
    "active": 10,
    "stale": 2
  },
  "rooms": {
    "total": 3,
    "full": 0,
    "expired_last_hour": 1
  },
  "rateLimits": {
    "currently_blocked_ips": 1,
    "total_rejects_today": 42
  },
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 104857600,
    "rss": 157286400
  }
}
```

- Returns `200 OK` when the server is accepting connections.
- Returns `503 Service Unavailable` if the PeerJS server has stopped or the database (if persistence is added) is unreachable.
- No authentication required (it's a health check, not sensitive data).
- Logs the health check request at DEBUG level only (no noise in production logs).

Used by:
- Render's health check pings
- CI/CD pipeline (post-deploy smoke test)
- Manual debugging

### 2. Structured Logging

Replace ad-hoc `console.log`/`console.error` with a structured logger (aligns with `SPEC-v3.0-P02-04-typescript-server.md`):

```ts
// Log format (JSON):
// {"level":"INFO","event":"CONNECT","detail":{"peerId":"abc123","ip":"1.2.3.4"},"timestamp":"2026-05-15T12:00:00.000Z"}

logger.info('CONNECT', { peerId, ip })
logger.warn('REJECT', { reason: 'ROOM_FULL', peerId, roomCode })
logger.error('PEERJS_ERROR', { message: err.message })
```

- In development: pretty-print to console with colours (via `NODE_ENV=development` or a `--pretty` flag).
- In production: JSON lines (compatible with log aggregators like Logtail, Papertrail, or Render's log viewer).
- Events are categorised (see `SPEC-v3.0-P02-04` for the full event list).

### 3. Prometheus Metrics (Optional)

A `GET /metrics` endpoint exposing Prometheus-formatted metrics:

```
# HELP isimsehir_connected_peers Current number of connected peers
# TYPE isimsehir_connected_peers gauge
isimsehir_connected_peers{status="active"} 10
isimsehir_connected_peers{status="stale"} 2

# HELP isimsehir_active_rooms Current number of rooms
# TYPE isimsehir_active_rooms gauge
isimsehir_active_rooms 3

# HELP isimsehir_connection_rejects_total Total connection rejections by reason
# TYPE isimsehir_connection_rejects_total counter
isimsehir_connection_rejects_total{reason="room_full"} 15
isimsehir_connection_rejects_total{reason="ip_rate_limit"} 42
isimsehir_connection_rejects_total{reason="multi_room"} 3

# HELP isimsehir_connections_per_second Current rate of connections
# TYPE isimsehir_connections_per_second gauge
isimsehir_connections_per_second 1.5
```

- Use `prom-client` (zero-dependency Prometheus client for Node.js).
- Metrics are in-memory (lost on restart — acceptable for a signalling server).
- If persistence is added later, metrics can be extended.

### 4. Render Health Check Configuration

- Add a `healthcheckPath` to `render.yaml` or configure in Render dashboard → `GET /health`.
- Initial delay: 10s (give the server time to start).
- Period: 30s.

### 5. Rate Limit Metrics Enhancement

The existing `ipTimestamps` map in the server already tracks IP-level connection timestamps. Enhance it to also track:
- `total_rejects_by_reason` — counter per reject reason
- `currently_blocked_ips` — number of IPs currently rate-limited

## Technical Design

### Implementation Approach

| Feature | Approach | Dependencies |
|---|---|---|
| Health endpoint | Add a second `http.createServer` or reuse the same port with path routing | None (Node built-in) |
| Structured logging | Small custom logger (~50 lines) | None |
| Prometheus metrics | `prom-client` library | `prom-client` |

### Health Check Server

If the server is migrated to TS (`P02-04`), the health endpoint is integrated into the same HTTP server used for the API (see `P03-01`). If not, a standalone minimal HTTP server:

```js
// server/health.js
import http from 'http'

export function startHealthServer(port, getStats) {
  http.createServer((req, res) => {
    if (req.url === '/health') {
      const stats = getStats()
      const status = stats.peers.active > 0 || stats.uptime < 30000 ? 200 : 503
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: status === 200 ? 'ok' : 'degraded', ...stats }))
    } else if (req.url === '/metrics') {
      // Prometheus metrics (if enabled)
    } else {
      res.writeHead(404)
      res.end()
    }
  }).listen(port)
}
```

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `HEALTH_PORT` | `9001` | Port for health/metrics HTTP server |
| `ENABLE_METRICS` | `false` | Enable Prometheus metrics endpoint |
| `LOG_FORMAT` | `pretty` (dev) / `json` (prod) | Log output format |

### Render Configuration (render.yaml)

```yaml
services:
  - type: web
    name: isim-sehir-server
    env: node
    healthCheckPath: /health
    envVars:
      - key: HEALTH_PORT
        value: "9001"
```

## Files to Create

- `server/src/logger.js` (or `.ts`) — structured logger
- `server/src/health.js` (or `.ts`) — health endpoint + stats collector
- `server/src/metrics.js` (or `.ts`) — Prometheus metrics (optional)
- `server/render.yaml` — Render configuration with health check

## Files to Modify

- `server/src/index.js` — integrate health server, replace console.log with logger
- `server/package.json` — add `prom-client` (optional)

## Dependencies to Add

| Package | Where | Purpose |
|---|---|---|
| `prom-client` ^15 | server | Prometheus metrics (optional — only if `ENABLE_METRICS=true`) |

## Acceptance Criteria

- [ ] `GET /health` returns 200 with server stats
- [ ] Logs are structured JSON in production, pretty-printed in development
- [ ] Render health check passes (server does not get restarted unnecessarily)
- [ ] Metrics endpoint returns valid Prometheus format (if enabled)
- [ ] No performance impact on normal operation
- [ ] All existing logging behaviour is preserved (messages still useful for debugging)
