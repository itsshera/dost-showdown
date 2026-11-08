import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Cpu,
  Gamepad2,
  MapPin,
  Shuffle,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import type { ArenaId, CharacterId, Difficulty } from '../types'
import { ARENAS } from '../data/arenas'
import { CHARACTER_IDS, RANGE_LABEL, getCharacter } from '../data/characters'
import { CharacterPreview } from '../components/CharacterPreview'
import { FighterPortrait } from '../components/FighterPortrait'
import { StatBar } from '../components/StatBar'
import { NeonButton } from '../components/NeonButton'
import { useNavStore } from '../store/useNavStore'
import { useRosterStore } from '../store/useRosterStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { audio } from '../audio/AudioEngine'

const DIFFICULTIES: { id: Difficulty; label: string; hint: string; color: string }[] = [
  { id: 'easy', label: 'EASY', hint: 'Warm-up', color: '#4ade80' },
  { id: 'medium', label: 'MEDIUM', hint: 'Fair fight', color: '#22d3ee' },
  { id: 'hard', label: 'HARD', hint: 'Bring combos', color: '#fbbf24' },
  { id: 'insane', label: 'INSANE', hint: 'No mercy', color: '#f87171' },
]

export function CharacterSelect() {
  const setScreen = useNavStore((s) => s.setScreen)
  const startGame = useNavStore((s) => s.startGame)
  const selectMode = useNavStore((s) => s.selectMode)
  const setSelectMode = useNavStore((s) => s.setSelectMode)
  const session = useNavStore((s) => s.session)
  const overrides = useRosterStore((s) => s.overrides)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const roundsToWin = useSettingsStore((s) => s.roundsToWin)
  const roundSeconds = useSettingsStore((s) => s.roundSeconds)
  const voiceLines = useSettingsStore((s) => s.voiceLines)
  const updateSettings = useSettingsStore((s) => s.update)
  const byCharacter = useProgressionStore((s) => s.byCharacter)

  const [p1, setP1] = useState<CharacterId>(session.p1)
  const [p2, setP2] = useState<CharacterId>(session.p2)
  const [activeSlot, setActiveSlot] = useState<'p1' | 'p2'>('p1')
  const [arena, setArena] = useState<ArenaId>(session.arena)
  const [showVs, setShowVs] = useState(false)
  // Phones render only the selected fighter in 3D; the rest use the SVG
  // portrait. Five live WebGL canvases is needlessly heavy on mobile GPUs.
  const [compact, setCompact] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches === true),
  )

  useEffect(() => {
    const update = () =>
      setCompact(window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches === true)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const characters = useMemo(
    () => CHARACTER_IDS.map((id) => getCharacter(id, overrides)),
    [overrides],
  )
  const characterMap = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c])) as Record<CharacterId, ReturnType<typeof getCharacter>>,
    [characters],
  )

  const selectedId = activeSlot === 'p1' ? p1 : p2
  const selected = characterMap[selectedId]
  const arenaDef = ARENAS.find((a) => a.id === arena) ?? ARENAS[0]
  const mode = selectMode
  const record = byCharacter[selectedId]

  useEffect(() => {
    audio.startMusic('menu')
  }, [])

  useEffect(() => {
    if (!showVs) return
    const timer = window.setTimeout(() => {
      startGame({
        mode: mode === 'local' ? 'local' : 'solo',
        p1,
        p2,
        arena,
        difficulty,
      })
    }, 2700)
    return () => window.clearTimeout(timer)
  }, [showVs, mode, p1, p2, arena, difficulty, startGame])

  const chooseCharacter = (id: CharacterId) => {
    if (activeSlot === 'p1') setP1(id)
    else setP2(id)
    audio.play('select')
    if (voiceLines) audio.speak(characterMap[id].dialogue, id, 0.8)
  }

  const randomise = (slot: 'p1' | 'p2') => {
    const current = slot === 'p1' ? p1 : p2
    const pool = CHARACTER_IDS.filter((id) => id !== current)
    const id = pool[Math.floor(Math.random() * pool.length)] ?? 'anay'
    if (slot === 'p1') setP1(id)
    else setP2(id)
    audio.play('select')
    if (voiceLines) audio.speak(characterMap[id].dialogue, id, 0.8)
  }

  const begin = () => {
    audio.play('select')
    audio.play('announce')
    if (voiceLines) {
      audio.speak(characterMap[p1].dialogue, p1, 0.85)
    }
    setShowVs(true)
  }

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.12),transparent_50%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 bg-[#05060f]/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
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
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.34em] text-purple-300/80">
                Step 01 // Pick your fighter
              </p>
              <h1 className="font-display text-2xl leading-none tracking-[0.08em] text-white sm:text-3xl">
                CHARACTER SELECT
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-sm border border-slate-700/70 bg-slate-950/70 p-1">
              <button
                type="button"
                onClick={() => {
                  setSelectMode('solo')
                  audio.play('select')
                }}
                className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition ${
                  mode === 'solo' ? 'bg-purple-500/25 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu size={13} /> Solo vs CPU
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectMode('local')
                  audio.play('select')
                }}
                className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition ${
                  mode === 'local' ? 'bg-cyan-500/25 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={13} /> Local 2P
              </button>
            </div>
          </div>
        </header>

        <div className="arcade-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-[92rem] space-y-4">
            {/* Slots */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
              {(['p1', 'p2'] as const).map((slot, index) => {
                const id = slot === 'p1' ? p1 : p2
                const character = characterMap[id]
                const active = activeSlot === slot
                const accent = slot === 'p1' ? '#22d3ee' : '#f472b6'
                return (
                  <div key={slot} className={index === 1 ? 'order-3' : 'order-1'}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlot(slot)
                        audio.play('hover')
                      }}
                      className={`panel relative flex w-full items-center gap-3 overflow-hidden rounded-sm p-2.5 text-left transition sm:p-3 ${
                        active ? 'ring-1' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: active ? `${accent}88` : undefined,
                        boxShadow: active ? `0 0 26px ${accent}22` : undefined,
                      }}
                    >
                      <span
                        className="absolute inset-x-0 top-0 h-0.5"
                        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                      />
                      <FighterPortrait character={character} className="h-14 w-14 shrink-0 rounded-sm sm:h-16 sm:w-16" mood={active ? 'angry' : 'neutral'} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>
                          {slot === 'p1' ? (mode === 'solo' ? 'P1 // YOU' : 'PLAYER 1') : mode === 'solo' ? 'CPU // OPPONENT' : 'PLAYER 2'}
                        </p>
                        <p className="truncate font-display text-lg leading-tight tracking-[0.05em] text-white sm:text-xl">
                          {character.nickname}
                        </p>
                        <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {character.name}
                        </p>
                      </div>
                      <span className="hidden shrink-0 items-center gap-1 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-slate-500 sm:flex">
                        {active ? <Check size={13} style={{ color: accent }} /> : 'Select'}
                      </span>
                    </button>
                  </div>
                )
              })}
              <div className="order-2 flex flex-col items-center justify-center px-1">
                <span className="font-display text-2xl leading-none text-slate-600 sm:text-3xl">VS</span>
                <span className="mt-1 hidden text-[0.5rem] font-bold uppercase tracking-[0.2em] text-slate-600 sm:block">
                  {arenaDef.name}
                </span>
              </div>
            </div>

            {/* Fighter cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
              {characters.map((character) => {
                const isP1 = character.id === p1
                const isP2 = character.id === p2
                return (
                  <button
                    key={character.id}
                    type="button"
                    onMouseEnter={() => audio.play('hover')}
                    onClick={() => chooseCharacter(character.id)}
                    className={`card-select group rounded-sm text-left ${
                      isP1 ? 'selected-p1' : ''
                    } ${isP2 ? 'selected-p2' : ''}`}
                  >
                    <div className="relative h-[10.5rem] overflow-hidden sm:h-[11.5rem] lg:h-[12.5rem]">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                          background: `radial-gradient(circle at 50% 72%, ${character.color}38, transparent 65%)`,
                        }}
                      />
                      {compact && selectedId !== character.id ? (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-7">
                          <FighterPortrait
                            character={character}
                            className="h-24 w-24 rounded-sm opacity-95 sm:h-28 sm:w-28"
                            mood={isP1 || isP2 ? 'angry' : 'neutral'}
                          />
                        </div>
                      ) : (
                        <CharacterPreview
                          character={character}
                          className="absolute inset-0"
                          autoRotate={selectedId === character.id}
                        />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070912] to-transparent" />
                      <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {isP1 && (
                          <span className="rounded-sm border border-cyan-300/50 bg-cyan-500/20 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-cyan-100">
                            P1
                          </span>
                        )}
                        {isP2 && (
                          <span className="rounded-sm border border-pink-300/50 bg-pink-500/20 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-pink-100">
                            {mode === 'solo' ? 'CPU' : 'P2'}
                          </span>
                        )}
                      </div>
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border border-slate-600/60 bg-slate-950/70 text-slate-400 transition group-hover:border-cyan-400/60 group-hover:text-cyan-200">
                        <ChevronRight size={14} />
                      </span>
                    </div>
                    <div className="relative px-2.5 pb-2.5 pt-2">
                      <p className="truncate font-display text-lg leading-none tracking-[0.06em] text-white">
                        {character.nickname}
                      </p>
                      <p className="mt-1 truncate text-[0.56rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {character.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className="truncate text-[0.52rem] font-bold uppercase tracking-[0.12em]"
                          style={{ color: character.accent }}
                        >
                          {character.power.name}
                        </span>
                        <span className="flex shrink-0 gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className="h-1 w-2 rounded-full"
                              style={{
                                background: i < Math.round(character.stats.power / 2) ? character.accent : '#1e293b',
                              }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Details + setup */}
            <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
              <div className="panel panel-accent rounded-sm p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FighterPortrait character={selected} className="h-16 w-16 shrink-0 rounded-sm sm:h-20 sm:w-20" mood="angry" />
                    <div className="min-w-0">
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.28em] text-slate-500">
                        {selected.tagline}
                      </p>
                      <h2 className="font-display text-3xl leading-none tracking-[0.06em] text-white sm:text-4xl">
                        {selected.nickname}
                      </h2>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em]" style={{ color: selected.accent }}>
                        {selected.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="chip border-slate-600/40">
                      <Trophy size={11} /> {record?.wins ?? 0}W / {record?.losses ?? 0}L
                    </span>
                    <button
                      type="button"
                      onClick={() => randomise(activeSlot)}
                      className="chip border-purple-400/30 bg-purple-500/10 text-purple-200 transition hover:border-purple-300/60"
                    >
                      <Shuffle size={11} /> Random
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-snug text-slate-400">{selected.description}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.24em] text-slate-500">Combat stats</p>
                    <StatBar label="Power" value={selected.stats.power} color="#f472b6" compact />
                    <StatBar label="Speed" value={selected.stats.speed} color="#22d3ee" compact />
                    <StatBar label="Defense" value={selected.stats.defense} color="#4ade80" compact />
                    <StatBar label="Technique" value={selected.stats.technique} color="#a855f7" compact />
                    <StatBar label="Chaos" value={selected.stats.chaos} color="#fbbf24" compact />
                  </div>
                  <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
                    <p className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                      <Zap size={12} style={{ color: selected.accent }} /> Signature power
                    </p>
                    <p className="mt-1 font-display text-2xl leading-none tracking-[0.05em]" style={{ color: selected.accent }}>
                      {selected.power.name}
                    </p>
                    <p className="mt-1.5 text-xs leading-snug text-slate-400">{selected.power.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="chip px-1.5 py-0.5 text-[0.5rem]">{selected.power.damage} DMG</span>
                      <span className="chip px-1.5 py-0.5 text-[0.5rem]">{RANGE_LABEL[selected.power.range]}</span>
                      <span className="chip px-1.5 py-0.5 text-[0.5rem]">{selected.power.cooldown}s CD</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="panel rounded-sm p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-slate-400">
                      <MapPin size={12} /> Arena
                    </p>
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {arenaDef.subtitle}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {ARENAS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setArena(a.id)
                          audio.play('select')
                        }}
                        className={`rounded-sm border px-2 py-2 text-left transition ${
                          arena === a.id
                            ? 'border-slate-400/60 bg-slate-800/70'
                            : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                        }`}
                        style={arena === a.id ? { boxShadow: `inset 0 0 18px ${a.accent}22` } : undefined}
                      >
                        <span className="block h-0.5 w-6 rounded-full" style={{ background: a.accent }} />
                        <span className="mt-1.5 block font-display text-sm leading-tight tracking-[0.04em] text-slate-100">
                          {a.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.68rem] leading-snug text-slate-500">{arenaDef.description}</p>
                </div>

                {mode === 'solo' && (
                  <div className="panel rounded-sm p-4">
                    <p className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-slate-400">
                      <Cpu size={12} /> CPU difficulty
                    </p>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            updateSettings({ difficulty: d.id })
                            audio.play('select')
                          }}
                          className={`rounded-sm border px-1 py-1.5 text-center transition ${
                            difficulty === d.id
                              ? 'border-slate-400/60 bg-slate-800/70'
                              : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                          }`}
                        >
                          <span className="block font-display text-sm leading-none" style={{ color: d.color }}>
                            {d.label}
                          </span>
                          <span className="mt-1 block text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-slate-600">
                            {d.hint}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="panel rounded-sm p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.24em] text-slate-400">Match rules</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Best of {roundsToWin * 2 - 1} · {roundSeconds}s rounds · {mode === 'local' ? 'local 2P' : 'solo vs CPU'}
                      </p>
                    </div>
                    <Swords size={18} className="text-slate-600" />
                  </div>
                  <NeonButton
                    onClick={begin}
                    className="mt-3 w-full px-4 py-3 text-base"
                    icon={<Swords size={18} />}
                    subtitle={`${characterMap[p1].nickname} vs ${characterMap[p2].nickname}`}
                  >
                    Start Fight
                  </NeonButton>
                  <p className="mt-2 text-center text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {mode === 'solo' ? 'WASD + J K L + SHIFT' : 'P1: WASD/JKL/SHIFT · P2: ARROWS/NUMPAD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVs && (
        <div className="absolute inset-0 z-40 overflow-hidden bg-[#03040a]/92 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.28),transparent_60%)]" />
          <div className="relative flex h-full flex-col items-center justify-center p-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.45em] text-cyan-200/80">Next match</p>
            <div className="mt-3 grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
              <div className="vs-side-left text-center">
                <CharacterPreview character={characterMap[p1]} className="mx-auto h-[15rem] w-full sm:h-[22rem]" autoRotate={false} />
                <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.28em] text-cyan-300">
                  {mode === 'solo' ? 'Player 1' : 'Player 1'}
                </p>
                <p className="font-display text-3xl leading-none tracking-[0.05em] text-white sm:text-5xl">
                  {characterMap[p1].nickname}
                </p>
                <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {characterMap[p1].name}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="vs-flash font-display text-5xl leading-none text-white sm:text-8xl">VS</span>
                <span className="mt-2 hidden text-center text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-500 sm:block">
                  {arenaDef.name}
                </span>
              </div>
              <div className="vs-side-right text-center">
                <CharacterPreview character={characterMap[p2]} className="mx-auto h-[15rem] w-full sm:h-[22rem]" autoRotate={false} />
                <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.28em] text-pink-300">
                  {mode === 'solo' ? 'CPU Opponent' : 'Player 2'}
                </p>
                <p className="font-display text-3xl leading-none tracking-[0.05em] text-white sm:text-5xl">
                  {characterMap[p2].nickname}
                </p>
                <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {characterMap[p2].name}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex items-center gap-1.5 chip border-purple-400/30 bg-purple-500/10 text-purple-200">
                <Sparkles size={12} /> {arenaDef.name}
              </span>
              <span className="flex items-center gap-1.5 chip">
                {mode === 'local' ? <Gamepad2 size={12} /> : <Cpu size={12} />}
                {mode === 'local' ? '2 Players' : difficulty.toUpperCase()}
              </span>
            </div>
            <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-slate-800">
              <div className="vs-progress h-full bg-gradient-to-r from-purple-500 to-cyan-400" />
            </div>
            <button
              type="button"
              onClick={() => {
                audio.play('back')
                setShowVs(false)
              }}
              className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-500 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
