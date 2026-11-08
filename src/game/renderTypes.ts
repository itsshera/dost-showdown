import type { AttackKind, CharacterDefinition, FighterState, GameEvent, PowerAnimation } from '../types'

/**
 * Structural interfaces shared by the local CombatEngine and the online
 * snapshot adapter. Keeping the renderer on this narrow contract means both
 * engines drive exactly the same models, camera, HUD and effects.
 */
export interface RenderableAttack {
  spec: { kind: AttackKind }
}

export interface RenderableFighter {
  id: 'p1' | 'p2'
  x: number
  y: number
  z: number
  facing: 1 | -1
  state: FighterState
  stateTime: number
  grounded: boolean
  crouching: boolean
  combo: number
  wins: number
  attack: RenderableAttack | null
  attackPhase: 'startup' | 'active' | 'recovery' | null
  specialAnimation: PowerAnimation | null
}

export interface RenderableEngine {
  config: { p1: CharacterDefinition; p2: CharacterDefinition }
  p1: RenderableFighter
  p2: RenderableFighter
  phase: string
  shake: number
  update: (dt: number) => void
  onEvent: (listener: (event: GameEvent) => void) => () => void
}
