# İsim Şehir — v1.2 Sound Effects

> **Priority:** Low — enhancement feature
> **Version target:** v1.2
> **Status:** 🔴 Not implemented

## Overview

Add subtle sound effects to key game events to improve the user experience and provide audio feedback.

## Requirements

1. **Discrete sounds** for key actions — not intrusive, toggleable.
2. **Sound toggle** in the lobby settings or a global settings icon.
3. **Default:** sounds are **off** (opt-in).
4. **Preference persisted** in `localStorage`.
5. **No external audio dependencies** — use the Web Audio API or inline base64 encoded short audio clips.
6. **Events to sound:**
   - Letter wheel spinning → tick/tock sound
   - Letter revealed → short chime
   - Player connects/disconnects → subtle pop
   - Answer submitted → soft click
   - Timer warning (last 5 seconds) → ticking sound
   - Round results revealed → fanfare or reveal sound
   - Game over → victory/defeat jingle (subtle)
   - Chat message received → notification ping

## Technical Design

### Sound Manager

```ts
// src/utils/sounds.ts
type SoundEvent =
  | 'wheel-tick'
  | 'letter-reveal'
  | 'player-connect'
  | 'player-disconnect'
  | 'answer-submit'
  | 'timer-warning'
  | 'round-results'
  | 'game-over-victory'
  | 'game-over-defeat'
  | 'chat-message'

function playSound(event: SoundEvent): void
function setSoundEnabled(enabled: boolean): void
function isSoundEnabled(): boolean
```

### Implementation

Use the Web Audio API (`AudioContext`) to generate simple tones programmatically — no audio files needed:

```ts
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = 0.1
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}
```

Each `SoundEvent` maps to a specific tone pattern (frequency, duration, waveform type).

### Sound Toggle

- A speaker icon 🔇/🔊 in the lobby or top bar.
- Stored in `localStorage('isim-sehir-sound')` as boolean.

### Integration Points

- `SlotMachine.tsx` → `playSound('wheel-tick')` on each reel frame, `playSound('letter-reveal')` on final letter.
- `PeerContext.tsx` → `playSound('player-connect')` / `playSound('player-disconnect')` on join/leave.
- `AnswerTable.tsx` → `playSound('answer-submit')` on submit.
- `Timer.tsx` → `playSound('timer-warning')` when ≤ 5 seconds remaining.
- `Scoreboard.tsx` → `playSound('round-results')` on round end; `playSound('game-over-victory')` / `playSound('game-over-defeat')` on game over.
- `ChatBox.tsx` → `playSound('chat-message')` on new message received.

## Acceptance Criteria

- [ ] Sound effects play at appropriate game events
- [ ] Sound toggle works and persists
- [ ] Sounds are off by default
- [ ] Web Audio API tones are pleasant, not jarring
- [ ] No external audio file dependencies
