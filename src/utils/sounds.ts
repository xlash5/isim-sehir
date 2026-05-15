export type SoundEvent =
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

const STORAGE_KEY = 'isim-sehir-sound'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + 0.05)
  } catch {
    if (audioCtx) {
      audioCtx.close()
      audioCtx = null
    }
  }
}

function playChord(
  frequencies: number[],
  noteDuration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, noteDuration, type, volume), i * noteDuration * 1000)
  })
}

const TONE_MAP: Record<SoundEvent, () => void> = {
  'wheel-tick': () => playTone(800, 0.03, 'square', 0.04),
  'letter-reveal': () => playChord([523, 659, 784], 0.15, 'sine', 0.08),
  'player-connect': () => playTone(440, 0.08, 'sine', 0.06),
  'player-disconnect': () => {
    playTone(440, 0.04, 'sine', 0.06)
    setTimeout(() => playTone(330, 0.06, 'sine', 0.05), 40)
  },
  'answer-submit': () => playTone(1000, 0.02, 'square', 0.03),
  'timer-warning': () => playTone(600, 0.05, 'square', 0.04),
  'round-results': () => playChord([523, 659, 784, 1047], 0.12, 'sine', 0.07),
  'game-over-victory': () => playChord([523, 659, 784, 1047, 1319], 0.18, 'sine', 0.09),
  'game-over-defeat': () => playChord([784, 659, 523, 392], 0.2, 'sine', 0.07),
  'chat-message': () => playTone(880, 0.1, 'sine', 0.05),
}

export function playSound(event: SoundEvent) {
  if (!isSoundEnabled()) return
  TONE_MAP[event]()
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}
