# İsim Şehir — v3.0 UX: Rules & Behaviour Visibility

> **Priority:** P01 — directly improves player understanding and reduces friction
> **Version target:** v3.0
> **Status:** ✅ Implemented (commit 05f70ea)

## Overview

New players currently have no way to learn the game rules, scoring mechanics, or UI interactions within the app. They must either know the game already or guess. Existing players may not understand why certain actions are unavailable, what a phase transition means, or how scoring works. This spec adds contextual on-boarding, inline tooltips, phase explanations, and an interactive rules panel.

## Requirements

### 1. Interactive Rules Panel (Home Page)

A dedicated **"Nasıl Oynanır" / "How to Play"** button on the home page opens a full-screen dialog or side sheet with:

- **Game objective** — 1-2 sentence summary
- **Phase flow diagram** — visual: `Lobby → Wheel → Answer → Grade → Results → ... → Game Over`
- **Scoring table:**
  | Condition | Points |
  |---|---|
  | Valid & unique answer | 10 |
  | Valid but duplicate answer | 5 |
  | Invalid / rejected | 0 |
  | Left blank | 0 |
- **Peer grading explanation** — how voting works, that votes can be changed until admin finalizes, that grader identities are shown
- **Admin responsibilities** — what the admin can do (start game, finalize grading, transfer admin, etc.)
- **Spectator mode explanation** — what spectators can/cannot do
- **Room passwords** — how private rooms work
- **Letter pool** — which letters are included, why Ğ is excluded

Each section is collapsible. The panel persists the "has seen rules" flag in localStorage so it auto-opens on first visit.

### 2. Phase Transition Explanations

Every time the game phase changes, a **brief, dismissible banner or snackbar** explains what just happened and what to do next:

| Transition | Message (example) |
|---|---|
| lobby → wheel | *"Tur başlıyor! Admin çarkı çeviriyor…"* |
| wheel → answering | *"Cevapları yazma zamanı! Kategorileri doldur ve gönder."* |
| answering → grading | *"Herkes cevapladı! Şimdi diğer oyuncuların cevaplarını değerlendir."* |
| grading → round-results | *"Puanlar hesaplandı! Bir sonraki turu bekleyin."* |
| round-results → wheel | *"Yeni tur! Çark tekrar dönüyor…"* |
| round-results → game-over | *"Oyun bitti! İşte final sıralaması."* |

- Messages are localised (all 6 languages).
- Auto-dismiss after 5 seconds.
- A small "i" icon near the phase indicator (if any) allows re-showing the current phase explanation.

### 3. Inline Tooltips & Helper Text

Add MUI `Tooltip` or `Typography` helper text to non-obvious UI elements:

| Element | Tooltip / Helper |
|---|---|
| Ready toggle | *"Hazır olduğunda admin oyunu başlatabilir."* |
| Admin "Oyuna Başla" button (disabled) | *"En az 2 oyuncu hazır olmalı ve en az 3 kategori seçilmeli."* |
| Category checkboxes | *"En az 3 kategori seçmelisin."* |
| "Sonuçları Göster" (admin grading) | *"Oylamayı kapatır ve puanları gösterir. Herkes oy verdikten sonra kullanılabilir."* |
| Vote buttons (valid/invalid) | *"Geçerli = puan alır, Geçersiz = puan alamaz. Oyun sonuçlanana kadar oyunu değiştirebilirsin."* |
| Timer display | *"Kalan süre. Süre bitince cevaplar otomatik gönderilir."* |
| Spectator badge | *"Seyirci modu: oyunu izleyebilirsin ama cevap yazamazsın."* |
| Admin transfer button | *"Admin yetkisini başka bir oyuncuya devret."* |
| Room password field | *"İsteğe bağlı: odaya şifre koyarak özel oyun oluşturabilirsin."* |
| Score breakdown (per round) | *"10 puan = benzersiz cevap, 5 puan = ortak cevap, 0 = geçersiz/boş"* |

### 4. Visual Phase Indicator

A persistent, always-visible **phase indicator** in the game UI (e.g. top of the screen or as a stepper):

```
[lobi] → [çark] → [cevaplama] → [değerlendirme] → [sonuçlar]
```

- Current phase is highlighted/active.
- Completed phases are marked with a checkmark.
- Future phases are dimmed.
- Clicking a completed phase shows a brief summary of what happened (e.g. round score).
- The indicator is responsive: collapses to a dropdown or icon on mobile.

### 5. First-Time Player Flow

Detect first-time visitors via localStorage flag:

- **First visit ever:** auto-open the rules panel with a welcome message.
- **First game played:** after game-over, show a "Did you know?" tip (randomised from a pool of 5-10 tips).
- **First time spectating:** show a brief explainer about spectator limitations.

### 6. Scoring Drill-Down in Round Results

In the round-results scoreboard, each player's score for that round shows a **breakdown icon/button** that reveals:

