# İsim Şehir — Game Specification v1.0

> **Project language:** Turkish — all UI texts, categories, and in-game messages are in Turkish.

> **Scroll moved from root `SPEC.md` to `specs/SPEC-v1.0.md` for versioned spec management.**

## 1. Project Overview

**İsim Şehir** is a modern, multiplayer, peer-to-peer WebRTC version of the classic Turkish word game. Players create rooms, invite friends, write words for selected categories starting with a given letter, and grade each other's answers.

- **Platform:** Web (React SPA)
- **Multiplayer:** Peer-to-peer (WebRTC) via PeerJS
- **UI Library:** Material UI (MUI) v6
- **State Management:** Zustand v5
- **Routing:** React Router v7
- **Language:** Completely Turkish
- **Identity:** Anonymous / nickname-based

## 2. Architecture

### 2.1 Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend (SPA) | Vercel | `https://isim-sehir-phi.vercel.app` |
| PeerJS Signaling Server | Render (dashboard.render.com) | `https://isim-sehir-server.onrender.com` |

### 2.2 Environment Variables (Vercel)

| Variable | Value | Description |
|---|---|---|
| `VITE_PEER_HOST` | `isim-sehir-server.onrender.com` | PeerJS signaling server host |
| `VITE_PEER_PORT` | `443` | PeerJS signaling server port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS signaling server path |

### 2.3 PeerJS Signaling Server (`server/`)

Custom PeerJS server using the `peer` npm package:

```js
PeerServer({ port: PORT, path: '/isim-sehir', allow_discovery: true })
```

- Deployed on Render (Web Service)
- Production: port `443`, `wss://` (WebSocket Secure)
- Frontend configured via environment variables

### 2.4 Directory Structure

```
isim-sehir/
├── server/
│   ├── index.js          # PeerJS signaling server
│   └── package.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── CopyCode.tsx
│   │   │   ├── PlayerAvatar.tsx
│   │   │   └── Timer.tsx
│   │   ├── Game/
│   │   │   ├── SlotMachine.tsx
│   │   │   ├── AnswerTable.tsx
│   │   │   ├── GradingPanel.tsx
│   │   │   └── Scoreboard.tsx
│   │   └── Lobby/
│   │       ├── GameSettingsPanel.tsx
│   │       └── PlayerList.tsx
│   ├── context/
│   │   └── PeerContext.tsx
│   ├── hooks/
│   │   └── useGame.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── GamePage.tsx
│   ├── stores/
│   │   ├── useGameStore.ts
│   │   └── usePeerStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── categories.ts
│   │   ├── letters.ts
│   │   └── scoring.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   └── vite-env.d.ts
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── specs/
│   └── SPEC-v1.0.md
└── README.md
```

## 3. Game Flow

### 3.1 Home Screen (`/`)
- Enter nickname (max 20 chars, cannot be empty)
- "Oda Oluştur" → creates a Peer, redirects to `/room/:roomId`
- "Odaya Katıl" → enter 6-digit room code, redirects to `/room/:roomId`

### 3.2 Lobby (`/room/:roomId`)
- Player list with ready status
- Admin settings panel (categories, rounds, duration, letter pool)
- Room code display + copy button
- Chat box
- "Hazır" toggle button (admin sees "Oyuna Başla" when all ready)
- Settings disabled when admin is ready

### 3.3 Letter Wheel
- SlotMachine component with random letter selection animation
- 28 letters (A-Z, excluding Ğ, including İ)
- Admin broadcasts via `round-start` message

### 3.4 Answer Phase
- Input fields for each selected category
- Timer based on admin's duration setting
- "Cevapları Gönder" for early submission
- Auto-submit when timer expires
- Advances to grading phase once all players submit

### 3.5 Grading (Peer Grading)
- All answers grouped by category, displayed on a single page
- Other players vote 👍 Geçerli (Valid) / 👎 Geçersiz (Invalid) for each answer
- Voter list (who approved/disapproved) visible to everyone once all votes are in
- Votes can be changed freely until admin clicks "Sonuçları Göster"
- Non-admin players wait while admin finalizes

### 3.6 Round Results
- Scoreboard shown after each round
- Cumulative total + round-specific score displayed
- Only admin can click "Sonraki Tur" (Next Round)

### 3.7 Game Over
- Transitions to `game-over` phase after the final round
- Final ranking displayed (🥇🥈🥉)
- "Tekrar Oyna" (Play Again) and "Lobiye Dön" (Back to Lobby) buttons

## 4. Scoring System

| Condition | Points |
|---|---|
| Valid and unique answer | 10 |
| Valid but duplicate answer | 5 |
| Invalid / rejected by vote | 0 |
| Left blank | 0 |

Duplicate detection uses `normalizeAnswer()` (tr-TR lowercase, strip non-alphanumeric).

## 5. Peer-to-Peer (WebRTC)

- **Library:** PeerJS (`peerjs` npm)
- **Topology:** Mesh (ideal for 6-8 players)
- **Signaling:** Custom PeerJS server (`server/index.js`)

### Message Types

