import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  AudioLines,
  Cpu,
  Database,
  Gauge,
  Globe2,
  Monitor,
  RotateCcw,
  Save,
  ShieldAlert,
  Swords,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Difficulty, GraphicsQuality } from '../types'
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/useSettingsStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { useRosterStore } from '../store/useRosterStore'
import { useNavStore } from '../store/useNavStore'
import { audio } from '../audio/AudioEngine'
import { NeonButton } from '../components/NeonButton'

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="panel rounded-sm p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/60 text-cyan-300">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-white">{title}</h2>
          <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <label className={`block ${disabled ? 'opacity-50' : ''}`}>
      <span className="mb-1 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
        <span className="font-display text-sm text-slate-200">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={() => audio.play('select')}
        onTouchEnd={() => audio.play('select')}
      />
    </label>
  )
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        {hint && <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => {
          onChange(!value)
          audio.play('select')
        }}
        className={`toggle ${value ? 'on' : ''}`}
        aria-label={label}
      />
    </div>
  )
}

const GRAPHICS: { id: GraphicsQuality; label: string; hint: string }[] = [
  { id: 'low', label: 'LOW', hint: 'Best FPS / phones' },
  { id: 'medium', label: 'MEDIUM', hint: 'Balanced' },
  { id: 'high', label: 'HIGH', hint: 'Full effects' },
]

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy', label: 'EASY', color: '#4ade80' },
  { id: 'medium', label: 'MEDIUM', color: '#22d3ee' },
  { id: 'hard', label: 'HARD', color: '#fbbf24' },
  { id: 'insane', label: 'INSANE', color: '#f87171' },
]

