import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Copy,
  Crown,
  DoorOpen,
  Home,
  Loader2,
  RotateCcw,
  Shield,
  Swords,
  Timer,
  Trophy,
  WifiOff,
  X,
} from 'lucide-react'
import { OnlineMatchEngine } from '../multiplayer/OnlineMatchEngine'
import { onlineClient, type OnlineResult } from '../multiplayer/client'
import { GameCanvas } from '../game/GameCanvas'
import { GameHUD } from '../game/GameHUD'
import { TouchControls } from '../game/TouchControls'
import { inputManager } from '../game/engine/input'
import { getCharacter } from '../data/characters'
import { audio, sfxForSpecial } from '../audio/AudioEngine'
import { useNavStore } from '../store/useNavStore'
import { useOnlineStore } from '../store/useOnlineStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useProgressionStore } from '../store/useProgressionStore'
import { useHudStore } from '../store/useHudStore'
import type { GameEvent, InputSnapshot } from '../types'

const NEUTRAL_INPUT: InputSnapshot = {
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false,
  kick: false,
  special: false,
  block: false,
}

type Overlay = 'none' | 'menu' | 'opponent-left' | 'closed' | 'disconnected'

const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function ConnectionPill({ connection }: { connection: string }) {
  const color =
    connection === 'connected'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : connection === 'connecting'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
        : 'border-red-400/40 bg-red-500/10 text-red-200'
  return (
    <span className={`chip ${color}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connection === 'connected' ? 'bg-emerald-400' : connection === 'connecting' ? 'bg-amber-400' : 'bg-red-400'
        }`}
      />
      {connection}
    </span>
  )
}

