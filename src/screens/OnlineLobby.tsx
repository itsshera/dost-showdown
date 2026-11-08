import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clipboard,
  Copy,
  Cpu,
  DoorOpen,
  Globe2,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Server,
  Swords,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { ArenaId, CharacterId } from '../types'
import { ARENAS } from '../data/arenas'
import { CHARACTER_IDS, getCharacter } from '../data/characters'
import { FighterPortrait } from '../components/FighterPortrait'
import { useNavStore } from '../store/useNavStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useOnlineStore } from '../store/useOnlineStore'
import { onlineClient } from '../multiplayer/client'
import { audio } from '../audio/AudioEngine'

function ConnectionBadge() {
  const status = useOnlineStore((s) => s.status)
  const error = useOnlineStore((s) => s.error)
  const color =
    status === 'connected' ? '#4ade80' : status === 'connecting' ? '#fbbf24' : status === 'error' ? '#f87171' : '#94a3b8'
  const label =
    status === 'connected' ? 'CONNECTED' : status === 'connecting' ? 'CONNECTING' : status === 'error' ? 'OFFLINE' : 'IDLE'
  return (
    <span
      className="chip border-slate-600/50"
      style={{ color, borderColor: `${color}55`, background: `${color}12` }}
      title={error ?? undefined}
    >
      {status === 'connected' ? <Wifi size={11} /> : status === 'connecting' ? <Loader2 size={11} className="animate-spin" /> : <WifiOff size={11} />}
      {label}
    </span>
  )
}

