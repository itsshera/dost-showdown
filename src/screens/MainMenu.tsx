import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  Globe2,
  Maximize2,
  Play,
  Settings as SettingsIcon,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  Dumbbell,
  Cpu,
  Gamepad2,
} from 'lucide-react'
import { MenuScene } from '../components/MenuScene'
import { NeonButton } from '../components/NeonButton'
import { useNavStore } from '../store/useNavStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useRosterStore } from '../store/useRosterStore'
import { getCharacter } from '../data/characters'
import { audio } from '../audio/AudioEngine'
import type { GameMode } from '../types'

const MENU_ITEMS = [
  { id: 'play', label: 'PLAY', sub: 'CHOOSE YOUR BATTLE', icon: Play, accent: '#a855f7' },
  { id: 'select', label: 'CHARACTER SELECT', sub: 'FIVE FIGHTERS. ZERO CHILL.', icon: Users, accent: '#22d3ee' },
  { id: 'powerlab', label: 'POWER LAB', sub: 'BUILD SOMETHING RIDICULOUS', icon: FlaskConical, accent: '#f472b6' },
  { id: 'howto', label: 'HOW TO PLAY', sub: 'CONTROLS + COMBAT SYSTEM', icon: BookOpen, accent: '#fbbf24' },
  { id: 'settings', label: 'SETTINGS', sub: 'AUDIO / GRAPHICS / GAME', icon: SettingsIcon, accent: '#94a3b8' },
] as const

const MODE_OPTIONS: {
  mode: GameMode
  title: string
  description: string
  icon: typeof Cpu
  accent: string
  badge: string
}[] = [
  {
    mode: 'solo',
    title: 'SOLO VS CPU',
    description: 'Fight the computer. Four difficulty levels, from warm-up to absolutely unfair.',
    icon: Cpu,
    accent: '#a855f7',
    badge: '1 PLAYER',
  },
  {
    mode: 'local',
    title: 'LOCAL MULTIPLAYER',
    description: 'Two players, one keyboard, zero excuses. Share the screen and the blame.',
    icon: Gamepad2,
    accent: '#22d3ee',
    badge: '2 PLAYERS',
  },
  {
    mode: 'training',
    title: 'TRAINING ROOM',
    description: 'A patient dummy, full meter and no timer. Learn the combos before you flex.',
    icon: Dumbbell,
    accent: '#a3e635',
    badge: 'PRACTICE',
  },
  {
    mode: 'online',
    title: 'ONLINE ARENA',
    description: 'Create a private room and share the code. Authoritative server, real matches.',
    icon: Globe2,
    accent: '#f472b6',
    badge: 'ONLINE',
  },
]

function Logo() {
  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-300/70" />
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.42em] text-cyan-200/80">
          Friends Edition
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-cyan-300/40 to-transparent" />
      </div>
      <h1 className="font-display leading-[0.76]">
        <span className="logo-gradient block text-[clamp(4.2rem,11vw,8.8rem)]">DOST</span>
        <span className="logo-gradient-blue block text-[clamp(3.4rem,9.6vw,7.6rem)]">SHOWDOWN</span>
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="chip border-purple-400/30 bg-purple-500/10 text-purple-200">3D ARCADE FIGHTER</span>
        <span className="chip">5 FIGHTERS</span>
        <span className="chip">3 ARENAS</span>
      </div>
    </div>
  )
}