export function OnlineGameScreen() {
  const matchStart = useOnlineStore((s) => s.matchStart)
  const room = useOnlineStore((s) => s.room)
  const mySlot = useOnlineStore((s) => s.mySlot)
  const setMatchStart = useOnlineStore((s) => s.setMatchStart)
  const setRoom = useOnlineStore((s) => s.setRoom)
  const setStatus = useOnlineStore((s) => s.setStatus)
  const setScreen = useNavStore((s) => s.setScreen)
  const settings = useSettingsStore()
  const recordMatch = useProgressionStore((s) => s.recordMatch)
  const setHud = useHudStore((s) => s.setHud)
  const hud = useHudStore((s) => s.hud)

  const [overlay, setOverlay] = useState<Overlay>('none')
  const [result, setResult] = useState<OnlineResult | null>(null)
  const [rematchRequested, setRematchRequested] = useState(false)
  const [showTouch, setShowTouch] = useState(() => {
    if (!useSettingsStore.getState().showTouchControls) return false
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer: coarse)').matches === true || window.innerWidth < 900
  })
  const [copied, setCopied] = useState(false)
  const recorded = useRef(false)
  const engineRef = useRef<OnlineMatchEngine | null>(null)

  const engine = useMemo(() => (matchStart ? new OnlineMatchEngine(matchStart) : null), [matchStart])
  engineRef.current = engine

  const handleResult = useCallback(
    (next: OnlineResult) => {
      setResult(next)
      engineRef.current?.setResult(next)
      setOverlay('none')
      const slot = mySlot ?? 0
      const won = next.winner === slot + 1
      audio.play(won ? 'victory' : 'defeat')

      if (!recorded.current) {
        recorded.current = true
        const myCharacter = slot === 1 ? next.p2 : next.p1
        const opponentCharacter = slot === 1 ? next.p1 : next.p2
        recordMatch({
          id: `online-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: Date.now(),
          mode: 'online',
          playerCharacter: myCharacter,
          opponentCharacter,
          arena: next.arena,
          won,
          score: `${next.score[slot]}-${next.score[slot === 0 ? 1 : 0]}`,
          difficulty: 'medium',
          duration: Math.round(next.duration),
          maxCombo: next.maxCombo,
        })
      }

      if (settings.voiceLines) {
        const winnerCharacter = getCharacter(next.winner === 1 ? next.p1 : next.p2)
        const myCharacter = getCharacter(slot === 1 ? next.p2 : next.p1)
        audio.speak(
          won ? winnerCharacter.victoryLine : myCharacter.defeatLine,
          won ? winnerCharacter.id : myCharacter.id,
          0.9,
        )
      }
    },
    [mySlot, recordMatch, settings.voiceLines],
  )

  // One socket subscription for the whole match. It survives rematches because
  // the renderer engine is replaced through the matchStart store value.
  useEffect(() => {
    const unsubscribe = [
      onlineClient.on('match:state', ({ snapshot, events }) => {
        engineRef.current?.receive(snapshot, events)
      }),
      onlineClient.on('match:end', ({ result: next }) => {
        handleResult(next)
      }),
      onlineClient.on('match:start', (next) => {
        recorded.current = false
        setResult(null)
        setRematchRequested(false)
        setOverlay('none')
        setMatchStart(next)
        const current = useOnlineStore.getState().room
        if (current) setRoom({ ...current, status: 'playing' })
        audio.play('roundStart')
      }),
      onlineClient.on('room:update', (next) => {
        setRoom(next)
      }),
      onlineClient.on('room:opponentLeft', ({ name }) => {
        engineRef.current?.setConnection('disconnected')
        setOverlay('opponent-left')
        setStatus('connected', `${name} left the match.`)
        audio.play('denied')
      }),
      onlineClient.on('room:closed', ({ reason }) => {
        engineRef.current?.setConnection('disconnected')
        setOverlay('closed')
        setStatus('disconnected', reason)
      }),
      onlineClient.on('disconnect', () => {
        engineRef.current?.setConnection('disconnected')
        setOverlay('disconnected')
        setStatus('disconnected', 'Connection lost.')
      }),
      onlineClient.on('connect', () => {
        engineRef.current?.setConnection('connected')
        setStatus('connected')
      }),
    ]

    return () => unsubscribe.forEach((off) => off())
  }, [handleResult, setMatchStart, setRoom, setStatus])

  useEffect(() => {
    if (!engine) return
    engine.setConnection(onlineClient.connected ? 'connected' : 'connecting')
    audio.startMusic('fight')
    inputManager.attach()
    inputManager.reset()

    const hudTimer = window.setInterval(() => setHud(engine.getHud()), 45)
    setHud(engine.getHud())

    return () => {
      window.clearInterval(hudTimer)
      engine.destroy()
      inputManager.setEnabled(false)
      inputManager.detach()
      inputManager.reset()
      audio.stopMusic()
      useHudStore.getState().reset()
    }
  }, [engine, setHud])

  // Server events become the same audio cues the local engine uses.
  useEffect(() => {
    if (!engine) return
    return engine.onEvent((event: GameEvent) => {
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
        case 'matchEnd':
          handleResult(event.result as OnlineResult)
          break
      }
    })
  }, [engine, handleResult])

  const blocked = overlay !== 'none' || result !== null

  useEffect(() => {
    if (!engine) return
    inputManager.setEnabled(!blocked)
    if (blocked) {
      inputManager.reset()
      onlineClient.sendInput(NEUTRAL_INPUT)
    }
  }, [engine, blocked])

  // 30 Hz input upload. The authoritative server applies these to the match.
  useEffect(() => {
    if (!engine || blocked) return
    const timer = window.setInterval(() => {
      onlineClient.sendInput(inputManager.getPlayer('p1'))
    }, 33)
    return () => window.clearInterval(timer)
  }, [engine, blocked])

  useEffect(() => {
    if (result) audio.stopMusic()
  }, [result])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      e.preventDefault()
      if (result || overlay === 'opponent-left' || overlay === 'closed' || overlay === 'disconnected') return
      setOverlay((current) => (current === 'menu' ? 'none' : 'menu'))
      audio.play('back')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, result])

  const copyCode = async () => {
    if (!matchStart) return
    try {
      await navigator.clipboard.writeText(matchStart.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      audio.play('select')
    } catch {
      // Clipboard can be blocked; the code stays visible in the HUD.
    }
  }

  const leaveToLobby = () => {
    audio.play('back')
    onlineClient.leave()
    setMatchStart(null)
    setRoom(null)
    useOnlineStore.getState().setMySlot(null)
    useHudStore.getState().reset()
    setScreen('online')
  }

  const requestRematch = () => {
    if (rematchRequested) return
    setRematchRequested(true)
    onlineClient.requestRematch()
    audio.play('select')
  }

  if (!matchStart || !engine) {
    return (
      <div className="screen grid-bg flex items-center justify-center bg-[#05060f] p-4">
        <div className="panel panel-accent w-full max-w-md rounded-lg p-6 text-center">
          <WifiOff size={28} className="mx-auto text-pink-300" />
          <h1 className="mt-2 font-display text-4xl leading-none text-white">NO ONLINE MATCH</h1>
          <p className="mt-2 text-sm text-slate-400">
            Open the online arena, create or join a private room, and ready up with a friend.
          </p>
          <button type="button" onClick={() => setScreen('online')} className="btn btn-primary mt-4 w-full px-4 py-3">
            <ArrowLeft size={15} /> Online arena
          </button>
          <button type="button" onClick={() => setScreen('menu')} className="btn btn-ghost mt-2 w-full px-4 py-2 text-sm">
            <Home size={14} /> Main menu
          </button>
        </div>
      </div>
    )
  }

  const slot = mySlot ?? 0
  const myCharacter = getCharacter(slot === 1 ? matchStart.p2.character : matchStart.p1.character)
  const opponentCharacter = getCharacter(slot === 1 ? matchStart.p1.character : matchStart.p2.character)
  const me = room?.players.find((p) => p.slot === slot) ?? null
  const opponent = room?.players.find((p) => p.slot !== slot) ?? null
  const won = result ? result.winner === slot + 1 : false
  const winnerCharacter = result ? getCharacter(result.winner === 1 ? result.p1 : result.p2) : null
  const myScore = result ? result.score[slot] : 0
  const theirScore = result ? result.score[slot === 0 ? 1 : 0] : 0

  return (
    <div className="screen vignette bg-[#05060f]">
      <GameCanvas engine={engine} arenaId={matchStart.arena} quality={settings.graphics} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,3,10,0.5)_100%)]" />
      <GameHUD hud={hud} onPause={() => setOverlay('menu')} />

      <div className="pointer-events-none absolute right-2 top-[5.4rem] z-20 hidden items-center gap-1.5 sm:flex">
        <ConnectionPill connection={hud.connection} />
        <button
          type="button"
          onClick={copyCode}
          className="pointer-events-auto chip border-pink-400/40 bg-pink-500/10 text-pink-100 transition hover:border-pink-300/70"
          title="Copy room code"
        >
          <Copy size={11} /> {copied ? 'COPIED' : matchStart.code}
        </button>
      </div>

      <div className="pointer-events-none absolute left-2 top-[5.4rem] z-20 flex items-center gap-1.5 rounded-sm border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[0.48rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        <Swords size={10} className="text-pink-300" />
        {me?.name ?? 'YOU'} {myCharacter.nickname}
        <span className="text-slate-700">//</span>
        {opponent?.name ?? 'RIVAL'} {opponentCharacter.nickname}
      </div>

      {showTouch && !blocked && <TouchControls hud={hud} />}

      {overlay === 'menu' && !result && (
        <div className="pause-blur absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="panel panel-accent w-full max-w-lg rounded-lg p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.34em] text-pink-300/80">Online match</p>
                <h2 className="font-display text-4xl leading-none tracking-[0.08em] text-white">STILL IN THE FIGHT</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {myCharacter.nickname} vs {opponentCharacter.nickname} · Round {engine.round} · Room {matchStart.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOverlay('none')
                  audio.play('select')
                }}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/60 text-slate-400 transition hover:text-white"
                aria-label="Resume online match"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 rounded-sm border border-amber-400/30 bg-amber-500/10 p-3 text-[0.7rem] leading-snug text-amber-100">
              <p className="font-bold uppercase tracking-[0.14em]">The server does not pause</p>
              <p className="mt-1 text-amber-100/80">
                Your inputs stop while this menu is open, but the fight keeps running for your rival. Leaving forfeits the
                match and may close the room if you are the host.
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setOverlay('none')
                  audio.play('select')
                }}
                className="btn btn-primary w-full px-4 py-3"
              >
                <Swords size={16} /> Back to the fight
              </button>
              <button type="button" onClick={leaveToLobby} className="btn btn-danger w-full px-4 py-3">
                <DoorOpen size={15} /> Leave match
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <ConnectionPill connection={hud.connection} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    useSettingsStore.getState().update({ screenShake: !settings.screenShake })
                    audio.play('select')
                  }}
                  className={`chip transition ${settings.screenShake ? 'border-cyan-400/40 text-cyan-200' : 'text-slate-500'}`}
                >
                  Screen shake {settings.screenShake ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showTouch
                    setShowTouch(next)
                    useSettingsStore.getState().update({ showTouchControls: next })
                    audio.play('select')
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

      {(overlay === 'opponent-left' || overlay === 'closed' || overlay === 'disconnected') && !result && (
        <div className="pause-blur absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="panel w-full max-w-md rounded-lg p-6 text-center">
            <WifiOff size={30} className="mx-auto text-red-300" />
            <h2 className="mt-2 font-display text-4xl leading-none tracking-[0.06em] text-white">
              {overlay === 'opponent-left' ? 'RIVAL LEFT' : overlay === 'closed' ? 'ROOM CLOSED' : 'CONNECTION LOST'}
            </h2>
            <p className="mt-2 text-sm leading-snug text-slate-400">
              {overlay === 'opponent-left'
                ? 'Your opponent disconnected, so this match cannot continue.'
                : overlay === 'closed'
                  ? 'The host closed the private room.'
                  : 'The authoritative server is unreachable. Check your connection and start a new room.'}
            </p>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={leaveToLobby} className="btn btn-primary w-full px-4 py-3">
                <ArrowLeft size={15} /> Back to online arena
              </button>
              <button
                type="button"
                onClick={() => {
                  setScreen('menu')
                  audio.play('back')
                }}
                className="btn btn-ghost w-full px-4 py-2 text-sm"
              >
                <Home size={14} /> Main menu
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#03040a]/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="panel panel-accent w-full max-w-2xl rounded-lg p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.32em] text-pink-300/80">Online match complete</p>
                <h2
                  className={`font-display text-5xl leading-none tracking-[0.06em] sm:text-6xl ${
                    won ? 'text-amber-300' : 'text-slate-200'
                  }`}
                >
                  {won ? 'VICTORY' : 'DEFEAT'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {winnerCharacter?.nickname} wins the set {myScore}–{theirScore}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {won ? <Crown size={28} className="text-amber-300" /> : <Trophy size={26} className="text-slate-500" />}
                <ConnectionPill connection={hud.connection} />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                <p className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <Trophy size={10} /> Score
                </p>
                <p className="font-display text-2xl leading-none text-white">
                  {myScore} <span className="text-slate-600">–</span> {theirScore}
                </p>
              </div>
              <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                <p className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <Timer size={10} /> Match time
                </p>
                <p className="font-display text-2xl leading-none text-white">{formatDuration(result.duration)}</p>
              </div>
              <div className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                <p className="flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <Shield size={10} /> Max combo
                </p>
                <p className="font-display text-2xl leading-none text-white">{result.maxCombo} HIT</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5 text-[0.65rem] text-slate-400">
              <span className="font-bold uppercase tracking-[0.14em] text-slate-500">Room {matchStart.code}</span>
              <span className="text-slate-700">·</span>
              <span>{matchStart.arena}</span>
              <span className="text-slate-700">·</span>
              <span>Best of {matchStart.roundsToWin * 2 - 1}</span>
              <span className="ml-auto flex items-center gap-1.5">
                {rematchRequested ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Waiting for {opponent?.name ?? 'rival'}
                  </>
                ) : opponent?.rematch ? (
                  <span className="text-amber-300">Rival wants a rematch</span>
                ) : (
                  'Ready for another?'
                )}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={requestRematch}
                disabled={rematchRequested}
                className="btn btn-primary w-full px-4 py-3"
              >
                {rematchRequested ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                {rematchRequested ? 'Rematch requested' : 'Request rematch'}
              </button>
              <button type="button" onClick={leaveToLobby} className="btn btn-ghost w-full px-4 py-3">
                <DoorOpen size={15} /> Back to online arena
              </button>
            </div>
            <p className="mt-2 text-center text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
              A rematch starts automatically when both players request it.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-1 right-2 z-20 text-[0.46rem] font-bold uppercase tracking-[0.18em] text-slate-700">
        ONLINE // {matchStart.arena} // ROOM {matchStart.code}
      </div>
    </div>
  )
}