export function OnlineLobby() {
  const setScreen = useNavStore((s) => s.setScreen)
  const startGame = useNavStore((s) => s.startGame)
  const settings = useSettingsStore()
  const updateSettings = useSettingsStore((s) => s.update)
  const status = useOnlineStore((s) => s.status)
  const error = useOnlineStore((s) => s.error)
  const room = useOnlineStore((s) => s.room)
  const mySlot = useOnlineStore((s) => s.mySlot)
  const setStatus = useOnlineStore((s) => s.setStatus)
  const setRoom = useOnlineStore((s) => s.setRoom)
  const setMatchStart = useOnlineStore((s) => s.setMatchStart)
  const setMySlot = useOnlineStore((s) => s.setMySlot)

  const [name, setName] = useState(settings.playerName || 'Player')
  const [character, setCharacter] = useState<CharacterId>('anay')
  const [arena, setArena] = useState<ArenaId>('rooftop')
  const [codeInput, setCodeInput] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    audio.startMusic('menu')
  }, [])

  useEffect(() => {
    let cancelled = false
    const unsubs = [
      onlineClient.on('room:update', (next) => {
        if (!cancelled) setRoom(next)
      }),
      onlineClient.on('match:start', (match) => {
        if (cancelled) return
        setMatchStart(match)
        const current = useOnlineStore.getState().room
        if (current) setRoom({ ...current, status: 'playing' })
        startGame({
          mode: 'online',
          p1: match.p1.character,
          p2: match.p2.character,
          arena: match.arena,
          difficulty: 'medium',
        })
      }),
      onlineClient.on('room:closed', (payload) => {
        if (cancelled) return
        setNotice(payload.reason)
        setRoom(null)
        setMySlot(null)
      }),
      onlineClient.on('room:opponentLeft', (payload) => {
        if (cancelled) return
        setNotice(`${payload.name} left the room.`)
      }),
      onlineClient.on('disconnect', () => {
        if (cancelled) return
        setStatus('disconnected', 'Connection lost. Try reconnecting.')
      }),
      onlineClient.on('connect_error', (err) => {
        if (cancelled) return
        setStatus('error', err?.message || 'Could not connect.')
      }),
    ]

    if (onlineClient.connected) {
      setStatus('connected')
    } else {
      setStatus('connecting')
      onlineClient
        .connect(settings.serverUrl)
        .then(() => {
          if (!cancelled) setStatus('connected')
        })
        .catch((err: Error) => {
          if (!cancelled) setStatus('error', err.message)
        })
    }

    return () => {
      cancelled = true
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [settings.serverUrl, retryKey, setRoom, setMatchStart, setMySlot, setStatus, startGame])

  const myPlayer = useMemo(
    () => room?.players.find((p) => p.slot === mySlot) ?? null,
    [room, mySlot],
  )
  const opponent = useMemo(
    () => room?.players.find((p) => p.slot !== mySlot) ?? null,
    [room, mySlot],
  )
  const isHost = mySlot === 0
  const canCreate = status === 'connected' && busy === null
  const canReady = status === 'connected' && room?.players.length === 2 && busy === null

  const saveName = () => {
    const cleaned = name.trim().slice(0, 20) || 'Player'
    setName(cleaned)
    updateSettings({ playerName: cleaned })
    return cleaned
  }

  const createRoom = async () => {
    if (!canCreate) return
    setBusy('create')
    setNotice(null)
    audio.play('select')
    try {
      const response = await onlineClient.createRoom({
        name: saveName(),
        character,
        arena,
        roundsToWin: settings.roundsToWin,
        roundSeconds: settings.roundSeconds,
      })
      if (!response.ok) {
        setNotice(response.error)
        audio.play('denied')
      } else {
        setMySlot(response.slot)
        setRoom(response.room)
        audio.play('sparkle')
      }
    } catch (err) {
      setNotice((err as Error).message)
      audio.play('denied')
    } finally {
      setBusy(null)
    }
  }

  const joinRoom = async () => {
    if (!canCreate || codeInput.trim().length < 4) return
    setBusy('join')
    setNotice(null)
    audio.play('select')
    try {
      const response = await onlineClient.joinRoom({
        code: codeInput.trim().toUpperCase(),
        name: saveName(),
        character,
      })
      if (!response.ok) {
        setNotice(response.error)
        audio.play('denied')
      } else {
        setMySlot(response.slot)
        setRoom(response.room)
        audio.play('sparkle')
      }
    } catch (err) {
      setNotice((err as Error).message)
      audio.play('denied')
    } finally {
      setBusy(null)
    }
  }

  const chooseCharacter = (id: CharacterId) => {
    setCharacter(id)
    audio.play('select')
    if (room && myPlayer) onlineClient.setCharacter(id)
  }

  const leaveRoom = () => {
    onlineClient.leave()
    onlineClient.disconnect()
    setRoom(null)
    setMatchStart(null)
    setMySlot(null)
    setNotice('You left the room.')
    setStatus('disconnected')
    audio.play('back')
  }

  const back = () => {
    if (room) {
      onlineClient.leave()
      onlineClient.disconnect()
      setRoom(null)
      setMySlot(null)
    }
    audio.play('back')
    setScreen('menu')
  }

  const copyCode = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      audio.play('select')
    } catch {
      setNotice(`Room code: ${room.code}`)
    }
  }

  const characters = useMemo(() => CHARACTER_IDS.map((id) => getCharacter(id)), [])
  const selectedCharacter = getCharacter(character)

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="arcade-scroll relative z-10 h-full overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={back}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/70 text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
              aria-label="Back to main menu"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.32em] text-pink-300/80">Authoritative online play</p>
              <h1 className="font-display text-3xl leading-none tracking-[0.08em] text-white sm:text-4xl">ONLINE ARENA</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ConnectionBadge />
              <button
                type="button"
                onClick={() => {
                  setRetryKey((k) => k + 1)
                  audio.play('select')
                }}
                className="chip transition hover:border-cyan-400/50"
                title="Reconnect"
              >
                <RefreshCw size={11} /> Reconnect
              </button>
            </div>
          </header>

          <p className="mt-2 text-xs leading-snug text-slate-500">
            Private rooms run on a Socket.IO server that simulates the fight. Both players send inputs; the server owns health,
            positions and rounds. Online matches use the base roster stats for fairness.
          </p>

          {notice && (
            <div className="mt-3 flex items-start gap-2 rounded-sm border border-amber-400/30 bg-amber-500/10 p-2.5 text-[0.7rem] text-amber-100">
              <Clipboard size={13} className="mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="panel mt-3 rounded-sm p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-red-400/40 bg-red-500/10 text-red-300">
                  <Server size={16} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-none text-white">SERVER NOT REACHABLE</h2>
                  <p className="mt-1 text-xs leading-snug text-slate-400">{error}</p>
                  <div className="mt-2 rounded-sm border border-slate-700/60 bg-slate-950/60 p-2 font-mono text-[0.68rem] text-slate-300">
                    cd dost-showdown<br />
                    npm run server
                  </div>
                  <p className="mt-1.5 text-[0.65rem] text-slate-500">
                    Server URL: <span className="text-slate-300">{settings.serverUrl}</span>. Change it in Settings or set
                    <code className="mx-1 text-slate-300">VITE_SERVER_URL</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!room ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="panel panel-accent rounded-sm p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-purple-400/40 bg-purple-500/10 text-purple-300">
                    <Plus size={15} />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl leading-none tracking-[0.05em] text-white">CREATE ROOM</h2>
                    <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Host a private match</p>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">Display name</span>
                  <input className="input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
                </label>

                <div className="mt-3">
                  <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">Your fighter</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {characters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => chooseCharacter(c.id)}
                        className={`rounded-sm border p-1 transition ${
                          character === c.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                        }`}
                        title={c.nickname}
                      >
                        <FighterPortrait character={c} className="mx-auto h-8 w-8 rounded-sm" />
                        <span className="mt-0.5 block truncate text-center text-[0.44rem] font-bold uppercase tracking-[0.06em] text-slate-400">
                          {c.nickname.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">Arena</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ARENAS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setArena(a.id)
                          audio.play('select')
                        }}
                        className={`rounded-sm border px-2 py-1.5 text-left transition ${
                          arena === a.id ? 'border-slate-400/60 bg-slate-800/70' : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                        }`}
                      >
                        <span className="block h-0.5 w-5 rounded-full" style={{ background: a.accent }} />
                        <span className="mt-1 block font-display text-xs leading-tight text-slate-100">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={createRoom}
                  disabled={!canCreate}
                  className="btn btn-primary mt-3 w-full px-4 py-2.5 text-sm"
                >
                  {busy === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Create private room
                </button>
              </div>

              <div className="panel rounded-sm p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                    <LogIn size={15} />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl leading-none tracking-[0.05em] text-white">JOIN ROOM</h2>
                    <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Enter a friend's code</p>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">Room code</span>
                  <input
                    className="input text-center font-display text-2xl tracking-[0.3em]"
                    value={codeInput}
                    maxLength={6}
                    placeholder="ABC12"
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void joinRoom()
                    }}
                  />
                </label>

                <div className="mt-3">
                  <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-slate-400">Your fighter</p>
                  <div className="flex items-center gap-3 rounded-sm border border-slate-700/60 bg-slate-950/50 p-2">
                    <FighterPortrait character={selectedCharacter} className="h-14 w-14 shrink-0 rounded-sm" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl leading-none text-white">{selectedCharacter.nickname}</p>
                      <p className="mt-0.5 truncate text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {selectedCharacter.power.name} · {selectedCharacter.power.damage} dmg
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={joinRoom}
                  disabled={!canCreate || codeInput.trim().length < 4}
                  className="btn btn-ghost mt-3 w-full px-4 py-2.5 text-sm"
                >
                  {busy === 'join' ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                  Join room
                </button>

                <div className="mt-3 rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                  <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                    <Globe2 size={11} /> How it works
                  </p>
                  <p className="mt-1 text-[0.65rem] leading-snug text-slate-500">
                    The host creates a room and shares the 5-character code. Both players pick a fighter and ready up. The
                    server starts the match automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-3">
                <div className="panel panel-accent rounded-sm p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">Room code</p>
                      <p className="font-display text-5xl leading-none tracking-[0.28em] text-white">{room.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyCode}
                        className="btn btn-ghost px-3 py-2 text-xs"
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy code'}
                      </button>
                      <button type="button" onClick={leaveRoom} className="btn btn-danger px-3 py-2 text-xs">
                        <DoorOpen size={13} /> Leave
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    {[room.players.find((p) => p.slot === 0), room.players.find((p) => p.slot === 1)].map((player, index) => {
                      const c = player ? getCharacter(player.character) : null
                      const mine = player?.slot === mySlot
                      return (
                        <div key={index} className={index === 1 ? 'order-3' : 'order-1'}>
                          {player && c ? (
                            <div
                              className={`rounded-sm border p-2 ${
                                mine ? 'border-cyan-400/50 bg-cyan-500/5' : 'border-pink-400/40 bg-pink-500/5'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FighterPortrait character={c} className="h-10 w-10 shrink-0 rounded-sm" />
                                <div className="min-w-0">
                                  <p className="truncate font-display text-lg leading-none text-white">{player.name}</p>
                                  <p className="truncate text-[0.5rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                                    {c.nickname} {mine ? '// YOU' : '// RIVAL'}
                                  </p>
                                </div>
                              </div>
                              <p className={`mt-1 text-[0.5rem] font-bold uppercase tracking-[0.14em] ${player.ready ? 'text-emerald-300' : 'text-slate-600'}`}>
                                {player.ready ? '● READY' : '○ NOT READY'}
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[4.5rem] flex-col items-center justify-center rounded-sm border border-dashed border-slate-700/70 bg-slate-950/30 text-center">
                              <Users size={16} className="text-slate-600" />
                              <p className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-600">Waiting for friend</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div className="order-2 flex flex-col items-center">
                      <span className="font-display text-2xl leading-none text-slate-600">VS</span>
                    </div>
                  </div>
                </div>

                <div className="panel rounded-sm p-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">Your fighter</p>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {characters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => chooseCharacter(c.id)}
                        disabled={room.status === 'playing'}
                        className={`rounded-sm border p-1 transition disabled:opacity-40 ${
                          myPlayer?.character === c.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700/60 bg-slate-950/50 hover:border-slate-500/70'
                        }`}
                      >
                        <FighterPortrait character={c} className="mx-auto h-8 w-8 rounded-sm" />
                        <span className="mt-0.5 block truncate text-center text-[0.44rem] font-bold uppercase tracking-[0.06em] text-slate-400">
                          {c.nickname.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                  {room.status !== 'playing' && (
                    <button
                      type="button"
                      onClick={() => {
                        const ready = !myPlayer?.ready
                        onlineClient.setReady(ready)
                        audio.play('select')
                      }}
                      disabled={!canReady}
                      className={`btn mt-3 w-full px-4 py-2.5 text-sm ${myPlayer?.ready ? 'btn-ghost' : 'btn-primary'}`}
                    >
                      {myPlayer?.ready ? <RefreshCw size={14} /> : <Check size={14} />}
                      {myPlayer?.ready ? 'Cancel ready' : 'Ready up'}
                    </button>
                  )}
                  {room.status !== 'playing' && room.players.length < 2 && (
                    <p className="mt-1.5 text-center text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Share the room code to let a friend join
                    </p>
                  )}
                  {room.status === 'ended' && (
                    <p className="mt-1.5 text-center text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                      Match complete — ready up for a rematch
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="panel rounded-sm p-4">
                  <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <Swords size={12} /> Match setup
                  </p>
                  <div className="mt-2 space-y-2 text-[0.7rem] text-slate-400">
                    <p className="flex items-center justify-between">
                      <span>Arena</span>
                      <span className="font-display text-base text-slate-200">{ARENAS.find((a) => a.id === room.arena)?.name}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Rounds</span>
                      <span className="font-display text-base text-slate-200">Best of {room.roundsToWin * 2 - 1}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Timer</span>
                      <span className="font-display text-base text-slate-200">{room.roundSeconds}s</span>
                    </p>
                  </div>

                  {isHost && room.status !== 'playing' && (
                    <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                      <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-500">Host controls</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ARENAS.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              onlineClient.setArena(a.id)
                              audio.play('select')
                            }}
                            className={`rounded-sm border px-1 py-1 text-[0.5rem] font-bold uppercase tracking-[0.08em] transition ${
                              room.arena === a.id
                                ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100'
                                : 'border-slate-700/60 bg-slate-950/50 text-slate-500 hover:text-white'
                            }`}
                          >
                            {a.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <select
                          className="input text-xs"
                          value={room.roundsToWin}
                          onChange={(e) => onlineClient.setRules(Number(e.target.value), room.roundSeconds)}
                        >
                          <option value={1}>Single round</option>
                          <option value={2}>Best of 3</option>
                          <option value={3}>Best of 5</option>
                        </select>
                        <select
                          className="input text-xs"
                          value={room.roundSeconds}
                          onChange={(e) => onlineClient.setRules(room.roundsToWin, Number(e.target.value))}
                        >
                          {[30, 45, 60, 75, 90, 99].map((seconds) => (
                            <option key={seconds} value={seconds}>{seconds}s</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {!isHost && (
                    <p className="mt-3 border-t border-slate-700/60 pt-2 text-[0.58rem] text-slate-600">
                      The host controls arena and rules. You can still pick your fighter.
                    </p>
                  )}
                </div>

                <div className="panel rounded-sm p-4">
                  <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                    <Server size={11} /> Server
                  </p>
                  <p className="mt-1 break-all font-mono text-[0.65rem] text-slate-400">{settings.serverUrl}</p>
                  <p className="mt-1.5 text-[0.58rem] leading-snug text-slate-600">
                    If the connection drops, the room is lost. The authoritative server does not trust client health or damage.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pb-4">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Online play requires <code className="text-slate-400">npm run server</code> and two browser windows/devices.
            </p>
            <button type="button" onClick={back} className="btn btn-ghost px-4 py-2 text-xs">
              <ArrowLeft size={13} /> Back to menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
