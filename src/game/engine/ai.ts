import type { Difficulty, InputSnapshot } from '../../types'
import type { Fighter } from './Fighter'
import type { CombatEngine } from './CombatEngine'

interface AiProfile {
  reaction: number
  aggression: number
  block: number
  punish: number
  special: number
  spacing: number
  jump: number
  retreat: number
}

export const AI_PROFILES: Record<Difficulty, AiProfile> = {
  easy: {
    reaction: 0.5,
    aggression: 0.34,
    block: 0.18,
    punish: 0.14,
    special: 0.22,
    spacing: 0.45,
    jump: 0.03,
    retreat: 0.2,
  },
  medium: {
    reaction: 0.3,
    aggression: 0.56,
    block: 0.4,
    punish: 0.36,
    special: 0.5,
    spacing: 0.65,
    jump: 0.06,
    retreat: 0.26,
  },
  hard: {
    reaction: 0.17,
    aggression: 0.74,
    block: 0.66,
    punish: 0.64,
    special: 0.72,
    spacing: 0.82,
    jump: 0.09,
    retreat: 0.3,
  },
  insane: {
    reaction: 0.09,
    aggression: 0.9,
    block: 0.86,
    punish: 0.88,
    special: 0.9,
    spacing: 0.92,
    jump: 0.11,
    retreat: 0.34,
  },
}

const NEUTRAL: InputSnapshot = {
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false,
  kick: false,
  special: false,
  block: false,
}

/**
 * CPU brain. Difficulty only changes reaction time, risk appetite, blocking and
 * decision quality — never damage or health.
 */
export class AIController {
  readonly profile: AiProfile
  private decisionTimer = 0
  private reactTimer = 0
  private moveDir = 0
  private blockTimer = 0
  private retreatTimer = 0
  private attackPulse: 'punch' | 'kick' | 'special' | null = null
  private jumpPulse = false
  private aggressionBias: number

  constructor(difficulty: Difficulty) {
    this.profile = AI_PROFILES[difficulty]
    this.aggressionBias = 0.85 + Math.random() * 0.3
    this.decisionTimer = 0.2
  }

  private queueAttack(kind: 'punch' | 'kick' | 'special') {
    this.attackPulse = kind
    this.moveDir = 0
    this.decisionTimer = Math.max(0.14, this.profile.reaction * (0.65 + Math.random() * 0.7))
  }

  update(engine: CombatEngine, self: Fighter, opponent: Fighter, dt: number): InputSnapshot {
    if (self.stun > 0 || self.attack) return NEUTRAL
    if (engine.phase !== 'fight') return NEUTRAL

    this.decisionTimer -= dt
    this.reactTimer -= dt
    this.blockTimer = Math.max(0, this.blockTimer - dt)
    this.retreatTimer = Math.max(0, this.retreatTimer - dt)

    const dx = opponent.x - self.x
    const dist = Math.abs(dx)
    const dir = dx >= 0 ? 1 : -1
    const specialRange = self.attacks.special.range
    const oppThreat =
      !!opponent.attack &&
      opponent.attackPhase !== 'recovery' &&
      dist < opponent.attack.spec.range + 0.55

    // Reaction-based blocking. Easy AI reacts late and sometimes not at all.
    if (oppThreat && this.reactTimer <= 0) {
      this.reactTimer = this.profile.reaction * (0.7 + Math.random() * 0.6)
      if (Math.random() < this.profile.block) {
        this.blockTimer = 0.2 + Math.random() * 0.22
        this.moveDir = 0
      }
    }

    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.profile.reaction * (0.7 + Math.random() * 0.8)
      this.decide(self, opponent, dist, dir, specialRange, oppThreat)
    }

    const input: InputSnapshot = { ...NEUTRAL }
    if (this.blockTimer > 0) {
      input.block = true
    } else {
      if (this.moveDir < 0) input.left = true
      if (this.moveDir > 0) input.right = true
    }
    if (this.attackPulse) {
      if (this.attackPulse === 'punch') input.punch = true
      if (this.attackPulse === 'kick') input.kick = true
      if (this.attackPulse === 'special') input.special = true
      this.attackPulse = null
    }
    if (this.jumpPulse) {
      input.up = true
      this.jumpPulse = false
    }
    return input
  }

  private decide(
    self: Fighter,
    opponent: Fighter,
    dist: number,
    dir: 1 | -1,
    specialRange: number,
    oppThreat: boolean,
  ) {
    const p = this.profile
    const r = Math.random() * this.aggressionBias
    const opponentVulnerable =
      opponent.stun > 0 || (!!opponent.attack && opponent.attackPhase === 'recovery')

    // Punish whiffs and hitstun with a real combo starter.
    if (opponentVulnerable && dist < 2.2 && Math.random() < p.punish) {
      this.queueAttack(dist < 1.6 || Math.random() < 0.6 ? 'punch' : 'kick')
      return
    }

    if (!self.grounded) {
      if (dist < 2.25 && Math.random() < 0.5) this.queueAttack('kick')
      return
    }

    if (oppThreat && this.blockTimer > 0) {
      // Already guarding: hold position and look for a counter after the attack.
      if (opponent.attackPhase === 'recovery' && dist < 2.0 && Math.random() < p.punish) {
        this.queueAttack('punch')
      }
      return
    }

    // Anti-turtle: jump in or kick through a blocking opponent.
    if (opponent.blocking && dist < 2.3 && Math.random() < 0.22 + p.aggression * 0.15) {
      if (Math.random() < 0.35 + p.jump) {
        this.jumpPulse = true
        this.moveDir = dir
      } else {
        this.queueAttack('kick')
      }
      return
    }

    if (self.specialReady && dist <= specialRange && Math.random() < p.special) {
      this.queueAttack('special')
      return
    }

    if (dist > 2.35) {
      this.moveDir = dir
      if (Math.random() < p.retreat * 0.25) this.moveDir = 0
      return
    }

    if (dist > 1.6) {
      if (Math.random() < p.aggression * 0.8) {
        if (dist < 1.95) this.queueAttack(Math.random() < 0.55 ? 'kick' : 'punch')
        else this.moveDir = dir
      } else {
        this.moveDir = Math.random() < 0.4 ? -dir : 0
      }
      return
    }

    // Close range mix-up.
    if (r < p.aggression) {
      const punchBias = self.character.stats.technique >= 8 ? 0.7 : 0.58
      this.queueAttack(Math.random() < punchBias ? 'punch' : 'kick')
    } else if (self.specialReady && Math.random() < p.special * 0.6) {
      this.queueAttack('special')
    } else if (Math.random() < p.retreat) {
      this.moveDir = -dir
      this.retreatTimer = 0.3
    } else {
      this.moveDir = 0
    }
  }
}
