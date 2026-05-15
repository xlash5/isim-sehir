# İsim Şehir — v2.1 Security: Rate Limiting on Peer Messages

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

A fast-spamming peer could flood the mesh with `chat-message`, `vote`, or rapid `player-ready` toggles. This spec introduces per-sender rate limiting inside `PeerContext` to cap message frequency.

## Requirements

1. **Per-peer counters** — maintain a `Map<string, { lastTimestamps: number[], violations: number }>` (keyed by connection ID).
2. **Limits per message type:**
   - `chat-message`: max 5 per 10 seconds
   - `vote`: max 15 per 10 seconds (one per answer per round)
   - `player-ready`: max 3 per 5 seconds
   - `settings-update`: max 2 per 5 seconds
   - All others: max 20 per 10 seconds
3. **Action on violation:**
   - 1st–3rd violation: drop the message, console.warn
   - 4th+ violation within 60 seconds: drop all messages from that peer for 30 seconds (soft mute)
4. **No UI indicator** for muted peers (avoids leaking info to other clients).
5. **Admin immunity** — admin's messages are never rate-limited.

## Files to Create / Modify

- **New:** `src/utils/rateLimiter.ts` — reusable rate limiter class/function
- **Modify:** `src/context/PeerContext.tsx` — add rate limiter logic in `handleMessage`

## Acceptance Criteria

- [x] Normal chat flow (1 msg / 5 sec) is never blocked
- [x] Rapid-fire messages beyond limits are silently dropped
- [x] Persistently abusive peers are muted after 3 violations
- [x] Admin actions are never rate-limited
