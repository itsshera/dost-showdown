import type { CharacterId } from '../types'

export type SfxName =
  | 'punch'
  | 'kick'
  | 'block'
  | 'jump'
  | 'land'
  | 'whoosh'
  | 'select'
  | 'hover'
  | 'back'
  | 'explosion'
  | 'glitch'
  | 'electric'
  | 'missile'
  | 'slam'
  | 'sparkle'
  | 'quack'
  | 'ko'
  | 'victory'
  | 'defeat'
  | 'announce'
  | 'meterFull'
  | 'denied'
  | 'roundStart'

type MusicTrack = 'menu' | 'fight'

interface AudioConfig {
  master: number
  music: number
  sfx: number
  muted: boolean
}

const VOICE_PROFILES: Record<CharacterId, { pitch: number; rate: number }> = {
  anay: { pitch: 0.75, rate: 0.95 },
  shubh: { pitch: 1.12, rate: 1.05 },
  shaurya: { pitch: 0.95, rate: 1.1 },
  varya: { pitch: 1.32, rate: 1.16 },
  mitansh: { pitch: 1.05, rate: 1.22 },
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private config: AudioConfig = { master: 0.85, music: 0.4, sfx: 0.85, muted: false }
  private track: MusicTrack | null = null
  private musicToken = 0
  private musicTimer: number | null = null
  private nextNoteTime = 0
  private step = 0
  private initialized = false
  private lastVoiceAt = 0

  init() {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      this.ctx = ctx
      this.masterGain = ctx.createGain()
      this.musicGain = ctx.createGain()
      this.sfxGain = ctx.createGain()
      this.masterGain.connect(ctx.destination)
      this.musicGain.connect(this.masterGain)
      this.sfxGain.connect(this.masterGain)
      this.applyVolumes()
      this.buildNoise()
      this.initialized = true
      if (ctx.state === 'suspended') void ctx.resume()
    } catch {
      this.initialized = false
    }
  }

  private buildNoise() {
    if (!this.ctx) return
    const length = Math.floor(this.ctx.sampleRate * 2)
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buffer
  }

  configure(config: AudioConfig) {
    this.config = config
    if (this.ctx) this.applyVolumes()
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return
    const now = this.ctx.currentTime
    const master = this.config.muted ? 0 : this.config.master
    this.masterGain.gain.setTargetAtTime(master, now, 0.04)
    this.musicGain.gain.setTargetAtTime(this.config.music, now, 0.04)
    this.sfxGain.gain.setTargetAtTime(this.config.sfx, now, 0.04)
  }

  private now() {
    this.init()
    return this.ctx?.currentTime ?? 0
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    when = 0,
    slideTo?: number,
    dest?: GainNode,
  ) {
    if (!this.ctx) return
    const t = when || this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(20, freq), t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + duration)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(env)
    env.connect(dest ?? this.sfxGain ?? this.ctx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.03)
  }

  private noise(
    duration: number,
    filterFreq: number,
    gain: number,
    when = 0,
    type: BiquadFilterType = 'bandpass',
    dest?: GainNode,
    slideTo?: number,
  ) {
    if (!this.ctx || !this.noiseBuffer) return
    const t = when || this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(filterFreq, t)
    filter.Q.value = 0.9
    if (slideTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + duration)
    const env = this.ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter)
    filter.connect(env)
    env.connect(dest ?? this.sfxGain ?? this.ctx.destination)
    src.start(t)
    src.stop(t + duration + 0.02)
  }

  play(name: SfxName, characterId?: CharacterId) {
    if (!this.ctx) this.init()
    if (!this.ctx || this.ctx.state === 'suspended') {
      void this.ctx?.resume()
    }
    const t = this.now()
    switch (name) {
      case 'punch':
        this.tone(150, 0.13, 'sine', 0.5, t, 55)
        this.noise(0.08, 1500, 0.22, t, 'highpass')
        break
      case 'kick':
        this.tone(110, 0.18, 'sine', 0.55, t, 42)
        this.noise(0.12, 900, 0.28, t, 'lowpass')
        break
      case 'block':
        this.tone(760, 0.09, 'square', 0.1, t, 420)
        this.noise(0.07, 3200, 0.2, t, 'highpass')
        break
      case 'jump':
        this.tone(240, 0.16, 'triangle', 0.18, t, 480)
        break
      case 'land':
        this.tone(90, 0.14, 'sine', 0.35, t, 40)
        this.noise(0.1, 500, 0.18, t, 'lowpass')
        break
      case 'whoosh':
        this.noise(0.16, 400, 0.18, t, 'bandpass', undefined, 2600)
        break
      case 'select':
        this.tone(520, 0.07, 'square', 0.12, t)
        this.tone(780, 0.1, 'square', 0.1, t + 0.07)
        break
      case 'hover':
        this.tone(1100, 0.035, 'sine', 0.05, t)
        break
      case 'back':
        this.tone(420, 0.09, 'triangle', 0.12, t, 250)
        break
      case 'explosion':
        this.tone(75, 0.55, 'sawtooth', 0.5, t, 28)
        this.noise(0.6, 900, 0.5, t, 'lowpass', undefined, 90)
        this.noise(0.2, 4000, 0.2, t, 'highpass')
        break
      case 'glitch':
        for (let i = 0; i < 5; i += 1) {
          this.tone(180 + Math.random() * 1200, 0.05, 'square', 0.08, t + i * 0.035)
        }
        this.noise(0.28, 2400, 0.16, t, 'bandpass')
        break
      case 'electric':
        this.noise(0.4, 3800, 0.25, t, 'highpass')
        this.tone(1400, 0.32, 'sawtooth', 0.12, t, 90)
        this.tone(2200, 0.2, 'square', 0.06, t + 0.08, 400)
        break
      case 'missile':
        this.noise(0.5, 700, 0.24, t, 'bandpass', undefined, 2400)
        this.tone(180, 0.45, 'sawtooth', 0.18, t, 620)
        break
      case 'slam':
        this.tone(65, 0.5, 'sine', 0.6, t, 24)
        this.noise(0.35, 600, 0.35, t, 'lowpass')
        break
      case 'sparkle':
        ;[880, 1174, 1568, 2093].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.08, t + i * 0.04))
        break
      case 'quack':
        this.tone(320, 0.09, 'sawtooth', 0.2, t, 210)
        this.tone(300, 0.12, 'sawtooth', 0.18, t + 0.1, 180)
        break
      case 'ko':
        this.tone(60, 0.9, 'sawtooth', 0.6, t, 22)
        this.noise(0.8, 1200, 0.45, t, 'lowpass', undefined, 80)
        this.tone(440, 0.5, 'square', 0.12, t + 0.15, 110)
        break
      case 'victory':
        ;[523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.35, 'triangle', 0.16, t + i * 0.13),
        )
        this.tone(1568, 0.6, 'sine', 0.1, t + 0.52)
        break
      case 'defeat':
        ;[392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.13, t + i * 0.16))
        break
      case 'announce':
        this.tone(660, 0.07, 'square', 0.09, t)
        break
      case 'meterFull':
        ;[784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.09, t + i * 0.05))
        break
      case 'denied':
        this.tone(180, 0.12, 'square', 0.12, t, 120)
        break
      case 'roundStart':
        this.tone(220, 0.2, 'triangle', 0.12, t)
        this.tone(330, 0.25, 'triangle', 0.1, t + 0.1)
        break
    }
    if (characterId) {
      // Character-specific pitch seasoning for impacts.
      if (name === 'whoosh') this.tone(320, 0.08, 'sine', 0.05, t, 180)
    }
  }

  speak(text: string, characterId: CharacterId, volume = 0.9) {
    if (!('speechSynthesis' in window)) return
    const now = Date.now()
    if (now - this.lastVoiceAt < 900) return
    this.lastVoiceAt = now
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const profile = VOICE_PROFILES[characterId]
      utterance.pitch = profile.pitch
      utterance.rate = profile.rate
      utterance.volume = Math.max(0, Math.min(1, volume * (this.config.muted ? 0 : 1)))
      const voices = window.speechSynthesis.getVoices()
      const preferred =
        voices.find((v) => /en-IN/i.test(v.lang)) ||
        voices.find((v) => /en-GB/i.test(v.lang)) ||
        voices.find((v) => /en/i.test(v.lang))
      if (preferred) utterance.voice = preferred
      window.speechSynthesis.speak(utterance)
    } catch {
      // Voice is a bonus; never let it break gameplay.
    }
  }

  startMusic(track: MusicTrack) {
    this.init()
    if (!this.ctx || !this.musicGain) return
    if (this.track === track) return
    this.stopMusic()
    this.track = track
    const token = ++this.musicToken
    const stepDuration = track === 'fight' ? 60 / 132 / 4 : 60 / 84 / 2
    this.nextNoteTime = this.ctx.currentTime + 0.08
    this.step = 0
    const schedule = () => {
      if (!this.ctx || token !== this.musicToken || !this.musicGain) return
      while (this.nextNoteTime < this.ctx.currentTime + 0.18) {
        this.scheduleStep(track, this.step, this.nextNoteTime)
        this.nextNoteTime += stepDuration
        this.step = (this.step + 1) % 32
      }
    }
    schedule()
    this.musicTimer = window.setInterval(schedule, 45)
  }

  private scheduleStep(track: MusicTrack, step: number, when: number) {
    if (!this.musicGain) return
    const dest = this.musicGain
    if (track === 'menu') {
      const chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 246.94, 293.66],
        [164.81, 207.65, 246.94],
      ]
      const chord = chords[Math.floor(step / 8) % 4]
      if (step % 8 === 0) {
        chord.forEach((f) => this.tone(f / 2, 1.6, 'triangle', 0.045, when, undefined, dest))
      }
      if (step % 2 === 0) {
        const note = chord[(step / 2) % 3]
        this.tone(note * 2, 0.25, 'sine', 0.05, when, undefined, dest)
      }
      if (step % 8 === 4) this.tone(chord[2] * 4, 0.3, 'triangle', 0.025, when, undefined, dest)
    } else {
      const bassPattern = [55, 55, 0, 65.41, 55, 55, 73.42, 0, 49, 49, 0, 58.27, 49, 49, 65.41, 0]
      const bass = bassPattern[step % 16]
      if (bass) {
        this.tone(bass, 0.16, 'sawtooth', 0.07, when, bass * 0.98, dest)
        this.tone(bass / 2, 0.18, 'sine', 0.06, when, undefined, dest)
      }
      if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
        this.tone(70, 0.14, 'sine', 0.16, when, 38, dest)
      }
      if (step % 8 === 4 || step % 8 === 7) {
        this.noise(0.09, 2200, 0.07, when, 'highpass', dest)
        this.tone(180, 0.07, 'triangle', 0.06, when, 120, dest)
      }
      if (step % 2 === 0) this.noise(0.03, 7000, 0.025, when, 'highpass', dest)
      const arp = [440, 523.25, 659.25, 523.25, 392, 493.88, 587.33, 493.88]
      if (step % 2 === 1) {
        this.tone(arp[Math.floor(step / 2) % 8], 0.12, 'square', 0.018, when, undefined, dest)
      }
    }
  }

  stopMusic() {
    this.musicToken += 1
    this.track = null
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }

  suspend() {
    void this.ctx?.suspend()
  }

  resume() {
    void this.ctx?.resume()
  }
}

export const audio = new AudioEngine()

export function sfxForSpecial(sfx: string): SfxName {
  if (
    sfx === 'explosion' ||
    sfx === 'glitch' ||
    sfx === 'electric' ||
    sfx === 'missile' ||
    sfx === 'slam' ||
    sfx === 'sparkle' ||
    sfx === 'quack'
  ) {
    return sfx
  }
  return 'explosion'
}
