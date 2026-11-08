import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  FlaskConical,
  Palette,
  RotateCcw,
  Save,
  Shirt,
  Sparkles,
  Swords,
  User,
  Zap,
} from 'lucide-react'
import type {
  Accessory,
  CharacterId,
  FighterState,
  HairStyle,
  PowerAnimation,
  RangeClass,
  SfxId,
} from '../types'
import {
  ACCESSORY_OPTIONS,
  BASE_CHARACTERS,
  CHARACTER_IDS,
  HAIR_OPTIONS,
  POWER_ANIMATIONS,
  RANGE_LENGTH,
  SFX_OPTIONS,
  getCharacter,
} from '../data/characters'
import { LIMITS, clamp, sanitisePower } from '../utils/validation'
import { CharacterPreview } from '../components/CharacterPreview'
import { FighterPortrait } from '../components/FighterPortrait'
import { StatBar } from '../components/StatBar'
import { useRosterStore } from '../store/useRosterStore'
import { useNavStore } from '../store/useNavStore'
import { audio } from '../audio/AudioEngine'

interface Draft {
  name: string
  nickname: string
  description: string
  powerName: string
  powerDescription: string
  damage: number
  cooldown: number
  range: RangeClass
  animation: PowerAnimation
  sfx: SfxId
  skin: string
  hair: string
  hairStyle: HairStyle
  outfit: string
  outfitSecondary: string
  accent: string
  trousers: string
  shoes: string
  accessory: Accessory
  bodyScale: number
}

const draftFrom = (id: CharacterId, overrides: ReturnType<typeof useRosterStore.getState>['overrides']): Draft => {
  const c = getCharacter(id, overrides)
  return {
    name: c.name,
    nickname: c.nickname,
    description: c.description,
    powerName: c.power.name,
    powerDescription: c.power.description,
    damage: c.power.damage,
    cooldown: c.power.cooldown,
    range: c.power.range,
    animation: c.power.animation,
    sfx: c.power.sfx,
    skin: c.appearance.skin,
    hair: c.appearance.hair,
    hairStyle: c.appearance.hairStyle,
    outfit: c.appearance.outfit,
    outfitSecondary: c.appearance.outfitSecondary,
    accent: c.appearance.accent,
    trousers: c.appearance.trousers,
    shoes: c.appearance.shoes,
    accessory: c.appearance.accessory,
    bodyScale: c.appearance.bodyScale,
  }
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
        {error ? (
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-red-300">{error}</span>
        ) : (
          hint && <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-slate-600">{hint}</span>
        )}
      </span>
      {children}
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-slate-700/60 bg-slate-950/50 p-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-8 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
        aria-label={label}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.5rem] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
        <span className="block truncate font-mono text-[0.62rem] text-slate-300">{value}</span>
      </span>
    </label>
  )
}

const PREVIEW_STATES: { id: FighterState; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'punch', label: 'Punch' },
  { id: 'kick', label: 'Kick' },
  { id: 'special', label: 'Special' },
  { id: 'victory', label: 'Victory' },
]