| Category | Your Answer | Verdict | Points |
|---|---|---|---|
| İsim (Erkek) | Ahmet | ✅ Unique | 10 |
| Şehir | Ankara | ⚠️ Shared with Ali | 5 |
| Hayvan | — | ❌ Blank | 0 |
| **Round total** | | | **15** |

This helps players understand *why* they got the score they did and learn the scoring rules through direct example.

### 7. Chat-Based Tips

When certain game events occur, an ephemeral system message in the chat (styled distinctly, not a player message) provides a contextual tip:

| Event | Tip |
|---|---|
| First player readies | *"İpucu: Admin de hazır olmalı, ardından 'Oyuna Başla' butonu aktif olur."* |
| Admin starts game | *"İpucu: Cevapları yazarken Enter tuşuna basarak hızlıca sonraki kategoriye geçebilirsin."* |
| First grading phase | *"İpucu: Her cevap için Geçerli veya Geçersiz oyla. Oyunu sonuçlanana kadar değiştirebilirsin."* |

- Maximum one tip per phase per game (no spam).
- Localised.
- Can be toggled off in settings.

## Technical Design

### New Components

| Component | Location | Description |
|---|---|---|
| `RulesPanel.tsx` | `src/components/common/RulesPanel.tsx` | Full-screen rules dialog with collapsible sections |
| `PhaseIndicator.tsx` | `src/components/common/PhaseIndicator.tsx` | Stepper showing current/completed/future phases |
| `PhaseTransitionBanner.tsx` | `src/components/common/PhaseTransitionBanner.tsx` | Brief overlay explaining phase change |
| `ScoreBreakdown.tsx` | `src/components/Game/ScoreBreakdown.tsx` | Per-category scoring drill-down in round results |
| `InlineTip.tsx` | `src/components/common/InlineTip.tsx` | Contextual tooltip with "i" icon |

### New / Modified Utilities

| File | Change |
|---|---|
| `src/utils/tips.ts` | **New** — pool of contextual tips keyed by game event |
| `src/utils/rules.ts` | **New** — rule text content for each section (localised) |
| `src/locales/*.ts` | Add keys for all new UI strings |

### Data Flow

- `PhaseTransitionBanner` listens to `room.phase` changes via Zustand selector.
- `PhaseIndicator` derives phase list from `GamePhase` type + `currentRound`.
- `ScoreBreakdown` reads `round.answers` and `round.votes` for the current round.
- `RulesPanel` is opened via a simple `useState` in `HomePage` (no store needed).
- First-visit flags stored in localStorage: `has-seen-rules`, `games-played-count`, `has-seen-spectator-tip`.

### Locale Keys to Add

All 6 languages need translations for:

- `rules.*` — rule section titles, body text
- `phase.*` — phase names, transition messages
- `tip.*` — contextual tips
- `tooltip.*` — inline tooltips for UI elements
- `score.breakdown.header`, `score.breakdown.unique`, `score.breakdown.shared`, `score.breakdown.invalid`, `score.breakdown.blank`

## Files to Create

- `src/components/common/RulesPanel.tsx`
- `src/components/common/PhaseIndicator.tsx`
- `src/components/common/PhaseTransitionBanner.tsx`
- `src/components/common/InlineTip.tsx`
- `src/components/Game/ScoreBreakdown.tsx`
- `src/utils/tips.ts`
- `src/utils/rules.ts`

## Files to Modify

- `src/pages/HomePage.tsx` — add "Nasıl Oynanır" button, first-visit auto-open
- `src/pages/GamePage.tsx` — add PhaseIndicator, PhaseTransitionBanner
- `src/components/Game/Scoreboard.tsx` — integrate ScoreBreakdown
- `src/components/Lobby/PlayerList.tsx` — add tooltips to admin transfer, ready toggle
- `src/components/Game/AnswerTable.tsx` — add tooltips
- `src/components/Game/GradingPanel.tsx` — add tooltips to vote buttons
- `src/components/common/ChatBox.tsx` — add tip system messages
- `src/locales/tr.ts`, `en.ts`, `es.ts`, `pt.ts`, `fr.ts`, `de.ts` — new keys

## Acceptance Criteria

- [x] First-time visitor sees rules panel auto-open on home page
- [x] Rules panel explains game objective, phases, scoring, peer grading, admin roles, spectator mode, room passwords, letter pool
- [x] Rules panel content is localised in all 6 languages
- [x] Phase transition banner shows on every phase change with appropriate message
- [x] Phase indicator is always visible in-game, shows current/completed/future phases
- [x] Inline tooltips exist on all non-obvious UI elements
- [x] Score drill-down shows per-category breakdown with verdict
- [x] Contextual chat tips fire once per event per game
- [x] All new UI is responsive (mobile-friendly)
- [x] No breaking changes to existing game logic
