import type {
  ArenaId,
  AttackKind,
  CharacterDefinition,
  Difficulty,
  FighterState,
  GameEvent,
  GameMode,
  HudFighter,
  HudSnapshot,
  InputSnapshot,
  MatchResult,
} from '../../types'
import { Fighter } from './Fighter'
import { attackTotal, GAME } from './constants'
import { AIController } from './ai'
import { inputManager } from './input'

export interface EngineConfig {
  mode: GameMode
  p1: CharacterDefinition
  p2: CharacterDefinition
  difficulty: Difficulty
  roundsToWin: number
  roundSeconds: number
  arena: ArenaId
}

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

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export class CombatEngine {
  readonly config: EngineConfig
  readonly p1: Fighter
  readonly p2: Fighter
  readonly ai: AIController

  phase: HudSnapshot['phase'] = 'intro'
  round = 1
  timer: number
  matchElapsed = 0
  shake = 0
  slowMo = 0
  timeScale = 1
  paused = false
  finished = false
  trainingDummyBlock = false
  result: MatchResult | null = null

  private introElapsed = 0
  private introStep = 0
  private roundEndTimer = 0
  private matchEndTimer = 0
  private hitstop = 0
  private announcement = ''
  private announcementSub = ''
  private announcementKey = 0
  private announcementTimer = 0
  private listeners = new Set<(event: GameEvent) => void>()
  private trainingHitTimer = 0
  private matchEndEmitted = false

  constructor(config: EngineConfig) {
    this.config = config
    this.p1 = new Fighter('p1', config.p1)
    this.p2 = new Fighter('p2', config.p2)
    this.ai = new AIController(config.difficulty)
    this.timer = config.roundSeconds

    if (config.mode === 'training') {
      this.phase = 'training'
      this.p1.reset(-2.4, 1)
      this.p2.reset(2.4, -1)
      this.timer = 0
      this.announce('TRAINING MODE', 'NO TIMER // PRACTISE YOUR MOVES', 1.6)
      this.emit({ type: 'roundStart', round: 1 })
    } else {
      this.setupRound()
    }
  }

  onEvent(listener: (event: GameEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(event: GameEvent) {
    for (const listener of this.listeners) listener(event)
  }

  private announce(text: string, sub = '', duration = 1.4) {
    this.announcement = text
    this.announcementSub = sub
    this.announcementKey += 1
    this.announcementTimer = duration
    this.emit({ type: 'announce', text, sub })
  }

  private setupRound() {
    this.phase = 'intro'
    this.introElapsed = 0
    this.introStep = 0
    this.timer = this.config.roundSeconds
    this.roundEndTimer = 0
    this.p1.reset(-3.1, 1)
    this.p2.reset(3.1, -1)
    this.announce(`ROUND ${this.round}`, 'GET READY', 1.15)
    this.emit({ type: 'roundStart', round: this.round })
  }

  update(rawDt: number) {
    if (this.paused || this.finished) return
    const dt = Math.min(rawDt, 1 / 20)

    this.shake = Math.max(0, this.shake - dt * 2.6)
    this.announcementTimer = Math.max(0, this.announcementTimer - dt)

    if (this.slowMo > 0) {
      this.slowMo = Math.max(0, this.slowMo - dt)
      const t = 1 - this.slowMo / 0.7
      this.timeScale = 0.36 + 0.64 * clamp(t, 0, 1)
    } else {
      this.timeScale = Math.min(1, this.timeScale + dt * 2.2)
    }

    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt)
      return
    }

    const sim = dt * this.timeScale

    switch (this.phase) {
      case 'intro':
        this.updateIntro(sim)
        break
      case 'fight':
        this.updateFight(sim)
        break
      case 'training':
        this.updateTraining(sim)
        break
      case 'roundEnd':
        this.updateRoundEnd(sim)
        break
      case 'matchEnd':
        this.updateMatchEnd(sim)
        break
    }
  }

  private updateIntro(dt: number) {
    this.introElapsed += dt
    if (this.introStep === 0 && this.introElapsed > 0.9) {
      this.introStep = 1
      this.announce('3', '', 0.42)
    } else if (this.introStep === 1 && this.introElapsed > 1.2) {
      this.introStep = 2
      this.announce('2', '', 0.42)
    } else if (this.introStep === 2 && this.introElapsed > 1.5) {
      this.introStep = 3
      this.announce('1', '', 0.42)
    } else if (this.introStep === 3 && this.introElapsed > 1.8) {
      this.introStep = 4
      this.phase = 'fight'
      this.timer = this.config.roundSeconds
      this.announce('FIGHT!', '', 0.85)
      this.emit({ type: 'announce', text: 'FIGHT!', sub: '' })
    }

    this.tickTimers(this.p1, dt, true)
    this.tickTimers(this.p2, dt, true)
    this.controlFighter(this.p1, NEUTRAL_INPUT, dt)
    this.controlFighter(this.p2, NEUTRAL_INPUT, dt)
    this.physics(this.p1, dt)
    this.physics(this.p2, dt)
    this.resolveCollision()
    this.faceOpponents()
  }

  private updateFight(dt: number) {
    this.tickTimers(this.p1, dt, true)
    this.tickTimers(this.p2, dt, true)

    const p1Input = inputManager.getPlayer('p1')
    const p2Input =
      this.config.mode === 'local'
        ? inputManager.getPlayer('p2')
        : this.ai.update(this, this.p2, this.p1, dt)

    this.controlFighter(this.p1, p1Input, dt)
    this.controlFighter(this.p2, p2Input, dt)
    this.physics(this.p1, dt)
    this.physics(this.p2, dt)
    this.resolveCollision()
    this.faceOpponents()
    this.checkHit(this.p1, this.p2)
    this.checkHit(this.p2, this.p1)

    if (this.phase === 'fight') {
      this.timer = Math.max(0, this.timer - dt)
      this.matchElapsed += dt
      if (this.timer <= 0) {
        const winner =
          this.p1.health === this.p2.health ? null : this.p1.health > this.p2.health ? 'p1' : 'p2'
        this.endRound(winner, 'TIME')
      }
    }
  }

  private updateTraining(dt: number) {
    this.tickTimers(this.p1, dt, true)
    this.tickTimers(this.p2, dt, true)

    const p1Input = inputManager.getPlayer('p1')
    const dummyInput: InputSnapshot = { ...NEUTRAL_INPUT, block: this.trainingDummyBlock }

    this.controlFighter(this.p1, p1Input, dt)
    this.controlFighter(this.p2, dummyInput, dt)
    this.physics(this.p1, dt)
    this.physics(this.p2, dt)
    this.resolveCollision()
    this.faceOpponents()
    this.checkHit(this.p1, this.p2)
    this.checkHit(this.p2, this.p1)

    this.trainingHitTimer += dt
    if (this.trainingHitTimer > 2.4) {
      this.p2.health = Math.min(this.p2.maxHealth, this.p2.health + 14 * dt)
      this.p2.stun = Math.max(0, this.p2.stun - dt * 0.5)
    }
    this.p1.power = Math.min(GAME.meterMax, this.p1.power + 8 * dt)
    this.p1.health = this.p1.maxHealth
  }

  private updateRoundEnd(dt: number) {
    this.tickTimers(this.p1, dt, false)
    this.tickTimers(this.p2, dt, false)
    this.physics(this.p1, dt)
    this.physics(this.p2, dt)
    this.resolveCollision()
    this.roundEndTimer -= dt

    if (this.roundEndTimer < 1.5) {
      for (const fighter of [this.p1, this.p2]) {
        if (fighter.state === 'knockdown') fighter.state = 'defeat'
      }
    }

    if (this.roundEndTimer <= 0) {
      if (this.p1.wins >= this.config.roundsToWin || this.p2.wins >= this.config.roundsToWin) {
        this.startMatchEnd()
      } else {
        this.round += 1
        this.setupRound()
      }
    }
  }

  private updateMatchEnd(dt: number) {
    this.tickTimers(this.p1, dt, false)
    this.tickTimers(this.p2, dt, false)
    this.physics(this.p1, dt)
    this.physics(this.p2, dt)
    this.matchEndTimer -= dt
    if (this.matchEndTimer <= 0 && !this.matchEndEmitted) {
      this.matchEndEmitted = true
      const winner: 1 | 2 = this.p1.wins > this.p2.wins ? 1 : 2
      this.result = {
        winner,
        score: [this.p1.wins, this.p2.wins],
        duration: this.matchElapsed,
        maxCombo: Math.max(this.p1.maxCombo, this.p2.maxCombo),
        mode: this.config.mode,
        p1: this.p1.character.id,
        p2: this.p2.character.id,
        arena: this.config.arena,
        difficulty: this.config.difficulty,
      }
      this.emit({ type: 'matchEnd', result: this.result })
      this.finished = true
    }
  }

  private tickTimers(fighter: Fighter, dt: number, allowRecover: boolean) {
    fighter.stateTime += dt
    fighter.flash = Math.max(0, fighter.flash - dt * 4)
    fighter.cooldown = Math.max(0, fighter.cooldown - dt)
    fighter.blockstun = Math.max(0, fighter.blockstun - dt)

    if (fighter.comboTimer > 0) {
      fighter.comboTimer -= dt
      if (fighter.comboTimer <= 0) {
        if (fighter.combo >= 2) {
          this.emit({
            type: 'combo',
            player: fighter.id,
            count: fighter.combo,
            damage: Math.round(fighter.comboDamage),
          })
        }
        fighter.combo = 0
        fighter.comboDamage = 0
      }
    }

    if (fighter.stun > 0) {
      fighter.stun = Math.max(0, fighter.stun - dt)
      if (fighter.stun === 0 && allowRecover && fighter.health > 0) {
        if (fighter.state === 'hit' || fighter.state === 'stunned') fighter.state = 'idle'
      }
    }

    if (fighter.attack) {
      fighter.attack.elapsed += dt
      if (fighter.attack.elapsed >= attackTotal(fighter.attack.spec)) {
        fighter.attack = null
        fighter.specialAnimation = null
        if (allowRecover && fighter.health > 0) {
          fighter.state = fighter.grounded ? 'idle' : 'jump'
        }
      }
    }
  }

  private controlFighter(fighter: Fighter, input: InputSnapshot, dt: number) {
    fighter.input = input
    const previous = fighter.prevInput

    if (fighter.stun > 0) {
      fighter.blocking = false
      fighter.crouching = false
      fighter.vx *= Math.exp(-3 * dt)
      fighter.prevInput = input
      return
    }

    if (fighter.attack) {
      fighter.blocking = false
      fighter.crouching = false
      fighter.prevInput = input
      return
    }

    const dir = input.right && !input.left ? 1 : input.left && !input.right ? -1 : 0

    if (!fighter.grounded) {
      fighter.blocking = false
      fighter.crouching = false
      if (dir !== 0) {
        fighter.vx = clamp(fighter.vx + dir * GAME.airAccel * dt, -fighter.moveSpeed * 1.15, fighter.moveSpeed * 1.15)
      }
      if (fighter.canAct) {
        if (input.punch && !previous.punch) this.startAttack(fighter, 'punch')
        else if (input.kick && !previous.kick) this.startAttack(fighter, 'kick')
        else if (input.special && !previous.special) this.startAttack(fighter, 'special')
      }
      fighter.prevInput = input
      return
    }

    fighter.crouching = input.down
    fighter.blocking = input.block && !input.down ? true : input.block

    if (fighter.blocking) {
      fighter.state = 'block'
      fighter.vx = 0
    } else if (fighter.crouching) {
      fighter.state = 'crouch'
      fighter.vx = 0
    } else if (input.up && !previous.up) {
      fighter.vy = GAME.jumpVelocity
      fighter.grounded = false
      fighter.state = 'jump'
      fighter.vx = dir * fighter.moveSpeed * 0.85
      this.emit({ type: 'jump', player: fighter.id })
    } else if (dir !== 0) {
      const forward = dir === fighter.facing
      fighter.state = forward ? 'walk' : 'backwalk'
      fighter.vx = dir * fighter.moveSpeed * (forward ? 1 : 0.72)
    } else {
      fighter.state = 'idle'
      fighter.vx = 0
    }

    if (fighter.canAct && !fighter.blocking) {
      if (input.punch && !previous.punch) this.startAttack(fighter, 'punch')
      else if (input.kick && !previous.kick) this.startAttack(fighter, 'kick')
      else if (input.special && !previous.special) this.startAttack(fighter, 'special')
    }

    fighter.prevInput = input
  }

  private startAttack(fighter: Fighter, kind: AttackKind) {
    if (fighter.attack || fighter.stun > 0) return
    const spec = fighter.attacks[kind]

    if (kind === 'special') {
      if (fighter.power < GAME.specialCost) {
        this.emit({ type: 'denied', player: fighter.id, reason: 'meter' })
        return
      }
      if (fighter.cooldown > 0) {
        this.emit({ type: 'denied', player: fighter.id, reason: 'cooldown' })
        return
      }
      fighter.power -= GAME.specialCost
      fighter.cooldown = spec.cooldown
      fighter.specialAnimation = fighter.character.power.animation
      this.emit({
        type: 'special',
        player: fighter.id,
        x: fighter.x,
        y: fighter.y + 1.1,
        animation: fighter.character.power.animation,
        color: fighter.character.color,
      })
    }

    fighter.attack = { spec, elapsed: 0, hasHit: false, air: !fighter.grounded }
    fighter.state = kind
    fighter.stateTime = 0
    fighter.blocking = false
    if (fighter.grounded) {
      fighter.vx = kind === 'kick' ? fighter.facing * 1.2 : 0
    }
    this.emit({ type: 'whoosh', player: fighter.id, kind })
  }

  private physics(fighter: Fighter, dt: number) {
    fighter.x += fighter.vx * dt

    if (!fighter.grounded) {
      fighter.vy += GAME.gravity * dt
      fighter.y += fighter.vy * dt
      if (fighter.y <= 0) {
        fighter.y = 0
        fighter.vy = 0
        fighter.grounded = true
        if (fighter.state === 'jump' && !fighter.attack) fighter.state = 'idle'
        this.emit({ type: 'land', player: fighter.id })
      }
    }

    if (fighter.stun > 0) fighter.vx *= Math.exp(-3.2 * dt)
    if (fighter.state === 'knockdown' || fighter.state === 'defeat') {
      fighter.vx *= Math.exp(-5 * dt)
    }

    fighter.x = clamp(fighter.x, GAME.arenaMinX, GAME.arenaMaxX)
  }

  private resolveCollision() {
    const dx = this.p2.x - this.p1.x
    const distance = Math.abs(dx)
    if (distance >= GAME.minSeparation) return

    const dir = dx >= 0 ? 1 : -1
    const overlap = GAME.minSeparation - distance
    this.p1.x -= (dir * overlap) / 2
    this.p2.x += (dir * overlap) / 2

    this.p1.x = clamp(this.p1.x, GAME.arenaMinX, GAME.arenaMaxX)
    this.p2.x = clamp(this.p2.x, GAME.arenaMinX, GAME.arenaMaxX)

    if (this.p1.x <= GAME.arenaMinX) this.p2.x = Math.max(this.p2.x, GAME.arenaMinX + GAME.minSeparation)
    if (this.p2.x >= GAME.arenaMaxX) this.p1.x = Math.min(this.p1.x, GAME.arenaMaxX - GAME.minSeparation)
  }

  private faceOpponents() {
    if (this.p1.canAct && !this.p1.attack) this.p1.facing = this.p2.x >= this.p1.x ? 1 : -1
    if (this.p2.canAct && !this.p2.attack) this.p2.facing = this.p1.x >= this.p2.x ? 1 : -1
  }

  private checkHit(attacker: Fighter, target: Fighter) {
    if (this.phase !== 'fight' && this.phase !== 'training') return
    const attack = attacker.attack
    if (!attack || attack.hasHit) return
    if (attacker.attackPhase !== 'active') return

    const spec = attack.spec
    const dx = target.x - attacker.x
    if (dx * attacker.facing < -0.25) return

    const distance = Math.abs(dx)
    if (distance > spec.range + 0.35) return

    // High punches whiff over a crouching opponent; kicks and specials still connect.
    if (spec.kind === 'punch' && target.crouching && !target.blocking) return

    const targetCenter = target.y + (target.crouching ? 0.62 : 0.95)
    const attackCenter = attacker.y + spec.height
    const verticalTolerance = spec.kind === 'special' ? 1.9 : 1.05
    if (Math.abs(targetCenter - attackCenter) > verticalTolerance) return

    attack.hasHit = true
    const targetFacingAttacker = (attacker.x - target.x) * target.facing >= 0
    const blocked = target.blocking && targetFacingAttacker && target.grounded

    const comboScale = Math.max(0.55, 1 - attacker.combo * 0.1)
    let raw = spec.damage * target.defenseMultiplier * comboScale
    if (blocked) raw *= spec.kind === 'special' ? 0.45 : 0.28
    const damage = Math.max(1, Math.round(raw))

    target.health = Math.max(0, target.health - damage)
    target.flash = 1

    if (blocked) {
      target.blockstun = 0.16
      target.vx = attacker.facing * 1.8
      attacker.addPower(4)
      target.addPower(4)
      this.shake = Math.max(this.shake, 0.16)
      this.hitstop = Math.max(this.hitstop, 0.035)
      this.emit({
        type: 'block',
        player: target.id,
        x: target.x,
        y: target.y + 1.05,
      })
      this.emit({
        type: 'hit',
        attacker: attacker.id,
        x: target.x,
        y: target.y + 1.1,
        damage,
        blocked: true,
        special: spec.kind === 'special',
        color: target.character.accent,
      })
    } else {
      attacker.combo = attacker.comboTimer > 0 ? attacker.combo + 1 : 1
      attacker.comboTimer = GAME.comboWindow
      attacker.comboDamage += damage
      attacker.maxCombo = Math.max(attacker.maxCombo, attacker.combo)

      target.stun = spec.kind === 'punch' ? 0.3 : spec.kind === 'kick' ? 0.4 : 0.72
      target.state = 'hit'
      target.attack = null
      target.specialAnimation = null
      target.blocking = false
      target.crouching = false
      target.vx = attacker.facing * spec.knockback
      if (spec.kind === 'special') {
        target.vy = 2.8
        target.grounded = false
      } else if (target.grounded && spec.kind === 'kick') {
        target.vy = 1.4
        target.grounded = false
      }

      attacker.addPower(spec.meterGain)
      target.addPower(6)
      this.shake = Math.max(this.shake, spec.kind === 'special' ? 0.52 : 0.26)
      this.hitstop = Math.max(this.hitstop, spec.kind === 'special' ? 0.09 : 0.055)
      this.emit({
        type: 'hit',
        attacker: attacker.id,
        x: target.x,
        y: target.y + 1.1,
        damage,
        blocked: false,
        special: spec.kind === 'special',
        color: attacker.character.accent,
      })
    }

    if (this.phase === 'training' && target.id === 'p2') {
      this.trainingHitTimer = 0
    }

    if (target.health <= 0 && this.phase === 'fight') {
      target.state = 'knockdown'
      target.stun = 3
      target.vy = 4.5
      target.vx = attacker.facing * 9
      target.grounded = false
      this.slowMo = 0.7
      this.shake = 0.8
      this.emit({ type: 'ko', winner: attacker.id, x: target.x, y: target.y + 1.2 })
      this.endRound(attacker.id, 'KO')
    }
  }

  private endRound(winner: 'p1' | 'p2' | null, reason: 'KO' | 'TIME') {
    if (this.phase !== 'fight') return
    this.phase = 'roundEnd'
    this.roundEndTimer = 3.15

    const winnerFighter = winner === 'p1' ? this.p1 : winner === 'p2' ? this.p2 : null
    const loserFighter = winner === 'p1' ? this.p2 : winner === 'p2' ? this.p1 : null

    if (winnerFighter) winnerFighter.wins += 1
    if (winnerFighter) {
      winnerFighter.state = 'victory'
      winnerFighter.stun = 0
      winnerFighter.attack = null
      winnerFighter.specialAnimation = null
    }
    if (loserFighter) {
      if (reason === 'KO') {
        loserFighter.state = 'knockdown'
        loserFighter.stun = 2.5
      } else {
        loserFighter.state = 'defeat'
        loserFighter.stun = 0
      }
    } else {
      this.p1.state = 'defeat'
      this.p2.state = 'defeat'
      this.p1.stun = 0
      this.p2.stun = 0
    }

    this.announce(
      reason === 'KO' ? 'K.O.' : 'TIME UP',
      winnerFighter
        ? `${winnerFighter.character.nickname} TAKES THE ROUND`
        : 'DRAW — ROUND REPLAYED',
      2.2,
    )
    this.emit({ type: 'roundEnd', winner: winner ?? 'draw', round: this.round })
  }

  private startMatchEnd() {
    this.phase = 'matchEnd'
    this.matchEndTimer = 3.1
    const winner = this.p1.wins > this.p2.wins ? this.p1 : this.p2
    const loser = winner === this.p1 ? this.p2 : this.p1
    winner.state = 'victory'
    winner.stun = 0
    winner.attack = null
    loser.state = 'defeat'
    loser.attack = null
    loser.stun = 0
    this.announce(`${winner.character.nickname} WINS`, 'MATCH COMPLETE', 2.6)
  }

  private toHudFighter(fighter: Fighter): HudFighter {
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
      cooldownTotal: fighter.character.power.cooldown,
      state: fighter.state as FighterState,
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
      announcement: this.announcementTimer > 0 ? this.announcement : '',
      announcementSub: this.announcementTimer > 0 ? this.announcementSub : '',
      announcementKey: this.announcementKey,
      comboText: '',
      shake: this.shake,
      slowMo: this.slowMo,
      training: this.phase === 'training',
      online: false,
      connection: 'local',
    }
  }

  setTrainingDummyBlock(block: boolean) {
    this.trainingDummyBlock = block
  }

  resetTraining() {
    if (this.phase !== 'training') return
    this.p2.reset(2.4, -1)
    this.p2.health = this.p2.maxHealth
    this.p1.health = this.p1.maxHealth
    this.p1.power = GAME.meterMax
    this.p1.cooldown = 0
    this.p1.combo = 0
    this.p1.comboTimer = 0
    this.p1.comboDamage = 0
    this.trainingHitTimer = 0
    this.announce('DUMMY RESET', 'FULL METER // GO WILD', 1.0)
  }

  setPaused(paused: boolean) {
    this.paused = paused
    if (paused) inputManager.clearVirtual()
  }

  destroy() {
    this.listeners.clear()
  }
}