export function PowerLab() {
  const setScreen = useNavStore((s) => s.setScreen)
  const overrides = useRosterStore((s) => s.overrides)
  const updateCharacter = useRosterStore((s) => s.updateCharacter)
  const updatePower = useRosterStore((s) => s.updatePower)
  const updateAppearance = useRosterStore((s) => s.updateAppearance)
  const resetCharacter = useRosterStore((s) => s.resetCharacter)
  const resetAll = useRosterStore((s) => s.resetAll)

  const [selected, setSelected] = useState<CharacterId>('anay')
  const [draft, setDraft] = useState<Draft>(() => draftFrom('anay', overrides))
  const [previewState, setPreviewState] = useState<FighterState>('idle')
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'identity' | 'power' | 'look'>('identity')

  useEffect(() => {
    setDraft(draftFrom(selected, overrides))
    // Intentionally only re-seed when the fighter changes or a reset happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, overrides[selected]])

  const base = BASE_CHARACTERS[selected]
  const dirty = useMemo(() => {
    const current = draftFrom(selected, overrides)
    return (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== current[key])
  }, [draft, overrides, selected])

  const errors = useMemo(() => {
    const list: string[] = []
    if (draft.name.trim().length < LIMITS.name.min) list.push('Fighter name needs at least 2 characters.')
    if (draft.nickname.trim().length < LIMITS.nickname.min) list.push('Nickname needs at least 2 characters.')
    if (draft.description.trim().length < LIMITS.description.min) list.push('Bio needs at least 10 characters.')
    if (draft.powerName.trim().length < LIMITS.powerName.min) list.push('Power name needs at least 2 characters.')
    if (draft.powerDescription.trim().length < LIMITS.powerDescription.min) list.push('Power description needs at least 10 characters.')
    return list
  }, [draft])

  const previewCharacter = useMemo(() => {
    const c = getCharacter(selected, overrides)
    return {
      ...c,
      name: draft.name,
      nickname: draft.nickname,
      description: draft.description,
      power: sanitisePower({
        ...c.power,
        name: draft.powerName,
        description: draft.powerDescription,
        damage: draft.damage,
        cooldown: draft.cooldown,
        range: draft.range,
        animation: draft.animation,
        sfx: draft.sfx,
      }),
      appearance: {
        ...c.appearance,
        skin: draft.skin,
        hair: draft.hair,
        hairStyle: draft.hairStyle,
        outfit: draft.outfit,
        outfitSecondary: draft.outfitSecondary,
        accent: draft.accent,
        trousers: draft.trousers,
        shoes: draft.shoes,
        accessory: draft.accessory,
        bodyScale: clamp(draft.bodyScale, LIMITS.bodyScale.min, LIMITS.bodyScale.max),
      },
    }
  }, [draft, overrides, selected])

  const apply = () => {
    if (errors.length > 0) {
      audio.play('denied')
      return
    }
    updateCharacter(selected, {
      name: draft.name.trim(),
      nickname: draft.nickname.trim(),
      description: draft.description.trim(),
    })
    updatePower(selected, {
      name: draft.powerName.trim(),
      description: draft.powerDescription.trim(),
      damage: Math.round(draft.damage),
      cooldown: Math.round(draft.cooldown * 10) / 10,
      range: draft.range,
      animation: draft.animation,
      sfx: draft.sfx,
    })
    updateAppearance(selected, {
      skin: draft.skin,
      hair: draft.hair,
      hairStyle: draft.hairStyle,
      outfit: draft.outfit,
      outfitSecondary: draft.outfitSecondary,
      accent: draft.accent,
      trousers: draft.trousers,
      shoes: draft.shoes,
      accessory: draft.accessory,
      bodyScale: clamp(draft.bodyScale, LIMITS.bodyScale.min, LIMITS.bodyScale.max),
    })
    audio.play('sparkle')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const discard = () => {
    setDraft(draftFrom(selected, overrides))
    audio.play('back')
  }

  const resetFighter = () => {
    if (!window.confirm(`Reset ${base.nickname} to the original design?`)) return
    resetCharacter(selected)
    audio.play('back')
  }

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,114,182,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.14),transparent_55%)]" />
      <div className="arcade-scroll relative z-10 h-full overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-wrap items-center gap-3">
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
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.32em] text-pink-300/80">Experimental division</p>
              <h1 className="font-display text-3xl leading-none tracking-[0.08em] text-white sm:text-4xl">POWER LAB</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-emerald-300">
                  <Check size={12} /> Saved to browser
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset every fighter in the Power Lab?')) {
                    resetAll()
                    audio.play('back')
                  }
                }}
                className="chip transition hover:border-red-400/50 hover:text-red-200"
              >
                Reset all
              </button>
            </div>
          </header>

          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {CHARACTER_IDS.map((id) => {
              const c = getCharacter(id, overrides)
              const active = id === selected
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelected(id)
                    setTab('identity')
                    audio.play('select')
                  }}
                  className={`flex items-center gap-2 rounded-sm border p-1.5 text-left transition ${
                    active ? 'border-slate-400/60 bg-slate-800/70' : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                  }`}
                >
                  <FighterPortrait character={c} className="h-8 w-8 shrink-0 rounded-sm sm:h-10 sm:w-10" />
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate font-display text-sm leading-none text-slate-100">{c.nickname}</span>
                    <span className="mt-0.5 block truncate text-[0.46rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                      {c.power.name}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[20rem_1fr]">
            <div className="space-y-3">
              <div className="panel rounded-sm p-3">
                <div className="relative h-[18rem] overflow-hidden rounded-sm border border-slate-700/50 bg-[#070912]">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{ background: `radial-gradient(circle at 50% 72%, ${previewCharacter.color}38, transparent 65%)` }}
                  />
                  <CharacterPreview
                    character={previewCharacter}
                    state={previewState}
                    className="absolute inset-0"
                    autoRotate={false}
                  />
                  <span className="absolute left-2 top-2 rounded-sm border border-slate-600/50 bg-slate-950/80 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Live preview
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {PREVIEW_STATES.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => {
                        setPreviewState(state.id)
                        audio.play('select')
                      }}
                      className={`rounded-sm border px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] transition ${
                        previewState === state.id
                          ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100'
                          : 'border-slate-700/60 bg-slate-950/50 text-slate-500 hover:text-white'
                      }`}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel rounded-sm p-3">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">Base stats (unchanged)</p>
                <div className="mt-2 space-y-1.5">
                  <StatBar label="Power" value={base.stats.power} color="#f472b6" compact />
                  <StatBar label="Speed" value={base.stats.speed} color="#22d3ee" compact />
                  <StatBar label="Defense" value={base.stats.defense} color="#4ade80" compact />
                  <StatBar label="Technique" value={base.stats.technique} color="#a855f7" compact />
                  <StatBar label="Chaos" value={base.stats.chaos} color="#fbbf24" compact />
                </div>
                <p className="mt-2 text-[0.58rem] leading-snug text-slate-600">
                  Power Lab changes identity, visuals and the signature power. Core stats stay fixed so the roster remains fair.
                </p>
              </div>

              <div className="panel rounded-sm p-3">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                  <Sparkles size={11} className="text-pink-300" /> Fighter quote
                </p>
                <p className="mt-1 text-[0.72rem] italic leading-snug text-slate-400">“{base.quote}”</p>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={resetFighter} className="btn btn-ghost flex-1 px-2 py-1.5 text-[0.6rem]">
                    <RotateCcw size={11} /> Reset fighter
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'identity' as const, label: 'Identity', icon: User },
                  { id: 'power' as const, label: 'Signature power', icon: Zap },
                  { id: 'look' as const, label: 'Appearance', icon: Palette },
                ].map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        audio.play('select')
                      }}
                      className={`tab flex items-center gap-1.5 ${tab === t.id ? 'active' : ''}`}
                    >
                      <Icon size={13} /> {t.label}
                    </button>
                  )
                })}
              </div>

              {tab === 'identity' && (
                <div className="panel panel-accent rounded-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-pink-400/40 bg-pink-500/10 text-pink-300">
                      <User size={15} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl leading-none tracking-[0.05em] text-white">IDENTITY</h2>
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Shown on the roster, HUD and results</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Fighter name" hint={`${draft.name.length}/${LIMITS.name.max}`} error={draft.name.trim().length < LIMITS.name.min ? 'Too short' : undefined}>
                      <input
                        className="input"
                        value={draft.name}
                        maxLength={LIMITS.name.max}
                        onChange={(e) => patch('name', e.target.value)}
                      />
                    </Field>
                    <Field label="Nickname" hint={`${draft.nickname.length}/${LIMITS.nickname.max}`} error={draft.nickname.trim().length < LIMITS.nickname.min ? 'Too short' : undefined}>
                      <input
                        className="input"
                        value={draft.nickname}
                        maxLength={LIMITS.nickname.max}
                        onChange={(e) => patch('nickname', e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Bio / description" hint={`${draft.description.length}/${LIMITS.description.max}`} error={draft.description.trim().length < LIMITS.description.min ? 'At least 10 characters' : undefined}>
                      <textarea
                        className="input min-h-[7rem] resize-y"
                        value={draft.description}
                        maxLength={LIMITS.description.max}
                        onChange={(e) => patch('description', e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
                    <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-slate-500">Original identity</p>
                    <p className="mt-1 text-[0.72rem] text-slate-400">
                      <b className="text-slate-200">{base.name}</b> — {base.tagline}. {base.description}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'power' && (
                <div className="panel panel-accent rounded-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-amber-400/40 bg-amber-500/10 text-amber-300">
                      <Zap size={15} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl leading-none tracking-[0.05em] text-white">SIGNATURE POWER</h2>
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Damage, range, cooldown, animation and SFX</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Power name" hint={`${draft.powerName.length}/${LIMITS.powerName.max}`} error={draft.powerName.trim().length < LIMITS.powerName.min ? 'Too short' : undefined}>
                      <input
                        className="input"
                        value={draft.powerName}
                        maxLength={LIMITS.powerName.max}
                        onChange={(e) => patch('powerName', e.target.value)}
                      />
                    </Field>
                    <Field label="Impact SFX" hint="Synth sound">
                      <select className="input" value={draft.sfx} onChange={(e) => patch('sfx', e.target.value as SfxId)}>
                        {SFX_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Power description" hint={`${draft.powerDescription.length}/${LIMITS.powerDescription.max}`} error={draft.powerDescription.trim().length < LIMITS.powerDescription.min ? 'At least 10 characters' : undefined}>
                      <textarea
                        className="input min-h-[6rem] resize-y"
                        value={draft.powerDescription}
                        maxLength={LIMITS.powerDescription.max}
                        onChange={(e) => patch('powerDescription', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
                      <p className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Damage <span className="font-display text-lg text-amber-200">{Math.round(draft.damage)}</span>
                      </p>
                      <input
                        type="range"
                        min={LIMITS.damage.min}
                        max={LIMITS.damage.max}
                        step={1}
                        value={draft.damage}
                        onChange={(e) => patch('damage', Number(e.target.value))}
                        onMouseUp={() => audio.play('select')}
                      />
                      <p className="mt-1 text-[0.55rem] text-slate-600">Allowed {LIMITS.damage.min}–{LIMITS.damage.max}. One-shot builds are blocked.</p>
                    </div>
                    <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
                      <p className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Cooldown <span className="font-display text-lg text-cyan-200">{draft.cooldown.toFixed(1)}s</span>
                      </p>
                      <input
                        type="range"
                        min={LIMITS.cooldown.min}
                        max={LIMITS.cooldown.max}
                        step={0.5}
                        value={draft.cooldown}
                        onChange={(e) => patch('cooldown', Number(e.target.value))}
                        onMouseUp={() => audio.play('select')}
                      />
                      <p className="mt-1 text-[0.55rem] text-slate-600">Allowed {LIMITS.cooldown.min}–{LIMITS.cooldown.max} seconds.</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Range class" hint={`${RANGE_LENGTH[draft.range].toFixed(1)}m hitbox`}>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Short', 'Medium', 'Long'] as RangeClass[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => patch('range', r)}
                            className={`rounded-sm border px-1 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] transition ${
                              draft.range === r
                                ? 'border-amber-400/60 bg-amber-500/10 text-amber-100'
                                : 'border-slate-700/60 bg-slate-950/50 text-slate-500 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Animation" hint="Special visual">
                      <select className="input" value={draft.animation} onChange={(e) => patch('animation', e.target.value as PowerAnimation)}>
                        {POWER_ANIMATIONS.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="mt-2 text-[0.6rem] leading-snug text-slate-600">
                    {POWER_ANIMATIONS.find((a) => a.id === draft.animation)?.hint}. Range changes the actual hitbox in combat.
                  </p>
                </div>
              )}

              {tab === 'look' && (
                <div className="panel panel-accent rounded-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                      <Palette size={15} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl leading-none tracking-[0.05em] text-white">APPEARANCE</h2>
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Colours, hair, accessory and body scale</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <ColorField label="Skin" value={draft.skin} onChange={(v) => patch('skin', v)} />
                    <ColorField label="Hair" value={draft.hair} onChange={(v) => patch('hair', v)} />
                    <ColorField label="Outfit" value={draft.outfit} onChange={(v) => patch('outfit', v)} />
                    <ColorField label="Outfit secondary" value={draft.outfitSecondary} onChange={(v) => patch('outfitSecondary', v)} />
                    <ColorField label="Accent / neon" value={draft.accent} onChange={(v) => patch('accent', v)} />
                    <ColorField label="Trousers" value={draft.trousers} onChange={(v) => patch('trousers', v)} />
                    <ColorField label="Shoes" value={draft.shoes} onChange={(v) => patch('shoes', v)} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Hair style" hint="Procedural mesh">
                      <select className="input" value={draft.hairStyle} onChange={(e) => patch('hairStyle', e.target.value as HairStyle)}>
                        {HAIR_OPTIONS.map((h) => (
                          <option key={h.id} value={h.id}>{h.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Accessory" hint="Attached to the rig">
                      <select className="input" value={draft.accessory} onChange={(e) => patch('accessory', e.target.value as Accessory)}>
                        {ACCESSORY_OPTIONS.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-3 rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
                    <p className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Body scale <span className="font-display text-lg text-cyan-200">{draft.bodyScale.toFixed(2)}×</span>
                    </p>
                    <input
                      type="range"
                      min={LIMITS.bodyScale.min}
                      max={LIMITS.bodyScale.max}
                      step={0.01}
                      value={draft.bodyScale}
                      onChange={(e) => patch('bodyScale', Number(e.target.value))}
                      onMouseUp={() => audio.play('select')}
                    />
                    <p className="mt-1 text-[0.55rem] text-slate-600">
                      Body scale affects width/depth, not combat reach or health. Allowed {LIMITS.bodyScale.min}–{LIMITS.bodyScale.max}.
                    </p>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                    <Shirt size={14} className="mt-0.5 shrink-0 text-slate-500" />
                    <p className="text-[0.6rem] leading-snug text-slate-500">
                      Want a photo or a custom GLB model? Drop it in <code className="text-slate-300">public/assets/characters/{selected}/</code> and
                      set <code className="text-slate-300">modelUrl</code> in the fighter's override. The modular renderer will load it automatically.
                    </p>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-sm border border-red-400/30 bg-red-500/10 p-2.5">
                  {errors.map((error) => (
                    <p key={error} className="flex items-center gap-1.5 text-[0.62rem] font-semibold text-red-200">
                      <Swords size={10} /> {error}
                    </p>
                  ))}
                </div>
              )}

              <div className="panel-soft sticky bottom-2 flex flex-wrap items-center justify-between gap-2 rounded-sm p-2.5 backdrop-blur-md">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {dirty ? 'Unsaved changes' : 'All changes saved locally'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={discard}
                    disabled={!dirty}
                    className="btn btn-ghost px-3 py-2 text-xs"
                  >
                    <RotateCcw size={12} /> Discard
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    disabled={errors.length > 0 || !dirty}
                    className="btn btn-primary px-4 py-2 text-xs"
                  >
                    <Save size={13} /> Apply changes
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-sm border border-slate-700/50 bg-slate-950/40 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-600">
                  <FlaskConical size={11} /> Preview updates live. Persistence happens on Apply.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    audio.play('back')
                    setScreen('menu')
                  }}
                  className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
