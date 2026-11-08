import type { AttackKind, AttackSpec, CharacterDefinition } from '../../types'
import { RANGE_LENGTH } from '../../data/characters'

export const GAME = {
  arenaMinX: -7.2,
  arenaMaxX: 7.2,
  gravity: -28,
  jumpVelocity: 8.6,
  airAccel: 9,
  minSeparation: 1.02,
  maxHealth: 100,
  meterMax: 100,
  meterStart: 50,
  specialCost: 50,
  comboWindow: 1.2,
  hitstop: 0.055,
}

const BASE_PUNCH: AttackSpec = {
  kind: 'punch',
  startup: 0.09,
  active: 0.06,
  recovery: 0.16,
  damage: 6,
  range: 1.45,
  height: 1.35,
  knockback: 2.6,
  meterGain: 8,
  meterCost: 0,
  cooldown: 0,
}

const BASE_KICK: AttackSpec = {
  kind: 'kick',
  startup: 0.16,
  active: 0.09,
  recovery: 0.26,
  damage: 11,
  range: 1.75,
  height: 1.05,
  knockback: 4.4,
  meterGain: 12,
  meterCost: 0,
  cooldown: 0,
}

export function buildAttacks(character: CharacterDefinition): Record<AttackKind, AttackSpec> {
  const power = character.power
  return {
    punch: { ...BASE_PUNCH },
    kick: { ...BASE_KICK },
    special: {
      kind: 'special',
      startup: 0.42,
      active: 0.16,
      recovery: 0.52,
      damage: power.damage,
      range: RANGE_LENGTH[power.range],
      height: 1.15,
      knockback: 7.5,
      meterGain: 0,
      meterCost: GAME.specialCost,
      cooldown: power.cooldown,
    },
  }
}

export const attackTotal = (spec: AttackSpec) => spec.startup + spec.active + spec.recovery

export function attackPhase(spec: AttackSpec, elapsed: number): 'startup' | 'active' | 'recovery' {
  if (elapsed < spec.startup) return 'startup'
  if (elapsed < spec.startup + spec.active) return 'active'
  return 'recovery'
}
