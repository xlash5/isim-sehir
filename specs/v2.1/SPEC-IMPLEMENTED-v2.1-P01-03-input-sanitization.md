# İsim Şehir — v2.1 Security: Input Sanitisation (XSS Prevention)

> **Priority:** High
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

User-supplied strings (nicknames, chat messages, custom category names) are rendered via MUI components which escape by default, but adding a dedicated sanitisation layer provides defence-in-depth and prevents issues if rendering paths change.

## Requirements

1. **Sanitisation function** — `sanitizeString(input: string, maxLength: number): string` in `src/utils/sanitize.ts`.
2. **Rules:**
   - Strip HTML tags (`<script>`, `</div>`, etc.)
   - Strip event handlers (`onclick=`, `onerror=`, etc.)
   - Strip `javascript:` and `data:` URI schemes
   - Trim whitespace
   - Truncate to `maxLength`
3. **Where to apply:**
   - `HomePage.tsx` — nickname before `setLocalPlayer` (max 20)
   - `ChatBox.tsx` — message text before send (max 500)
   - `GameSettingsPanel.tsx` — custom category name before add (max 30)
4. **Double encoding prevention** — apply *after* the user types, right before the value enters the store or is broadcast.
5. **No change to display** — MUI already escapes; this is an input-layer guard.

## Files to Create / Modify

- **New:** `src/utils/sanitize.ts`
- **Modify:** `src/pages/HomePage.tsx` — sanitize on create/join
- **Modify:** `src/components/common/ChatBox.tsx` — sanitize before send
- **Modify:** `src/components/Lobby/GameSettingsPanel.tsx` — sanitize custom category input
- **Modify:** `src/context/PeerContext.tsx` — sanitize nickname in `join-room` handler

## Acceptance Criteria

- [x] Input containing `<script>alert(1)</script>` is stripped to `alert(1)` or empty
- [x] Long inputs are truncated to max length
- [x] Normal inputs pass through unchanged
- [x] Existing behaviour (emoji, special chars like `ğ ü ş ı`) preserved