| Message | Description | Sender |
|---|---|---|
| `join-room` | Player joined the room | Joiner |
| `room-state-sync` | Full room state sync | Admin |
| `player-ready` | Player ready status | Anyone |
| `settings-update` | Game settings updated | Admin |
| `game-start` | Game started | Admin |
| `round-start` | New round, letter selected | Admin |
| `answers-submit` | Answers submitted | Anyone |
| `vote` | Player vote | Anyone |
| `round-end` | Round results | Admin |
| `chat-message` | Chat message | Anyone |
| `player-disconnected` | Player left | System |

## 6. Data Structures

```ts
type GamePhase = 'lobby' | 'wheel' | 'answering' | 'grading' | 'round-results' | 'game-over'

interface Player { id: string; nickname: string; isAdmin: boolean; isReady: boolean; score: number }

interface GameSettings {
  categories: string[]       // selected category names (2-10)
  totalRounds: number        // 1-15
  roundDuration: number|null // seconds, null=unlimited
  letterPool: string[]       // selected letters (excluding Ğ)
}

interface GameRoom {
  code: string; adminId: string; players: Player[]
  settings: GameSettings; phase: GamePhase
  currentRound: number; currentLetter: string|null
  pendingLetter: string|null; rounds: Round[]
}

interface Round { letter: string; answers: Answer[]; votes: Vote[] }

interface Answer { playerId: string; category: string; value: string }

interface Vote { voterId: string; answerId: string; isValid: boolean }

interface ChatMessage { playerId: string; nickname: string; text: string; timestamp: number }

interface GradingItem {
  playerId: string; nickname: string
  answers: { category: string; value: string; answerId: string }[]
}
```

## 7. Category List (33)

1. İsim (Erkek)
2. İsim (Kadın)
3. Şehir (Türkiye)
4. Şehir (Dünya)
5. Ülke (Dünya)
6. Başkent
7. Hayvan
8. Bitki / Çiçek
9. Meyve / Sebze
10. Eşya
11. Marka
12. Araba Markası
13. Teknoloji Markası
14. Ünlü (Sanatçı / Oyuncu)
15. Şarkıcı / Müzik Grubu
16. Film
17. Dizi
18. Çizgi Film / Animasyon Karakteri
19. Kitap
20. Yazar
21. Meslek
22. Spor Dalı
23. Futbol Takımı
24. Futbolcu
25. Yemek / Tatlı
26. İçecek
27. Renk
28. Giysi / Aksesuar
29. Müzik Aleti
30. Bilim İnsanı / Mucit
31. Dağ / Nehir / Göl
32. Mitolojik Karakter
33. Peri Bacaları / Turistik Yer

## 8. Rules & Constraints

- **Ğ** is never selected (virtually no Turkish words start with Ğ)
- Player count: min 2, max 8
- Duplicate nicknames not allowed in the same room
- Answers cannot be retracted after submission
- Votes can be changed until admin clicks "Sonuçları Göster"
- Nickname max 20 characters
- Answer max 50 characters
- Room code: 6-digit number

## 9. Visual Design

- **Theme:** Dark + Light mode support (persisted to `localStorage`)
- **Dark colors:** Navy background (#0a1929), light blue primary (#90caf9), purple secondary (#ce93d8)
- **Light colors:** Light gray background (#f5f7fa), blue primary (#1976d2), purple secondary (#9c27b0)
- **Toggle:** 🌙/☀️ icon at top-right corner, instant switch
- **Font:** Inter + Roboto
- **Border radius:** 16px default, 12px buttons
- **Glassmorphism:** Cards use `backdrop-filter: blur(12px)`
- **Icons:** `@mui/icons-material` + Unicode emojis

## 10. Current Status (v1.0)

- [x] Home screen (nickname + create/join room)
- [x] Lobby (player list, settings, ready status, chat)
- [x] SlotMachine (letter wheel animation)
- [x] Answer table (category inputs, timer)
- [x] Grading panel (category-based, all players on one page)
- [x] Vote transparency (who approved/disapproved visible)
- [x] Changeable votes (until admin finalizes)
- [x] Dark/light theme toggle (top-right, localStorage)
- [x] Round results (cumulative + round score)
- [x] Game over (final ranking)
- [x] Chat (lobby + in-game)
- [x] PeerJS signaling server (Render)
- [x] Vercel auto-deploy
- [x] 33 categories

### Known Issues

- No automatic `player-disconnected` broadcast on connection loss
- No admin transfer when admin leaves
- Game state lost on page refresh (no state persistence)
- "Oyuna Başla" doesn't require all players (including admin) to be ready

## 11. Development

```bash
# Install dependencies
npm install
cd server && npm install

# Frontend dev server
npm run dev                    # http://localhost:5173

# Signaling server
cd server && npm start         # http://localhost:9000

# Build
npm run build

# Type check
npm run lint
```

## 12. Multi-Tab Testing

```
Tab 1: http://localhost:5173 → "Oyuncu1" → Oda Oluştur
Tab 2: http://localhost:5173 → "Oyuncu2" → Odaya Katıl (enter code)
Tab 3: http://localhost:5173 → "Oyuncu3" → Odaya Katıl
...
```

Each tab creates a separate Peer instance. Internet connection is required (PeerJS Cloud/Render signaling).

## 13. Future Features (v2+)

- Custom category creation
- Game history / statistics (localStorage)
- Sound effects
- Mobile responsive improvements
- Connection loss handling
- Admin transfer on disconnect
