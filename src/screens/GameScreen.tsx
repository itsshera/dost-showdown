import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dumbbell, Home, Pause, Play, RotateCcw, Shield, Swords, Volume2, VolumeX, X } from 'lucide-react'
import { CombatEngine } from '../game/engine/CombatEngine'
import { GameCanvas } from '../game/GameCanvas'
import { GameHUD } from '../game/GameHUD'
import { TouchControls } from '../game/TouchControls'
import { inputManager } from '../game/engine/input'
import { getCharacter } from '../data/characters'
import { audio, sfxForSpecial } from '../audio/AudioEngine'
import { useNavStore } from '../store/useNavStore'
import { useRosterStore } from '../store/useRosterStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { useHudStore } from '../store/useHudStore'
import type { MatchResult } from '../types'

export function GameScreen() {
  const session = useNavStore((s) => s.session)
  const finishMatch = useNavStore((s) => s.finishMatch)
  const setScreen = useNavStore((s) => s.setScreen)
  const overrides = useRosterStore((s) => s.overrides)
  const settings = useSettingsStore()
  const recordMatch = useProgressionStore((s) => s.recordMatch)
  const setHud = useHudStore((s) => s.setHud)
  const hud = useHudStore((s) => s.hud)

  const [paused, setPaused] = useState(false)
  const [matchKey, setMatchKey] = useState(0)
  const [dummyBlock, setDummyBlock] = useState(false)
  const [showTouch, setShowTouch] = useState(() => {
    if (!useSettingsStore.getState().showTouchControls) return false
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer: coarse)').matches === true || window.innerWidth < 900
  })
  const recorded = useRef(false)
  const hudTimer = useRef<number | null>(null)

  const engine = useMemo(() => {
    const p1 = getCharacter(session.p1, overrides)
    const p2 = getCharacter(session.p2, overrides)
    return new CombatEngine({
      mode: session.mode,
      p1,
      p2,
      difficulty: session.difficulty,
      roundsToWin: settings.roundsToWin,
      roundSeconds: session.mode === 'training' ? 0 : settings.roundSeconds,
      arena: session.arena,
    })
  }, [session.p1, session.p2, session.mode, session.arena, session.difficulty, overrides, settings.roundsToWin, settings.roundSeconds, matchKey])

  useEffect(() => {
    inputManager.attach()
    inputManager.setEnabled(true)
    inputManager.reset()
    audio.startMusic('fight')

    const timer = window.setInterval(() => {
      setHud(engine.getHud())
    }, 45)
    hudTimer.current = timer
    setHud(engine.getHud())

    return () => {
      if (hudTimer.current !== null) window.clearInterval(hudTimer.current)
      inputManager.setEnabled(false)
      inputManager.detach()
      audio.stopMusic()
      engine.destroy()
      useHudStore.getState().reset()
    }
  }, [engine, setHud])

  useEffect(() => {
    const unsubscribe = engine.onEvent((event) => {
      switch (event.type) {
        case 'hit': {
          const attacker = event.attacker === 'p1' ? engine.p1 : engine.p2
          const kind = attacker.attack?.spec.kind
          if (event.blocked) audio.play('block')
          else if (kind === 'special') audio.play(sfxForSpecial(attacker.character.power.sfx))
          else if (kind === 'kick') audio.play('kick')
          else audio.play('punch')
          break
        }
        case 'special': {
          const fighter = event.player === 'p1' ? engine.p1 : engine.p2
          audio.play(sfxForSpecial(fighter.character.power.sfx))
          break
        }
        case 'block':
          audio.play('block')
          break
        case 'jump':
          audio.play('jump')
          break
        case 'land':
          audio.play('land')
          break
        case 'whoosh':
          audio.play('whoosh')
          break
        case 'ko':
          audio.play('ko')
          break
        case 'denied':
          audio.play('denied')
          break
        case 'meterFull':
          audio.play('meterFull')
          break
        case 'announce':
          if (/^(FIGHT!|K\.O\.|TIME UP|[123])$/.test(event.text)) audio.play('announce')
          break
        case 'roundStart':
          audio.play('roundStart')
          break
        case 'roundEnd':
          if (event.winner !== 'draw') audio.play('victory')
          break
        case 'matchEnd': {
          const result = event.result as MatchResult
          if (session.mode === 'solo' && !recorded.current) {
            recorded.current = true
            recordMatch({
              id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              date: Date.now(),
              mode: session.mode,
              playerCharacter: result.p1,
              opponentCharacter: result.p2,
              arena: result.arena,
              won: result.winner === 1,
              score: `${result.score[0]}-${result.score[1]}`,
              difficulty: result.difficulty,
              duration: Math.round(result.duration),
              maxCombo: result.maxCombo,
            })
          }
          const winnerChar = result.winner === 1 ? engine.p1.character : engine.p2.character
          if (session.mode === 'local') audio.play('victory')
          else audio.play(result.winner === 1 ? 'victory' : 'defeat')
          if (settings.voiceLines) {
            audio.speak(
              result.winner === 1 ? winnerChar.victoryLine : engine.p1.character.defeatLine,
              result.winner === 1 ? winnerChar.id : engine.p1.character.id,
              0.9,
            )
          }
          finishMatch(result)
          break
        }
      }
    })
    return unsubscribe
  }, [engine, finishMatch, recordMatch, session.mode, settings.voiceLines])

  const togglePause = useCallback(() => {
    setPaused((value) => {
      const next = !value
      engine.setPaused(next)
      inputManager.setEnabled(!next)
      if (next) {
        inputManager.reset()
        audio.play('back')
      } else {
        audio.play('select')
      }
      return next
    })
  }, [engine])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !paused && engine.phase === 'fight') {
        engine.setPaused(true)
        inputManager.setEnabled(false)
        setPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [engine, paused])

  const restart = () => {
    audio.play('select')
    recorded.current = false
    setDummyBlock(false)
    setPaused(false)
    setMatchKey((key) => key + 1)
    useHudStore.getState().reset()
  }

  const quit = () => {
    audio.play('back')
    setScreen('menu')
  }

  return (
    <div className="screen vignette bg-[#05060f]">
      <GameCanvas engine={engine} arenaId={session.arena} quality={settings.graphics} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,3,10,0.5)_100%)]" />
      <GameHUD hud={hud} onPause={togglePause} />

      {hud.training && !paused && (
        <div className="absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-1.5 rounded-sm border border-lime-400/30 bg-slate-950/80 p-1.5 backdrop-blur-md sm:flex">
          <span className="flex items-center gap-1 px-1.5 text-[0.52rem] font-bold uppercase tracking-[0.18em] text-lime-300">
            <Dumbbell size={12} /> Training
          </span>
          <button
            type="button"
            onClick={() => {
              const next = !dummyBlock
              setDummyBlock(next)
              engine.setTrainingDummyBlock(next)
              audio.play('select')
            }}
            className={`flex items-center gap-1 rounded-sm border px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.14em] transition ${
              dummyBlock
                ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={11} /> Dummy block {dummyBlock ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => {
              engine.resetTraining()
              audio.play('select')
            }}
            className="flex items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-lime-400/50 hover:text-white"
          >
            <RotateCcw size={11} /> Reset dummy
          </button>
          <button
            type="button"
            onClick={() => {
              engine.p1.power = 100
              engine.p1.cooldown = 0
              audio.play('meterFull')
            }}
            className="flex items-center gap-1 rounded-sm border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.14em] text-amber-200 transition hover:border-amber-300/70"
          >
            <Swords size={11} /> Full meter
          </button>
        </div>
      )}

      {showTouch && !paused && <TouchControls hud={hud} />}

      {paused && (
        <div className="pause-blur absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="panel panel-accent w-full max-w-lg rounded-lg p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.34em] text-cyan-300/80">Match paused</p>
                <h2 className="font-display text-4xl leading-none tracking-[0.08em] text-white">TAKE A BREATH</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {engine.config.p1.nickname} vs {engine.config.p2.nickname} · Round {engine.round}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePause}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/60 text-slate-400 transition hover:text-white"
                aria-label="Resume match"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="btn btn-primary w-full px-4 py-3"
              >
                <Play size={16} /> Resume fight
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={restart} className="btn btn-ghost px-3 py-2 text-sm">
                  <RotateCcw size={14} /> Restart
                </button>
                <button type="button" onClick={quit} className="btn btn-ghost px-3 py-2 text-sm">
                  <Home size={14} /> Main menu
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-sm border border-slate-700/60 bg-slate-950/50 p-3">
              <p className="text-[0.56rem] font-bold uppercase tracking-[0.22em] text-slate-500">Controls</p>
              <div className="mt-2 grid gap-1 text-[0.62rem] text-slate-400 sm:grid-cols-2">
                <span><b className="text-slate-200">P1</b> · WASD move · J punch · K kick · L special · Shift block</span>
                <span><b className="text-slate-200">P2</b> · Arrows move · Numpad 1/2/3 · 0 block</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => useSettingsStore.getState().update({ screenShake: !settings.screenShake })}
                  className={`chip transition ${settings.screenShake ? 'border-cyan-400/40 text-cyan-200' : 'text-slate-500'}`}
                >
                  Screen shake {settings.screenShake ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  onClick={() => useSettingsStore.getState().update({ damageNumbers: !settings.damageNumbers })}
                  className={`chip transition ${settings.damageNumbers ? 'border-cyan-400/40 text-cyan-200' : 'text-slate-500'}`}
                >
                  Damage numbers {settings.damageNumbers ? 'on' : 'off'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    useSettingsStore.getState().update({ muted: !settings.muted })
                    audio.play('select')
                  }}
                  className="chip transition hover:border-cyan-400/50"
                >
                  {settings.muted ? <VolumeX size={12} /> : <Volume2 size={12} />} {settings.muted ? 'Muted' : 'Sound'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showTouch
                    setShowTouch(next)
                    useSettingsStore.getState().update({ showTouchControls: next })
                  }}
                  className={`chip transition ${showTouch ? 'border-cyan-400/40 text-cyan-200' : 'text-slate-500'}`}
                >
                  Touch {showTouch ? 'on' : 'off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hud.connection !== 'local' && (
        <div className="absolute left-2 top-2 z-30 flex items-center gap-1.5 rounded-sm border border-pink-400/30 bg-slate-950/80 px-2 py-1 text-[0.5rem] font-bold uppercase tracking-[0.14em] text-pink-200">
          <span className={`h-1.5 w-1.5 rounded-full ${hud.connection === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {hud.connection}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-1 right-2 z-20 text-[0.46rem] font-bold uppercase tracking-[0.18em] text-slate-700">
        {session.mode === 'training' ? 'TRAINING' : session.mode === 'local' ? 'LOCAL 2P' : 'SOLO'} // {session.arena}
      </div>
      {!paused && hud.phase === 'fight' && (
        <div className="pointer-events-none absolute right-2 top-24 z-10 hidden flex-col items-end gap-1 sm:flex">
          <span className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-600">
            <Pause size={9} /> ESC TO PAUSE
          </span>
        </div>
      )}
    </div>
  )
}
