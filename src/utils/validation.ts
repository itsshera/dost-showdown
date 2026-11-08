import type { PowerConfig, RangeClass } from '../types'

export const LIMITS = {
  damage: { min: 12, max: 40 },
  cooldown: { min: 4, max: 15 },
  name: { min: 2, max: 28 },
  nickname: { min: 2, max: 22 },
  powerName: { min: 2, max: 26 },
  description: { min: 10, max: 320 },
  powerDescription: { min: 10, max: 360 },
  bodyScale: { min: 0.88, max: 1.16 },
} as const

export const clamp = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min

export function sanitisePower(power: PowerConfig): PowerConfig {
  return {
    ...power,
    name: power.name.trim().slice(0, LIMITS.powerName.max) || 'UNTITLED POWER',
    description: power.description.trim().slice(0, LIMITS.powerDescription.max),
    damage: Math.round(clamp(power.damage, LIMITS.damage.min, LIMITS.damage.max)),
    cooldown: Math.round(clamp(power.cooldown, LIMITS.cooldown.min, LIMITS.cooldown.max) * 10) / 10,
    range: (['Short', 'Medium', 'Long'] as RangeClass[]).includes(power.range) ? power.range : 'Medium',
  }
}

export function sanitiseText(value: string, min: number, max: number, fallback: string) {
  const trimmed = value.trim().slice(0, max)
  return trimmed.length >= min ? trimmed : fallback
}

export function hexColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
}
