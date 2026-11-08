import type {
  AttackKind,
  CharacterDefinition,
  GameEvent,
  HudFighter,
  HudSnapshot,
} from '../types'
import { getCharacter } from '../data/characters'
import type {
  OnlineFighterSnapshot,
  OnlineMatchStart,
  OnlineResult,
  OnlineSnapshot,
} from './client'

class SnapshotFighter {
  readonly id: 'p1' | 'p2'
  readonly character: CharacterDefinition
  x = 0
  y = 0
  z = 0
  targetX = 0
  targetY = 0
  facing: 1 | -1 = 1
  state = 'idle' as HudFighter['state']
  stateTime = 0
  health = 100
  maxHealth = 100
  power = 50
  wins = 0
  combo = 0
  comboDamage = 0
  cooldown = 0
  cooldownTotal = 8
  blocking = false
  crouching = false
  grounded = true
  attackKind: AttackKind | null = null
  attackPhase: 'startup' | 'active' | 'recovery' | null = null
  specialAnimation: OnlineFighterSnapshot['specialAnimation'] = null

  constructor(id: 'p1' | 'p2', character: CharacterDefinition) {
    this.id = id
    this.character = character
  }

  get attack() {
    return this.attackKind ? { spec: { kind: this.attackKind } } : null
  }

  apply(snapshot: OnlineFighterSnapshot) {
    this.targetX = snapshot.x
    this.targetY = snapshot.y
    if (Math.abs(this.x - snapshot.x) > 3) this.x = snapshot.x
    if (Math.abs(this.y - snapshot.y) > 2) this.y = snapshot.y
    this.facing = snapshot.facing
    this.state = snapshot.state
    this.stateTime = snapshot.stateTime
    this.health = snapshot.health
    this.maxHealth = snapshot.maxHealth
    this.power = snapshot.power
    this.wins = snapshot.wins
    this.combo = snapshot.combo
    this.comboDamage = snapshot.comboDamage
    this.cooldown = snapshot.cooldown
    this.cooldownTotal = snapshot.cooldownTotal
    this.blocking = snapshot.blocking
    this.crouching = snapshot.crouching
    this.grounded = snapshot.grounded
    this.attackKind = snapshot.attackKind
    this.attackPhase = snapshot.attackPhase
    this.specialAnimation = snapshot.specialAnimation
  }
}

/**
 * Client-side adapter that makes the authoritative server snapshots look like a
 * local CombatEngine to the existing renderer, camera, effects and HUD.
 */
export class OnlineMatchEngine {
  readonly config: {
    mode: 'online'
    p1: CharacterDefinition
    p2: CharacterDefinition
    difficulty: 'medium'
    roundsToWin: number
    roundSeconds: number
    arena: OnlineMatchStart['arena']
  }
  readonly p1: SnapshotFighter
  readonly p2: SnapshotFighter

  phase: HudSnapshot['phase'] = 'intro'
  timer = 60
  round = 1
  shake = 0
  slowMo = 0
  paused = false
  finished = false
  connection: HudSnapshot['connection'] = 'connecting'
  result: OnlineResult | null = null

  private announcement = ''
  private announcementSub = ''
  private announcementKey = 0
  private listeners = new Set<(event: GameEvent) => void>()

  constructor(match: OnlineMatchStart) {
    const p1 = getCharacter(match.p1.character)
    const p2 = getCharacter(match.p2.character)
    this.config = {
      mode: 'online',
      p1,
      p2,
      difficulty: 'medium',
      roundsToWin: match.roundsToWin,
      roundSeconds: match.roundSeconds,
      arena: match.arena,
    }
    this.p1 = new SnapshotFighter('p1', p1)
    this.p2 = new SnapshotFighter('p2', p2)
    this.timer = match.roundSeconds
  }

  onEvent(listener: (event: GameEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  receive(snapshot: OnlineSnapshot, events: GameEvent[] = []) {
    this.phase = snapshot.phase
    this.timer = snapshot.timer
    this.round = snapshot.round
    this.shake = snapshot.shake
    this.slowMo = snapshot.slowMo
    this.announcement = snapshot.announcement
    this.announcementSub = snapshot.announcementSub
    this.announcementKey = snapshot.announcementKey
    this.p1.apply(snapshot.p1)
    this.p2.apply(snapshot.p2)

    for (const event of events) {
      if (event.type === 'matchEnd') this.result = event.result as OnlineResult
      for (const listener of this.listeners) listener(event)
    }
  }

  setResult(result: OnlineResult) {
    this.result = result
    this.finished = true
  }

  /** The match has ended, but interpolation continues for the victory camera. */
  markFinished() {
    this.finished = true
  }

  update(dt: number) {
    const smooth = 1 - Math.exp(-Math.min(dt, 0.05) * 18)
    for (const fighter of [this.p1, this.p2]) {
      fighter.x += (fighter.targetX - fighter.x) * smooth
      fighter.y += (fighter.targetY - fighter.y) * smooth
      fighter.stateTime += Math.min(dt, 0.05)
    }
    this.shake = Math.max(0, this.shake - Math.min(dt, 0.05) * 2.6)
  }

  private toHudFighter(fighter: SnapshotFighter): HudFighter {
    return {
      id: fighter.id,
      characterId: fighter.character.id,
      name: fighter.character.name,
      nickname: fighter.character.nickname,
      health: Math.max(0, fighter.health),
      maxHealth: fighter.maxHealth,
      power: fighter.power,
      wins: fighter.wins,
      combo: fighter.combo,
      comboDamage: Math.round(fighter.comboDamage),
      cooldownRemaining: fighter.cooldown,
      cooldownTotal: fighter.cooldownTotal,
      state: fighter.state,
      attackPhase: fighter.attackPhase,
    }
  }

  getHud(): HudSnapshot {
    return {
      phase: this.phase,
      timer: Math.max(0, this.timer),
      round: this.round,
      roundsToWin: this.config.roundsToWin,
      p1: this.toHudFighter(this.p1),
      p2: this.toHudFighter(this.p2),
      announcement: this.announcement,
      announcementSub: this.announcementSub,
      announcementKey: this.announcementKey,
      comboText: '',
      shake: this.shake,
      slowMo: this.slowMo,
      training: false,
      online: true,
      connection: this.connection,
    }
  }

  setConnection(connection: HudSnapshot['connection']) {
    this.connection = connection
  }

  setPaused(paused: boolean) {
    this.paused = paused
  }

  destroy() {
    this.listeners.clear()
  }
}
