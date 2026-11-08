import { useEffect } from 'react'
import {
  ArrowLeft,
  Clock,
  Crown,
  Flame,
  Home,
  MapPin,
  RotateCcw,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { CharacterPreview } from '../components/CharacterPreview'
import { FighterPortrait } from '../components/FighterPortrait'
import { NeonButton } from '../components/NeonButton'
import { getCharacter } from '../data/characters'
import { arenaById } from '../data/arenas'
import { useNavStore } from '../store/useNavStore'
import { useRosterStore } from '../store/useRosterStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { audio } from '../audio/AudioEngine'

const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export function Results() {
  const result = useNavStore((s) => s.lastResult)
  const rematch = useNavStore((s) => s.rematch)
  const setScreen = useNavStore((s) => s.setScreen)
  const setSelectMode = useNavStore((s) => s.setSelectMode)
  const overrides = useRosterStore((s) => s.overrides)
  const wins = useProgressionStore((s) => s.wins)
  const losses = useProgressionStore((s) => s.losses)
  const streak = useProgressionStore((s) => s.streak)
  const history = useProgressionStore((s) => s.history)

  useEffect(() => {
    audio.startMusic('menu')
  }, [])

  if (!result) {
    return (
      <div className="screen grid-bg flex items-center justify-center bg-[#05060f] p-4">
        <div className="panel rounded-lg p-8 text-center">
          <p className="font-display text-4xl text-white">NO MATCH DATA</p>
          <p className="mt-2 text-sm text-slate-400">Run a fight first. The arena is waiting.</p>
          <NeonButton className="mt-5 px-5 py-3" onClick={() => setScreen('menu')} icon={<Home size={16} />}>
            Main Menu
          </NeonButton>
        </div>
      </div>
    )
  }

  const p1 = getCharacter(result.p1, overrides)
  const p2 = getCharacter(result.p2, overrides)
  const arena = arenaById(result.arena)
  const winner = result.winner === 1 ? p1 : p2
  const loser = result.winner === 1 ? p2 : p1
  const isLocal = result.mode === 'local'
  const playerWon = result.winner === 1
  const headline = isLocal ? `PLAYER ${result.winner} WINS` : playerWon ? 'VICTORY' : 'DEFEAT'
  const subline = isLocal
    ? `${winner.nickname} takes the set`
    : playerWon
      ? `${p1.nickname} stands tall`
      : `${p2.nickname} had your number`

  const backToSelect = () => {
    audio.play('back')
    setSelectMode(isLocal ? 'local' : 'solo')
    setScreen('select')
  }

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="arcade-scroll relative z-10 h-full overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto flex min-h-full max-w-6xl flex-col">
          <header className="flex items-center justify-between gap-3">
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
            <div className="text-right">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.32em] text-slate-500">Match complete</p>
              <p className="font-display text-xl leading-none tracking-[0.1em] text-slate-200">RESULTS</p>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-4">
            <div className="text-center">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-cyan-200/70">{arena.name}</p>
              <h1
                className={`font-display text-6xl leading-none tracking-[0.06em] sm:text-8xl ${
                  isLocal || playerWon ? 'text-emerald-300' : 'text-red-400'
                } neon-title`}
              >
                {headline}
              </h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{subline}</p>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
              <div className="text-center">
                <CharacterPreview
                  character={p1}
                  state={result.winner === 1 ? 'victory' : 'defeat'}
                  className="mx-auto h-[12rem] w-full sm:h-[18rem]"
                  autoRotate={false}
                />
                <div className="mx-auto mt-1 flex max-w-[16rem] items-center gap-2 rounded-sm border border-slate-700/50 bg-slate-950/60 p-1.5 text-left">
                  <FighterPortrait character={p1} className="h-10 w-10 shrink-0 rounded-sm" mood={result.winner === 1 ? 'happy' : 'hurt'} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-none text-white">{p1.nickname}</p>
                    <p className="truncate text-[0.55rem] font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Player 1 {result.winner === 1 && <Crown size={9} className="inline" />}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="rounded-sm border border-slate-600/50 bg-slate-950/80 px-3 py-2 text-center">
                  <p className="font-display text-4xl leading-none tracking-[0.08em] text-white sm:text-5xl">
                    {result.score[0]} <span className="text-slate-600">—</span> {result.score[1]}
                  </p>
                  <p className="mt-1 text-[0.5rem] font-bold uppercase tracking-[0.2em] text-slate-500">Rounds</p>
                </div>
                <Swords size={18} className="mt-2 text-slate-600" />
              </div>

              <div className="text-center">
                <CharacterPreview
                  character={p2}
                  state={result.winner === 2 ? 'victory' : 'defeat'}
                  className="mx-auto h-[12rem] w-full sm:h-[18rem]"
                  autoRotate={false}
                />
                <div className="mx-auto mt-1 flex max-w-[16rem] items-center gap-2 rounded-sm border border-slate-700/50 bg-slate-950/60 p-1.5 text-left">
                  <FighterPortrait character={p2} className="h-10 w-10 shrink-0 rounded-sm" mood={result.winner === 2 ? 'happy' : 'hurt'} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-none text-white">{p2.nickname}</p>
                    <p className="truncate text-[0.55rem] font-bold uppercase tracking-[0.16em] text-pink-300">
                      {isLocal ? 'Player 2' : 'CPU'} {result.winner === 2 && <Crown size={9} className="inline" />}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Fight time', value: formatDuration(result.duration), color: '#22d3ee' },
                { icon: Flame, label: 'Max combo', value: `${result.maxCombo} hits`, color: '#fbbf24' },
                { icon: MapPin, label: 'Arena', value: arena.name, color: arena.accent },
                { icon: Trophy, label: 'Mode', value: isLocal ? 'Local 2P' : result.difficulty.toUpperCase(), color: '#a855f7' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="panel-soft rounded-sm p-2.5">
                    <p className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                      <Icon size={10} style={{ color: item.color }} /> {item.label}
                    </p>
                    <p className="mt-0.5 truncate font-display text-lg leading-none tracking-[0.03em]" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-2 sm:flex-row">
              <NeonButton onClick={() => { audio.play('select'); rematch() }} className="flex-1 px-4 py-3" icon={<RotateCcw size={16} />} subtitle="Run it back">
                Rematch
              </NeonButton>
              <NeonButton onClick={backToSelect} variant="ghost" className="flex-1 px-4 py-3" icon={<Users size={16} />} subtitle="Change fighters">
                Character Select
              </NeonButton>
              <NeonButton
                onClick={() => {
                  audio.play('back')
                  setScreen('menu')
                }}
                variant="ghost"
                className="flex-1 px-4 py-3"
                icon={<Home size={16} />}
                subtitle="Back to title"
              >
                Main Menu
              </NeonButton>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-3xl gap-2 sm:grid-cols-2">
              <div className="panel-soft rounded-sm p-3">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">Career record</p>
                <div className="mt-1.5 flex items-center gap-4">
                  <div>
                    <p className="font-display text-2xl leading-none text-emerald-300">{wins}</p>
                    <p className="text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-600">Wins</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl leading-none text-red-400">{losses}</p>
                    <p className="text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-600">Losses</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl leading-none text-amber-300">{streak}</p>
                    <p className="text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-600">Streak</p>
                  </div>
                  <p className="ml-auto hidden max-w-[10rem] text-right text-[0.62rem] leading-snug text-slate-500 sm:block">
                    {winner.quote}
                  </p>
                </div>
              </div>

              <div className="panel-soft rounded-sm p-3">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">Recent matches</p>
                <div className="mt-1 space-y-1">
                  {history.slice(0, 3).map((match) => {
                    const c = getCharacter(match.playerCharacter, overrides)
                    return (
                      <div key={match.id} className="flex items-center gap-2 text-[0.62rem]">
                        <span className={`h-1.5 w-1.5 rounded-full ${match.won ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="truncate font-semibold uppercase tracking-[0.1em] text-slate-300">{c.nickname}</span>
                        <span className="ml-auto shrink-0 font-display text-sm text-slate-400">{match.score}</span>
                        <span className={`shrink-0 text-[0.5rem] font-bold uppercase tracking-[0.14em] ${match.won ? 'text-emerald-300' : 'text-red-300'}`}>
                          {match.won ? 'W' : 'L'}
                        </span>
                      </div>
                    )
                  })}
                  {history.length === 0 && <p className="text-[0.62rem] text-slate-600">No matches recorded yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
