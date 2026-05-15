# İsim Şehir — v3.0 TypeScript Migration (Signalling Server)

> **Priority:** P02 — improves server maintainability and catches config/env bugs early
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The signalling server at `server/index.js` is plain JavaScript. It handles peer connections, room management, IP rate limiting, and stale cleanup — all without type safety. This spec migrates it to TypeScript, adds proper types for the `peer` library's API surface, and introduces structured error handling.

## Requirements

### 1. TypeScript Setup

- Add `tsconfig.json` to `server/` with strict mode.
- Use `tsx` (or `ts-node`) for development — run directly without a build step.
- Add a `build` script that compiles to `server/dist/`.
- The `start` script in `package.json` runs the compiled JS (production) or `tsx` (dev).

### 2. Type Definitions

Create proper interfaces for:

| Concept | Interface |
|---|---|
| Peer tracking | `PeerEntry { createdAt: number; connectionCount: number }` |
| Room membership | `RoomCode = string; PeerId = string` — use branded types or type aliases |
| IP rate limiting | `IpTimestamps = Map<string, number[]>` |
| Server configuration | `ServerConfig` — typed env vars with defaults |
| Client metadata | `ClientInfo { peerId: string; ip: string; roomCode?: string }` |
| PeerJS `client` object | Minimal interface matching the methods used (`getId`, `getSocket`) |
| PeerJS `socket` object | Minimal interface for `_socket.remoteAddress`, `_socket.remoteFamily` |

### 3. Structured Logging

Replace `console.log` / `console.error` with a typed logger:

```ts
interface LogEntry {
  level: 'INFO' | 'WARN' | 'ERROR'
  event: string  // e.g. 'CONNECT', 'DISCONNECT', 'ROOM_JOIN', 'REJECT'
  detail?: Record<string, unknown>
  timestamp: string
}
```

- A simple `logger.ts` utility that formats entries as `[LEVEL] [EVENT] ...` (backward-compatible with existing log parsing).
- No external logging library — keep it zero-dependency.

### 4. Environment Variable Validation

At startup, validate all environment variables with descriptive errors:

```ts
const config: ServerConfig = {
  port: requireNumericEnv('PORT', 9000),
  maxPeersPerRoom: requireNumericEnv('MAX_PEERS_PER_ROOM', 8),
  // ...
}
```

If validation fails, log a clear message and exit with code 1:

```
[ERROR] Invalid environment variable: MAX_PEERS_PER_ROOM must be a positive integer, got "abc"
```

### 5. No Runtime Behaviour Changes

The migration must be strictly additive in terms of type safety. All runtime behaviour must remain identical:
- Same PeerJS server options
- Same rate limiting algorithm
- Same room management logic
- Same environment variable names and defaults

## Technical Design

### Directory Structure After Migration

```
server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Entry point — creates PeerServer
│   ├── config.ts          # Typed env var parsing + validation
│   ├── logger.ts          # Structured logging utility
│   ├── rateLimiter.ts     # IP-level rate limiter (now typed)
│   ├── roomManager.ts     # Room membership tracking (extracted from index.js)
│   ├── peerTracker.ts     # Peer lifecycle tracking
│   └── types.ts           # All interfaces and type aliases
├── dist/                  # Compiled output (gitignored)
└── node_modules/
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### package.json Changes

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

### Key Types

```ts
// types.ts
export interface ServerConfig {
  port: number
  maxPeersPerRoom: number
  maxConnectionsPerSec: number
  connectionTimeoutMs: number
  roomTtlMinutes: number
  allowedOrigins: string[]
}

export interface PeerEntry {
  createdAt: number
  connectionCount: number
}

export interface SocketInfo {
  remoteAddress?: string
  remoteFamily?: string
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR'
export type LogEvent =
  | 'CONNECT' | 'DISCONNECT' | 'ROOM_JOIN' | 'ROOM_LEAVE'
  | 'ROOM_EMPTY' | 'REJECT' | 'CLEANUP' | 'ERROR' | 'STARTUP'
```

### Migration Approach

1. Rename `index.js` → `src/index.ts`
2. Fix all TypeScript errors (add types, casts where needed for the `peer` library's untyped API)
3. Extract config, logger, rate limiter, room manager, peer tracker into separate files
4. Verify with `tsc --noEmit` that everything compiles
5. Run the server and test a full game flow

## Files to Create

- `server/tsconfig.json`
- `server/src/types.ts`
- `server/src/config.ts`
- `server/src/logger.ts`
- `server/src/rateLimiter.ts`
- `server/src/roomManager.ts`
- `server/src/peerTracker.ts`

## Files to Modify

- `server/package.json` — add devDeps, scripts
- `server/src/index.ts` (from `server/index.js`)
- `server/.gitignore` — add `dist/`

## Dependencies to Add

| Package | Type | Purpose |
|---|---|---|
| `typescript` ^5 | devDep | TypeScript compiler |
| `tsx` ^4 | devDep | TypeScript execution for dev |

## Acceptance Criteria

- [ ] `npm run build` in `server/` compiles successfully with `strict: true`
- [ ] `npm start` runs compiled JS and starts signalling server
- [ ] `npm run dev` runs via `tsx` with watch mode
- [ ] All existing environment variables are validated with clear error messages
- [ ] Zero runtime behaviour changes (full game playtest passes)
- [ ] Structured logger produces backward-compatible log output format
- [ ] `noUncheckedIndexedAccess` catches potential null/undefined at compile time
