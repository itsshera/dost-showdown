import type { AttackKind, AttackSpec, CharacterDefinition, FighterState, InputSnapshot, PowerAnimation } from '../../types'
import { buildAttacks, GAME } from './constants'

export interface ActiveAttack {
  spec: AttackSpec
  elapsed: number
  hasHit: boolean
  air: boolean
}

export class Fighter {
  readonly id: 'p1' | 'p2'
  readonly character: CharacterDefinition
  readonly attacks: Record<AttackKind, AttackSpec>

  x = 0
  y = 0
  z = 0
  vx = 0
  vy = 0
  facing: 1 | -1 = 1
  grounded = true

  health = GAME.maxHealth
  maxHealth = GAME.maxHealth
  power = GAME.meterStart
  wins = 0

  state: FighterState = 'idle'
  stateTime = 0
  stun = 0
  blockstun = 0
  cooldown = 0
  flash = 0
  blocking = false
  crouching = false

  attack: ActiveAttack | null = null
  specialAnimation: PowerAnimation | null = null

  combo = 0
  comboTimer = 0
  comboDamage = 0
  maxCombo = 0

  input: InputSnapshot = {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false,
    special: false,
    block: false,
  }
  prevInput: InputSnapshot = { ...this.input }

  constructor(id: 'p1' | 'p2', character: CharacterDefinition) {
    this.id = id
    this.character = character
    this.attacks = buildAttacks(character)
  }

  get moveSpeed() {
    return 3.7 + this.character.stats.speed * 0.11
  }

  get defenseMultiplier() {
    return Math.max(0.84, 1.08 - this.character.stats.defense * 0.02)
  }

  get specialReady() {
    return this.power >= GAME.specialCost && this.cooldown <= 0
  }

  get isBusy() {
    return !!this.attack || this.stun > 0 || this.blockstun > 0
  }

  get canAct() {
    return !this.attack && this.stun <= 0 && this.blockstun <= 0
  }

  reset(x: number, facing: 1 | -1) {
    this.x = x
    this.y = 0
    this.z = 0
    this.vx = 0
    this.vy = 0
    this.facing = facing
    this.grounded = true
    this.health = this.maxHealth
    this.power = GAME.meterStart
    this.state = 'idle'
    this.stateTime = 0
    this.stun = 0
    this.blockstun = 0
    this.cooldown = 0
    this.flash = 0
    this.blocking = false
    this.crouching = false
    this.attack = null
    this.specialAnimation = null
    this.combo = 0
    this.comboTimer = 0
    this.comboDamage = 0
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      special: false,
      block: false,
    }
    this.prevInput = { ...this.input }
  }

  pressed(action: keyof InputSnapshot) {
    return this.input[action] && !this.prevInput[action]
  }

  addPower(amount: number) {
    const before = this.power
    this.power = Math.min(GAME.meterMax, Math.max(0, this.power + amount))
    return before < GAME.meterMax && this.power >= GAME.meterMax
  }

  get attackPhase() {
    if (!this.attack) return null
    const { spec, elapsed } = this.attack
    if (elapsed < spec.startup) return 'startup' as const
    if (elapsed < spec.startup + spec.active) return 'active' as const
    return 'recovery' as const
  }
}