export function MainMenu() {
  const setScreen = useNavStore((s) => s.setScreen)
  const setSelectMode = useNavStore((s) => s.setSelectMode)
  const startGame = useNavStore((s) => s.startGame)
  const session = useNavStore((s) => s.session)
  const wins = useProgressionStore((s) => s.wins)
  const losses = useProgressionStore((s) => s.losses)
  const streak = useProgressionStore((s) => s.streak)
  const bestStreak = useProgressionStore((s) => s.bestStreak)
  const muted = useSettingsStore((s) => s.muted)
  const updateSettings = useSettingsStore((s) => s.update)
  const overrides = useRosterStore((s) => s.overrides)
  const [showModes, setShowModes] = useState(false)

  useEffect(() => {
    audio.startMusic('menu')
  }, [])

  const dailyCharacter = getCharacter('varya', overrides)
  const quote = dailyCharacter.quote

  const handleMenu = (id: (typeof MENU_ITEMS)[number]['id']) => {
    if (id === 'play') {
      setShowModes(true)
      return
    }
    if (id === 'select') {
      setSelectMode('solo')
      setScreen('select')
      return
    }
    if (id === 'powerlab') return setScreen('powerlab')
    if (id === 'howto') return setScreen('howto')
    if (id === 'settings') return setScreen('settings')
  }

  const chooseMode = (mode: GameMode) => {
    if (mode === 'online') {
      setShowModes(false)
      setScreen('online')
      return
    }
    if (mode === 'training') {
      setShowModes(false)
      startGame({
        mode: 'training',
        p1: session.p1,
        p2: session.p2,
        arena: session.arena,
        difficulty: 'medium',
      })
      return
    }
    setSelectMode(mode === 'local' ? 'local' : 'solo')
    setShowModes(false)
    setScreen('select')
  }

  return (
    <div className="screen vignette scanlines">
      <MenuScene />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05060f] via-[#05060f]/88 to-[#05060f]/10 md:via-[#05060f]/72" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-[#05060f]/45" />

      <div className="relative z-10 flex h-full flex-col p-4 sm:p-6 md:p-9 lg:p-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-purple-400/40 bg-purple-500/10">
              <Swords size={17} className="text-purple-300" />
            </span>
            <div>
              <p className="font-display text-lg leading-none tracking-[0.18em] text-slate-100">DOST SHOWDOWN</p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Indie Arcade Division
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              onClick={() => {
                updateSettings({ muted: !muted })
                audio.play('select')
              }}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/60 text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              aria-label="Toggle fullscreen"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen()
                else void document.documentElement.requestFullscreen().catch(() => undefined)
              }}
              className="hidden h-9 w-9 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/60 text-slate-300 transition hover:border-cyan-400/50 hover:text-white sm:flex"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[30rem] py-4 md:py-0">
            <Logo />

            <div className="mt-7 space-y-2 md:mt-9">
              {MENU_ITEMS.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => audio.play('hover')}
                    onClick={() => handleMenu(item.id)}
                    className="menu-btn group"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-700/50 bg-slate-950/50"
                      style={{ color: item.accent }}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="font-display text-[1.35rem] leading-none tracking-[0.1em] text-slate-100 transition group-hover:text-white">
                          {item.label}
                        </span>
                        <span className="font-display text-[0.7rem] text-slate-600">
                          0{index + 1}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {item.sub}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScreen('online')}
                className="chip border-pink-400/25 bg-pink-500/10 text-pink-200 transition hover:border-pink-300/60"
              >
                <Globe2 size={12} /> Online Arena
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectMode('local')
                  setScreen('select')
                }}
                className="chip border-cyan-400/25 bg-cyan-500/10 text-cyan-200 transition hover:border-cyan-300/60"
              >
                <Users size={12} /> Local 2P
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-auto grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4 lg:max-w-[38rem]">
          {[
            { label: 'WINS', value: wins, color: '#4ade80' },
            { label: 'LOSSES', value: losses, color: '#f87171' },
            { label: 'STREAK', value: streak, color: '#22d3ee' },
            { label: 'BEST STREAK', value: bestStreak, color: '#fbbf24' },
          ].map((stat) => (
            <div key={stat.label} className="panel-soft rounded-sm px-3 py-2">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
              <p className="font-display text-2xl leading-tight" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </footer>

        <div className="mt-3 hidden items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-600 md:flex">
          <span>“{quote}”</span>
          <span className="flex items-center gap-1.5">
            <Trophy size={11} /> v1.0 // Friends Build
          </span>
        </div>
      </div>

      {showModes && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#03040a]/80 p-4 backdrop-blur-md">
          <div className="panel panel-accent relative w-full max-w-3xl rounded-lg p-5 sm:p-7">
            <button
              type="button"
              onClick={() => {
                audio.play('back')
                setShowModes(false)
              }}
              className="absolute right-4 top-4 text-slate-500 transition hover:text-white"
              aria-label="Close mode selection"
            >
              <X size={20} />
            </button>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.36em] text-purple-300/80">Select your battle</p>
            <h2 className="font-display text-4xl tracking-[0.08em] text-white sm:text-5xl">HOW DO YOU WANT TO THROW DOWN?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {MODE_OPTIONS.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.mode}
                    type="button"
                    onMouseEnter={() => audio.play('hover')}
                    onClick={() => chooseMode(mode.mode)}
                    className="group relative overflow-hidden rounded-sm border border-slate-700/60 bg-slate-950/60 p-4 text-left transition hover:-translate-y-1 hover:border-slate-500/80"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-0.5 opacity-60 transition group-hover:opacity-100"
                      style={{ background: `linear-gradient(90deg, ${mode.accent}, transparent)` }}
                    />
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border"
                        style={{ borderColor: `${mode.accent}55`, color: mode.accent, background: `${mode.accent}12` }}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl tracking-[0.08em] text-slate-100">{mode.title}</h3>
                          <span className="chip px-1.5 py-0.5 text-[0.5rem]">{mode.badge}</span>
                        </div>
                        <p className="mt-1 text-sm leading-snug text-slate-400">{mode.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Best of three by default. Change rounds, timer and difficulty in Settings.
              </p>
              <NeonButton
                variant="ghost"
                sound="back"
                onClick={() => setShowModes(false)}
                className="px-4 py-2 text-xs"
              >
                Back
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
