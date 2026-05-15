# İsim Şehir — v2.0 Room Code Generation

> **Priority:** Medium
> **Version target:** v2.0
> **Status:** ✅ Implemented

## Overview

6-digit numeric room codes are occasionally hard to read and type. Switch to a shorter alphanumeric format that is easier to communicate and enter.

## Requirements

1. Switch to a **4-character alphanumeric** code (uppercase letters + digits, excluding confusable characters: 0/O, 1/I/L, 5/S).
2. Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (30 chars).
3. Collision probability sufficiently low (~30^4 = 810,000 combinations).
4. Existing rooms using 6-digit codes remain valid during the transition (backward compatibility).

## Technical Design

- Update `generateRoomCode()` in `src/utils/letters.ts` to pick 4 random chars from the new set.
- Update `HomePage.tsx` to accept both 6-digit numeric and 4-char alphanumeric codes on join.
- The join-code validation regex should match `/^[A-Z0-9]{4,6}$/` to support both formats.
- Room codes stored in session/localStorage are strings — no type changes needed.

## Acceptance Criteria

- [x] `generateRoomCode()` returns 4 chars from the allowed set only
- [x] Joining with a 6-digit legacy code still works
- [x] Joining with a 4-char alphanumeric code works
- [x] Room code display (CopyCode, lobby header) works with both formats
