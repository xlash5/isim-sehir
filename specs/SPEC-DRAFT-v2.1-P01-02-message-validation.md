# İsim Şehir — v2.1 Security: PeerJS Message Schema Validation

> **Priority:** High
> **Version target:** v2.1
> **Status:** 📝 Draft

## Overview

Currently every incoming `PeerMessage` is cast with `as` and processed directly. A malicious or misbehaving peer could send malformed payloads that cause crashes or undefined behaviour. This spec adds a validation layer that checks every message before dispatch.

## Requirements

1. **Validation function** — `validateMessage(data: unknown): PeerMessage | null` in a new file `src/utils/messageValidator.ts`.
2. **Per-type payload schema** — each `PeerMessageType` has a defined shape that must match:
   - `join-room` → `{ id: string, nickname: string }`, nickname ≤ 20 chars, alphanumeric + spaces only
   - `chat-message` → `{ playerId: string, nickname: string, text: string, timestamp: number }`, text ≤ 500 chars
   - `answers-submit` → `{ answers: { playerId, category, value }[] }`, max 35 items per payload
   - `vote` → `{ voterId: string, answerId: string, isValid: boolean }`
   - etc.
3. **Integration point** — call `validateMessage` at the top of `handleMessage` in `PeerContext.tsx:70`; discard and warn on invalid.
4. **Graceful rejection** — invalid messages are silently dropped (console.warn in dev only).
5. **Type narrowing** — after validation, payloads are typed correctly (not `unknown`).

## Files to Create / Modify

- **New:** `src/utils/messageValidator.ts`
- **Modify:** `src/context/PeerContext.tsx` — integrate validator in `handleMessage`
- **Modify:** `src/types/index.ts` — export per-payload interfaces for reuse

## Acceptance Criteria

- [ ] Valid messages pass through unchanged
- [ ] Malformed messages (wrong types, missing fields, oversized strings) are dropped
- [ ] No runtime errors from message validation
- [ ] Console warning in dev for each dropped message