export function SettingsScreen() {
  const settings = useSettingsStore()
  const update = useSettingsStore((s) => s.update)
  const reset = useSettingsStore((s) => s.reset)
  const resetProgression = useProgressionStore((s) => s.reset)
  const resetRoster = useRosterStore((s) => s.resetAll)
  const setScreen = useNavStore((s) => s.setScreen)
  const [savedFlash, setSavedFlash] = useState(false)
  const [serverDraft, setServerDraft] = useState(settings.serverUrl)
  const [nameDraft, setNameDraft] = useState(settings.playerName)

  const saveConnection = () => {
    update({
      serverUrl: serverDraft.trim().replace(/\/$/, '') || DEFAULT_SETTINGS.serverUrl,
      playerName: nameDraft.trim().slice(0, 20),
    })
    setSavedFlash(true)
    audio.play('select')
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.1),transparent_55%)]" />
      <div className="arcade-scroll relative z-10 h-full overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                audio.play('back')
                setScreen('menu')
              }}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/70 text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
              aria-label="Back to main menu"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.32em] text-cyan-300/80">System configuration</p>
              <h1 className="font-display text-3xl leading-none tracking-[0.08em] text-white sm:text-4xl">SETTINGS</h1>
            </div>
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <span className="chip border-emerald-400/30 bg-emerald-500/10 text-emerald-200">Auto-saved locally</span>
            </div>
          </header>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <Section icon={<AudioLines size={17} />} title="AUDIO" subtitle="Synth soundtrack, SFX and voice lines">
              <Toggle
                label="Mute everything"
                hint="Master mute"
                value={settings.muted}
                onChange={(v) => update({ muted: v })}
              />
              <Slider label="Master volume" value={settings.masterVolume} onChange={(v) => update({ masterVolume: v })} disabled={settings.muted} />
              <Slider label="Music volume" value={settings.musicVolume} onChange={(v) => update({ musicVolume: v })} disabled={settings.muted} />
              <Slider label="SFX volume" value={settings.sfxVolume} onChange={(v) => update({ sfxVolume: v })} disabled={settings.muted} />
              <Toggle
                label="Character voice lines"
                hint="Browser speech synthesis"
                value={settings.voiceLines}
                onChange={(v) => update({ voiceLines: v })}
              />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => audio.play('punch')} className="chip transition hover:border-pink-400/60">
                  Test punch
                </button>
                <button type="button" onClick={() => audio.play('explosion')} className="chip transition hover:border-amber-400/60">
                  Test explosion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.startMusic('fight')
                    window.setTimeout(() => audio.startMusic('menu'), 4500)
                  }}
                  className="chip transition hover:border-cyan-400/60"
                >
                  Preview fight music
                </button>
              </div>
            </Section>

            <Section icon={<Monitor size={17} />} title="GRAPHICS" subtitle="Quality, shake and combat feedback">
              <div className="grid grid-cols-3 gap-1.5">
                {GRAPHICS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      update({ graphics: g.id })
                      audio.play('select')
                    }}
                    className={`rounded-sm border px-2 py-2 text-left transition ${
                      settings.graphics === g.id
                        ? 'border-cyan-400/60 bg-cyan-500/10'
                        : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                    }`}
                  >
                    <span className="block font-display text-lg leading-none text-slate-100">{g.label}</span>
                    <span className="mt-1 block text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-slate-500">{g.hint}</span>
                  </button>
                ))}
              </div>
              <Toggle
                label="Screen shake"
                hint="Impact camera movement"
                value={settings.screenShake}
                onChange={(v) => update({ screenShake: v })}
              />
              <Toggle
                label="Damage numbers"
                hint="Floating hit values"
                value={settings.damageNumbers}
                onChange={(v) => update({ damageNumbers: v })}
              />
              <Toggle
                label="Touch controls"
                hint="Show on-screen joystick and buttons"
                value={settings.showTouchControls}
                onChange={(v) => update({ showTouchControls: v })}
              />
              <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <Gauge size={11} /> Current profile
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {settings.graphics === 'low' && 'Reduced DPR, no shadows. Built for phones and older laptops.'}
                  {settings.graphics === 'medium' && 'Balanced DPR and shadows. Good default for most machines.'}
                  {settings.graphics === 'high' && 'Full resolution, antialiasing, shadows and maximum particle density.'}
                </p>
              </div>
            </Section>

            <Section icon={<Swords size={17} />} title="GAMEPLAY" subtitle="Rounds, timer and CPU behaviour">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Cpu size={11} /> Default CPU difficulty
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        update({ difficulty: d.id })
                        audio.play('select')
                      }}
                      className={`rounded-sm border px-1 py-1.5 text-center font-display text-sm transition ${
                        settings.difficulty === d.id
                          ? 'border-slate-400/60 bg-slate-800/70'
                          : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                      }`}
                      style={{ color: d.color }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[0.55rem] leading-snug text-slate-600">
                  Difficulty changes reaction time, blocking and decision quality. It never changes health or damage.
                </p>
              </div>

              <div>
                <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Rounds to win</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        update({ roundsToWin: n })
                        audio.play('select')
                      }}
                      className={`rounded-sm border px-2 py-1.5 text-center transition ${
                        settings.roundsToWin === n
                          ? 'border-cyan-400/60 bg-cyan-500/10 text-white'
                          : 'border-slate-700/60 bg-slate-950/50 text-slate-400 hover:border-slate-500/70'
                      }`}
                    >
                      <span className="font-display text-lg leading-none">BO{n * 2 - 1}</span>
                      <span className="mt-0.5 block text-[0.48rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                        {n === 1 ? 'Single' : n === 2 ? 'Best of 3' : 'Best of 5'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Round timer
                  <span className="font-display text-sm text-slate-200">{settings.roundSeconds}s</span>
                </p>
                <input
                  type="range"
                  min={30}
                  max={99}
                  step={5}
                  value={settings.roundSeconds}
                  onChange={(e) => update({ roundSeconds: Number(e.target.value) })}
                  onMouseUp={() => audio.play('select')}
                />
              </div>
            </Section>

            <Section icon={<Globe2 size={17} />} title="ONLINE + PLAYER" subtitle="Private room server and display name">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <User size={11} /> Player name
                </span>
                <input
                  className="input"
                  value={nameDraft}
                  maxLength={20}
                  placeholder="Your name"
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Globe2 size={11} /> Server URL
                </span>
                <input
                  className="input"
                  value={serverDraft}
                  placeholder="http://localhost:3001"
                  onChange={(e) => setServerDraft(e.target.value)}
                />
                <span className="mt-1 block text-[0.55rem] leading-snug text-slate-600">
                  Run <code className="text-slate-400">npm run server</code> locally, or point this at a deployed Socket.IO server.
                  Override the default with <code className="text-slate-400">VITE_SERVER_URL</code>.
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveConnection}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  <Save size={13} /> Save connection
                </button>
                {savedFlash && (
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-emerald-300">Saved</span>
                )}
              </div>
            </Section>

            <Section icon={<Database size={17} />} title="DATA" subtitle="Local storage and saved progress">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all wins, losses and match history?')) {
                      resetProgression()
                      audio.play('back')
                    }
                  }}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  <RotateCcw size={13} /> Reset progression
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset every Power Lab edit back to the original five fighters?')) {
                      resetRoster()
                      audio.play('back')
                    }
                  }}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  <ShieldAlert size={13} /> Reset Power Lab
                </button>
              </div>
              <p className="text-[0.6rem] leading-snug text-slate-600">
                Settings, roster edits and match history are stored in this browser's localStorage. Clearing site data removes them.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setServerDraft(DEFAULT_SETTINGS.serverUrl)
                    setNameDraft('')
                    audio.play('back')
                  }}
                  className="btn btn-danger px-3 py-2 text-xs"
                >
                  <RotateCcw size={13} /> Reset all settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update({ muted: !settings.muted })
                    audio.play('select')
                  }}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  {settings.muted ? <Volume2 size={13} /> : <VolumeX size={13} />} {settings.muted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </Section>
          </div>

          <div className="mt-4 flex justify-end pb-4">
            <NeonButton
              variant="ghost"
              sound="back"
              onClick={() => setScreen('menu')}
              className="px-5 py-2.5 text-sm"
              icon={<ArrowLeft size={14} />}
            >
              Back to menu
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  )
}
