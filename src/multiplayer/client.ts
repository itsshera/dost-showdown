import { io, type Socket } from 'socket.io-client'
import type {
  ArenaId,
  AttackKind,
  CharacterId,
  Difficulty,
  FighterState,
  GameEvent,
  InputSnapshot,
  PowerAnimation,
} from '../types'

export interface OnlinePlayer {
  slot: 0 | 1
  name: string
  character: CharacterId
  ready: boolean
  rematch: boolean
}

export interface OnlineRoom {
  code: string
  hostSlot: 0 | 1
  status: 'lobby' | 'playing' | 'ended'
  arena: ArenaId
  roundsToWin: number
  roundSeconds: number
  players: OnlinePlayer[]
}

export interface OnlineMatchPlayer {
  slot: 0 | 1
  name: string
  character: CharacterId
}

export interface OnlineMatchStart {
  code: string
  arena: ArenaId
  roundsToWin: number
  roundSeconds: number
  p1: OnlineMatchPlayer
  p2: OnlineMatchPlayer
  serverTime: number
}

export interface OnlineFighterSnapshot {
  id: 'p1' | 'p2'
  characterId: CharacterId
  x: number
  y: number
  z: number
  facing: 1 | -1
  state: FighterState
  stateTime: number
  health: number
  maxHealth: number
  power: number
  wins: number
  cooldown: number
  cooldownTotal: number
  combo: number
  comboDamage: number
  blocking: boolean
  crouching: boolean
  grounded: boolean
  attackKind: AttackKind | null
  attackPhase: 'startup' | 'active' | 'recovery' | null
  specialAnimation: PowerAnimation | null
}

export interface OnlineSnapshot {
  phase: 'intro' | 'fight' | 'roundEnd' | 'matchEnd'
  timer: number
  round: number
  roundsToWin: number
  p1: OnlineFighterSnapshot
  p2: OnlineFighterSnapshot
  announcement: string
  announcementSub: string
  announcementKey: number
  shake: number
  slowMo: number
  serverTime: number
}

export interface OnlineResult {
  winner: 1 | 2
  score: [number, number]
  duration: number
  maxCombo: number
  mode: 'online'
  p1: CharacterId
  p2: CharacterId
  arena: ArenaId
  difficulty: Difficulty
}

interface AckOk {
  ok: true
  code: string
  slot: 0 | 1
  room: OnlineRoom
}
interface AckError {
  ok: false
  error: string
}
export type RoomAck = AckOk | AckError

export interface OnlineEvents {
  'room:update': OnlineRoom
  'match:start': OnlineMatchStart
  'match:state': { snapshot: OnlineSnapshot; events: GameEvent[] }
  'match:end': { result: OnlineResult }
  'room:closed': { reason: string }
  'room:opponentLeft': { name: string }
  connect: undefined
  disconnect: { reason?: string }
  connect_error: Error
}

type RawSocket = {
  on: (name: string, fn: (...args: unknown[]) => void) => void
  off: (name: string, fn: (...args: unknown[]) => void) => void
}

export class OnlineClient {
  private socket: Socket | null = null
  private url = ''
  // Listeners live here, not on a single socket instance. React StrictMode
  // mounts effects twice: the first pass can subscribe while the socket is
  // still connecting, then connect() replaces it. Keeping a registry lets us
  // re-attach every listener to the new socket so broadcasts are never lost.
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>()

  get connected() {
    return this.socket?.connected === true
  }

  get currentUrl() {
    return this.url
  }

  private attachHandlers(socket: Socket) {
    const raw = socket as unknown as RawSocket
    for (const [event, handlers] of this.handlers) {
      for (const handler of handlers) raw.on(event, handler)
    }
  }

  private waitForConnect(socket: Socket, url: string) {
    return new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        cleanup()
        reject(new Error(`Could not reach ${url}. Is the server running?`))
      }, 9500)
      const onConnect = () => {
        cleanup()
        resolve()
      }
      const onError = (error: Error) => {
        cleanup()
        reject(new Error(error?.message || `Could not reach ${url}.`))
      }
      const cleanup = () => {
        window.clearTimeout(timer)
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
      }
      socket.once('connect', onConnect)
      socket.once('connect_error', onError)
    })
  }

  connect(url: string) {
    if (this.socket && this.url === url) {
      if (this.socket.connected) return Promise.resolve()
      // Still connecting to the same server — reuse it instead of tearing the
      // socket down (which would orphan any in-flight room create/join).
      if (this.socket.active) return this.waitForConnect(this.socket, url)
    }
    this.disconnect()
    this.url = url
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
      timeout: 9000,
    })
    this.socket = socket
    this.attachHandlers(socket)
    return this.waitForConnect(socket, url)
  }

  on<K extends keyof OnlineEvents>(event: K, handler: (payload: OnlineEvents[K]) => void) {
    const listener = handler as (...args: unknown[]) => void
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(listener)
    if (this.socket) (this.socket as unknown as RawSocket).on(event, listener)
    return () => {
      const current = this.handlers.get(event)
      current?.delete(listener)
      if (current && current.size === 0) this.handlers.delete(event)
      if (this.socket) (this.socket as unknown as RawSocket).off(event, listener)
    }
  }

  private emitAck(event: string, payload: unknown): Promise<RoomAck> {
    const socket = this.socket
    if (!socket) return Promise.reject(new Error('Not connected to a server.'))
    return new Promise((resolve, reject) => {
      socket.timeout(9000).emit(event, payload, (error: Error | null, response: RoomAck) => {
        if (error) {
          reject(new Error('The server did not respond. Check your connection.'))
          return
        }
        resolve(response)
      })
    })
  }

  createRoom(payload: {
    name: string
    character: CharacterId
    arena: ArenaId
    roundsToWin: number
    roundSeconds: number
  }) {
    return this.emitAck('room:create', payload)
  }

  joinRoom(payload: { code: string; name: string; character: CharacterId }) {
    return this.emitAck('room:join', payload)
  }

  setCharacter(character: CharacterId) {
    this.socket?.emit('room:character', { character })
  }

  setArena(arena: ArenaId) {
    this.socket?.emit('room:arena', { arena })
  }

  setRules(roundsToWin: number, roundSeconds: number) {
    this.socket?.emit('room:rules', { roundsToWin, roundSeconds })
  }

  setReady(ready: boolean) {
    this.socket?.emit('room:ready', { ready })
  }

  requestRematch() {
    this.socket?.emit('room:rematch')
  }

  sendInput(input: InputSnapshot) {
    this.socket?.emit('input', { input })
  }

  leave() {
    this.socket?.emit('room:leave')
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
}

export const onlineClient = new OnlineClient()
