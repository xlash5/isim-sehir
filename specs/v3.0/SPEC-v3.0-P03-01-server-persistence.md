# İsim Şehir — v3.0 Server-Side Persistence (Game History)

> **Priority:** P03 — valuable enhancement but not critical for game functionality
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

Game history is currently stored only in `localStorage` — it is per-device, easily lost, and cannot be shared. There is no leaderboard, no cross-device history, and no way to look up past games. This spec adds a lightweight server-side persistence layer to the signalling server that stores completed game results, enabling shared history and optional leaderboards.

## Requirements

### 1. Storage Layer

- **Engine:** SQLite via `better-sqlite3` (zero-config, no external process, synchronous API fits the simple workload)
- **Database location:** `data/games.db` (gitignored, created on first run)
- **Schema:**

```sql
CREATE TABLE games (
  id            TEXT PRIMARY KEY,          -- UUID
  room_code     TEXT NOT NULL,
  admin_nickname TEXT NOT NULL,
  player_count  INTEGER NOT NULL,
  total_rounds  INTEGER NOT NULL,
  settings_json TEXT NOT NULL,             -- JSON blob of GameSettings
  started_at    TEXT NOT NULL,             -- ISO 8601
  finished_at   TEXT NOT NULL,             -- ISO 8601
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE players (
  id            TEXT NOT NULL,
  game_id       TEXT NOT NULL REFERENCES games(id),
  nickname      TEXT NOT NULL,
  score         INTEGER NOT NULL,
  rank          INTEGER NOT NULL,
  is_spectator  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, game_id)
);

CREATE TABLE rounds (
  game_id       TEXT NOT NULL REFERENCES games(id),
  round_number  INTEGER NOT NULL,
  letter        TEXT NOT NULL,
  PRIMARY KEY (game_id, round_number)
);

CREATE TABLE answers (
  id            TEXT PRIMARY KEY,
  game_id       TEXT NOT NULL REFERENCES games(id),
  round_number  INTEGER NOT NULL,
  player_id     TEXT NOT NULL,
  category      TEXT NOT NULL,
  value         TEXT NOT NULL,             -- empty string if blank
  is_valid      INTEGER,                  -- NULL if not voted, 0/1 otherwise
  points        INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (game_id, round_number) REFERENCES rounds(game_id, round_number)
);
```

### 2. API Endpoints

Add an HTTP server alongside PeerJS (or reuse the PeerJS port for a health/API endpoint using a separate path):

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/games` | Save a completed game (sent by admin on game-over) |
| `GET` | `/api/games?limit=20&offset=0` | List recent completed games |
| `GET` | `/api/games/:id` | Get full game detail (all rounds, answers, scores) |
| `GET` | `/api/leaderboard?limit=10` | Top players by total wins (optional) |

### 3. Frontend Changes

- **History page enhancement:** The existing `/history` page (localStorage) gains a "Sunucu Geçmişi" (Server History) tab that fetches from the API.
- **Game-over screen:** After game-over, admin sees a "Oyunu Kaydet" (Save Game) button. On click, the admin sends the full game state to `POST /api/games`. If the user is not admin, the button is disabled with a tooltip.
- **Leaderboard component** (optional): A new page or section showing top players.

### 4. Privacy & Consent

- Only games where the admin explicitly clicks "Save" are stored.
- Player nicknames are stored as-is (they are already public within the game).
- No chat messages, no IP addresses stored.
- A note appears on the history page: *"Yalnızca admin tarafından kaydedilen oyunlar görüntülenir."*

### 5. Data Retention

- Games older than 30 days are automatically pruned (via `DELETE` on a daily `setInterval` in the server).
- Maximum 1000 games stored (prune oldest on insert if over limit).

## Technical Design

### Server Changes

The signalling server gains a lightweight HTTP server (using Node's built-in `http` module — no Express dependency):

```ts
// server/src/api.ts (if TS-migrated per P02-04) or server/api.js (if still JS)
import http from 'http'
import Database from 'better-sqlite3'

const db = new Database('data/games.db')
// Run migrations on startup
db.exec(SCHEMA_SQL)

const server = http.createServer((req, res) => {
  // Simple router based on method + URL
  if (req.method === 'POST' && req.url === '/api/games') {
    // Parse body, insert game + players + rounds + answers
  } else if (req.method === 'GET' && req.url?.startsWith('/api/games/')) {
    // Return game detail
  } else if (req.method === 'GET' && req.url === '/api/games') {
    // Return paginated list
  }
  // ...
})

server.listen(PORT + 1, () => {
  console.log(`API server listening on port ${PORT + 1}`)
})
```

The HTTP server listens on `PORT + 1` (e.g., `9001` if PeerJS is on `9000`).

### Message Protocol Extension

Add a new peer message type:

| Message | Direction | Payload | Purpose |
|---|---|---|---|
| `save-game` | Admin→All | `{ gameData }` | Admin triggers save; all peers receive confirmation |

### Frontend Changes

- In `GamePage.tsx`, when `phase === 'game-over'` and `isAdmin`, show a "Oyunu Kaydet" button.
- On click, send game data via `fetch('https://signalling-server-url/api/games', ...)`.
- The existing `HistoryPage.tsx` gets a tab switcher: "Yerel Geçmiş" / "Sunucu Geçmişi".
- Add environment variable `VITE_API_URL` (default: `http://localhost:9001`).

### Dependencies to Add

| Package | Where | Purpose |
|---|---|---|
| `better-sqlite3` | server | SQLite database |

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `DATA_DIR` | `./data` | Database file directory |
| `GAME_RETENTION_DAYS` | `30` | How long to keep games |
| `MAX_STORED_GAMES` | `1000` | Maximum number of stored games |

## Files to Create (Server)

- `server/src/api.js` (or `api.ts`) — HTTP API routes + DB logic
- `server/src/database.js` — DB initialisation, migrations, query helpers
- `server/data/.gitkeep` — ensure data directory exists

## Files to Create (Frontend)

- `src/pages/LeaderboardPage.tsx` (optional)
- `src/components/History/ServerHistoryTab.tsx`

## Files to Modify

- `server/src/index.js` — start API server alongside PeerJS
- `server/package.json` — add `better-sqlite3` dependency
- `src/pages/GamePage.tsx` — add save button on game-over
- `src/pages/HistoryPage.tsx` — add server history tab
- `src/App.tsx` — add route for leaderboard (optional)

## Acceptance Criteria

- [ ] Admin can save a completed game via "Oyunu Kaydet" button
- [ ] Saved game appears in server history tab on history page
- [ ] Clicking a saved game shows full detail (rounds, answers, per-category scores)
- [ ] Older than 30 days games are auto-pruned
- [ ] At most 1000 games stored
- [ ] Unsaveable game does not break the game (graceful error snackbar)
- [ ] Server restarts do not lose data
- [ ] All new strings are localised in 6 languages
