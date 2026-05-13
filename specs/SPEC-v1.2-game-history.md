# İsim Şehir — v1.2 Game History & Statistics

> **Priority:** Low — enhancement feature
> **Version target:** v1.2
> **Status:** 🔴 Not implemented

## Overview

Save completed game results to `localStorage` so players can review past game sessions, including final scores, round details, and personal performance statistics.

## Requirements

1. **Auto-save:** after each game completes (game-over phase), save a summary to `localStorage`.
2. **History page:** accessible from the Home screen via a "Geçmiş" (History) button.
3. **Per-game data:** date/time, room code, player count, rounds played, final rankings.
4. **Personal stats:** total games played, total wins, average score, favourite category.
5. **Limit:** keep last 50 games, oldest entries removed automatically.
6. **Clear:** option to clear all history.
7. **Privacy:** history is local to each device — not shared or synced.

## Technical Design

### Data Structure

```ts
interface GameHistoryEntry {
  id: string
  date: string          // ISO date
  roomCode: string
  playerCount: number
  totalRounds: number
  yourNickname: string
  yourRank: number      // 1-based
  yourScore: number
  players: { nickname: string; rank: number; score: number }[]
  rounds: { round: number; letter: string; yourAnswers: { category: string; value: string; points: number }[] }[]
}

interface GameHistoryStore {
  games: GameHistoryEntry[]
}
```

### Storage

- Key: `isim-sehir-history`
- Format: JSON array of `GameHistoryEntry`
- Max 50 entries; when adding a 51st, remove the oldest.

### UI

**History Page** (`/history` or modal on home screen):

- List of past games (date, room code, rank, score).
- Click to expand and view round-by-round details.
- "Temizle" (Clear All) button with confirmation dialog.

**Home Screen:**

- Small "Geçmiş" text button or icon below the main action buttons.

### New Components

- `src/pages/HistoryPage.tsx` — full page for game history
- Or a modal component: `HistoryModal.tsx` — overlay on HomePage

### State Changes

Add a new store or utility:

```ts
// src/utils/history.ts
function saveGameToHistory(entry: GameHistoryEntry): void
function getGameHistory(): GameHistoryEntry[]
function clearGameHistory(): void
```

Called from `GamePage.tsx` when game-over phase is reached and "Tekrar Oyna" or "Lobiye Dön" is clicked.

## Acceptance Criteria

- [ ] Completed games are saved to localStorage automatically
- [ ] History is viewable from the Home screen
- [ ] Round-by-round details are accessible
- [ ] Max 50 entries, oldest auto-removed
- [ ] Clear all history works with confirmation
- [ ] Data survives page refresh (localStorage)
