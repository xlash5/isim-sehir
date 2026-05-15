# İsim Şehir — v1.2 Game History

> **Priority:** Low — enhancement feature
> **Version target:** v1.2
> **Status:** ✅ Implemented

## Overview

Save completed game results to `localStorage` so players can review past game sessions, including final scores, round details, and personal performance statistics.

## Requirements

1. **Auto-save:** after each game completes (game-over phase), save a summary to `localStorage`.
2. **History page:** accessible from the Home screen via a "Geçmiş" (History) button.
3. **Per-game data:** date/time, room code, player count, rounds played, final rankings.
4. ~~**Personal stats:** total games played, total wins, average score, favourite category.~~ *(Deferred — not in scope of initial implementation)*
5. **Limit:** keep last 50 games, oldest entries removed automatically.
6. **Clear:** option to clear all history.
7. **Privacy:** history is local to each device — not shared or synced.

## Actual Implementation

### Data Structure (`src/types/index.ts`)

```ts
interface HistoryAnswer {
  category: string
  value: string
  points: number
}

interface HistoryPlayer {
  nickname: string
  rank: number
  score: number
}

interface HistoryRound {
  round: number
  letter: string
  yourAnswers: HistoryAnswer[]
}

interface GameHistoryEntry {
  id: string
  date: string          // ISO date
  roomCode: string
  playerCount: number
  totalRounds: number
  yourNickname: string
  yourRank: number      // 1-based
  yourScore: number
  players: HistoryPlayer[]
  rounds: HistoryRound[]
}
```

The inline types from the original spec were extracted into named interfaces to improve readability and match project conventions.

### Storage (`src/utils/history.ts`)

- Key: `isim-sehir-history`
- Format: JSON array of `GameHistoryEntry`
- Max **50** entries; oldest shifted when adding a 51st
- Pattern follows `session.ts` — `try/catch` wrapping, JSON serialize/parse
- Three exports: `saveGameToHistory`, `getGameHistory`, `clearGameHistory`

### Points Calculation

Per-answer points are computed inside `history.ts` using the same logic as `scoring.ts`:

1. Normalize answer (Turkish lowercase, strip non-alphanumeric)
2. Filter votes for that answer (`answerId = playerId-category`)
3. Accept if `validVotes > invalidVotes`
4. If accepted: **10 pts** (unique normalized answer), **5 pts** (shared), **0 pts** (rejected or empty)

This duplicates the scoring logic rather than depending on it, keeping the utility self-contained.

### Save Trigger

History is saved in `GamePage.tsx` at the start of both:
- `handlePlayAgain` — before `resetGame()` + broadcast + navigate
- `handleBackToLobby` — before `clearSession()` + `resetGame()` + navigate

Saving before `resetGame()` is essential since that action wipes the room state.

### UI (`src/pages/HistoryPage.tsx`)

**Route:** `/history` (added in `App.tsx`)

**Page layout:**
- Back arrow (navigates to `/`) + "Oyun Geçmişi" title
- "Temizle" button (top-right, red, with confirmation `Dialog`)
- Empty state: "Henüz oyun geçmişi yok" when no games exist
- Game list: newest-first, each entry is a `Paper` card with:
  - Primary text: "14 May 2026, 14:30 — 4 oyuncu, 3 tur"
  - Secondary text: "1. — 85 puan"
  - Rank chip (`#1` with secondary color for winner)
  - Expand/collapse icon

**Expanded view:**
- Full final standings (all players with scores)
- Round-by-round breakdown showing each category answer + points for the local player

**Confirmation dialog:**
- Shows count of games to be deleted
- "İptal" / "Temizle" buttons

### Home Screen Button (`src/pages/HomePage.tsx`)

- Small text button with `HistoryIcon` below the login `Paper`
- `onClick` navigates to `/history`
- Styled with `text.secondary` color, `textTransform: 'none'`

### Locale Keys Added

Added to both `tr.ts` and `en.ts`:

| Key | Turkish | English |
|---|---|---|
| `history.title` | Oyun Geçmişi | Game History |
| `history.noGames` | Henüz oyun geçmişi yok. | No game history yet. |
| `history.clearAll` | Temizle | Clear All |
| `history.clearConfirm` | Tüm geçmiş silinsin mi? | Delete all history? |
| `history.played` | `{date} — {count} oyuncu, {rounds} tur` | `{date} — {count} players, {rounds} rounds` |
| `history.rank` | `{rank}. — {score} puan` | `{rank}th — {score} pts` |
| `history.round` | `Tur {n} — Harf: {letter}` | `Round {n} — Letter: {letter}` |
| `history.back` | Geri | Back |
| `history.clearSuccess` | Oyun geçmişi temizlendi. | Game history cleared. |
| `history.cleared` | Geçmiş | History |

### Files Changed

| File | Action |
|---|---|
| `src/utils/history.ts` | **Created** — history storage utility |
| `src/pages/HistoryPage.tsx` | **Created** — history page component |
| `src/types/index.ts` | **Edited** — added `GameHistoryEntry` + sub-types |
| `src/App.tsx` | **Edited** — added `/history` route |
| `src/pages/HomePage.tsx` | **Edited** — added "Geçmiş" button |
| `src/pages/GamePage.tsx` | **Edited** — save history before game-end actions |
| `src/locales/tr.ts` | **Edited** — 10 Turkish keys |
| `src/locales/en.ts` | **Edited** — 10 English keys |
| `specs/MASTER-CONTEXT.md` | **Edited** — directory listing, routes, types, spec ref |

## Rejected Alternatives

- **Modal overlay** (`HistoryModal.tsx`): rejected in favour of a dedicated route for better UX and future extensibility.
- **Separate Zustand store**: rejected — no reactive state needed; localStorage is the single source of truth.
- **Save only on "Play Again"**: rejected — game should also be saved when user chooses "Lobiye Dön".

## Acceptance Criteria

- [x] Completed games are saved to localStorage automatically
- [x] History is viewable from the Home screen
- [x] Round-by-round details are accessible
- [x] Max 50 entries, oldest auto-removed
- [x] Clear all history works with confirmation
- [x] Data survives page refresh (localStorage)
