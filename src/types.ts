export type CharacterId = 'anay' | 'shubh' | 'shaurya' | 'varya' | 'mitansh'
export type ArenaId = 'rooftop' | 'canteen' | 'indore'
export type GameMode = 'solo' | 'local' | 'online' | 'training'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'
export type GraphicsQuality = 'low' | 'medium' | 'high'
export type ScreenId =
  | 'menu'
  | 'select'
  | 'powerlab'
  | 'howto'
  | 'settings'
  | 'game'
  | 'results'
  | 'online'

export type HairStyle = 'quiff' | 'swoop' | 'fade' | 'ponytail' | 'curls'
export type Accessory = 'none' | 'headphones' | 'glasses' | 'earrings' | 'backpack' | 'visor'
export type PowerAnimation =
  | 'snackquake'
  | 'luckyLag'
  | 'founderMode'
  | 'voltageVortex'
  | 'baldiBlast'
  | 'custom'
export type SfxId =
  | 'explosion'
  | 'glitch'
  | 'electric'
  | 'missile'
  | 'slam'
  | 'sparkle'
  | 'quack'
export type RangeClass = 'Short' | 'Medium' | 'Long'

export interface AppearanceConfig {
  skin: string
  hair: string
  hairStyle: HairStyle
  outfit: string
  outfitSecondary: string
  accent: string
  trousers: string
  shoes: string
  accessory: Accessory
  bodyScale: number
  /** When set, the modular renderer loads this GLB instead of the procedural rig. */
  modelUrl?: string
  modelScale?: number
  modelYOffset?: number
  modelRotation?: number
}

export interface PowerConfig {
  name: string
  description: string
  damage: number
  range: RangeClass
  cooldown: number
  animation: PowerAnimation
  sfx: SfxId
}

export interface CharacterStats {
  power: number
  speed: number
  defense: number
  technique: number
  chaos: number
}

export interface CharacterDefinition {
  id: CharacterId
  name: string
  nickname: string
  tagline: string
  description: string
  dialogue: string
  victoryLine: string
  defeatLine: string
  quote: string
  color: string
  accent: string
  assetDir: string
  appearance: AppearanceConfig
  power: PowerConfig
  stats: CharacterStats
}

export interface CharacterOverride {
  name?: string
  nickname?: string
  description?: string
  power?: Partial<PowerConfig>
  appearance?: Partial<AppearanceConfig>
}

export type RosterOverrides = Partial<Record<CharacterId, CharacterOverride>>

export interface ArenaDefinition {
  id: ArenaId
  name: string
  subtitle: string
  description: string
  accent: string
  secondary: string
  ambience: string
}

export interface MatchRecord {
  id: string
  date: number
  mode: GameMode
  playerCharacter: CharacterId
  opponentCharacter: CharacterId
  arena: ArenaId
  won: boolean
  score: string
  difficulty?: Difficulty
  duration: number
  maxCombo: number
}

export interface CharacterRecord {
  wins: number
  losses: number
  matches: number
  maxCombo: number
}

export interface ProgressionState {
  wins: number
  losses: number
  streak: number
  bestStreak: number
  byCharacter: Record<CharacterId, CharacterRecord>
  history: MatchRecord[]
}

export interface SettingsState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
  voiceLines: boolean
  graphics: GraphicsQuality
  difficulty: Difficulty
  roundsToWin: number
  roundSeconds: number
  screenShake: boolean
  damageNumbers: boolean
  showTouchControls: boolean
  serverUrl: string
  playerName: string
}

export interface GameSession {
  mode: GameMode
  p1: CharacterId
  p2: CharacterId
  arena: ArenaId
  difficulty: Difficulty
}

export interface MatchResult {
  winner: 1 | 2 | 0
  score: [number, number]
  duration: number
  maxCombo: number
  mode: GameMode
  p1: CharacterId
  p2: CharacterId
  arena: ArenaId
  difficulty: Difficulty
}

export type FighterState =
  | 'idle'
  | 'walk'
  | 'backwalk'
  | 'jump'
  | 'crouch'
  | 'block'
  | 'punch'
  | 'kick'
  | 'special'
  | 'hit'
  | 'knockdown'
  | 'victory'
  | 'defeat'
  | 'stunned'

export type AttackKind = 'punch' | 'kick' | 'special'

export interface AttackSpec {
  kind: AttackKind
  startup: number
  active: number
  recovery: number
  damage: number
  range: number
  height: number
  knockback: number
  meterGain: number
  meterCost: number
  cooldown: number
}

export interface InputSnapshot {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  punch: boolean
  kick: boolean
  special: boolean
  block: boolean
}

export interface FighterVisual {
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
  combo: number
  blocking: boolean
  crouching: boolean
  attackKind: AttackKind | null
  attackPhase: 'startup' | 'active' | 'recovery' | null
  wins: number
  flash: number
  specialAnimation: PowerAnimation | null
}

export interface HudFighter {
  id: 'p1' | 'p2'
  characterId: CharacterId
  name: string
  nickname: string
  health: number
  maxHealth: number
  power: number
  wins: number
  combo: number
  comboDamage: number
  cooldownRemaining: number
  cooldownTotal: number
  state: FighterState
  attackPhase: 'startup' | 'active' | 'recovery' | null
}

export interface HudSnapshot {
  phase: 'intro' | 'fight' | 'roundEnd' | 'matchEnd' | 'training'
  timer: number
  round: number
  roundsToWin: number
  p1: HudFighter
  p2: HudFighter
  announcement: string
  announcementSub: string
  announcementKey: number
  comboText: string
  shake: number
  slowMo: number
  training: boolean
  online: boolean
  connection: 'local' | 'connecting' | 'connected' | 'disconnected'
}

export type GameEvent =
  | { type: 'hit'; attacker: 'p1' | 'p2'; x: number; y: number; damage: number; blocked: boolean; special: boolean; color: string }
  | { type: 'special'; player: 'p1' | 'p2'; x: number; y: number; animation: PowerAnimation; color: string }
  | { type: 'ko'; winner: 'p1' | 'p2'; x: number; y: number }
  | { type: 'jump'; player: 'p1' | 'p2' }
  | { type: 'land'; player: 'p1' | 'p2' }
  | { type: 'whoosh'; player: 'p1' | 'p2'; kind: AttackKind }
  | { type: 'block'; player: 'p1' | 'p2'; x: number; y: number }
  | { type: 'roundStart'; round: number }
  | { type: 'roundEnd'; winner: 'p1' | 'p2' | 'draw'; round: number }
  | { type: 'matchEnd'; result: MatchResult }
  | { type: 'announce'; text: string; sub?: string }
  | { type: 'meterFull'; player: 'p1' | 'p2' }
  | { type: 'combo'; player: 'p1' | 'p2'; count: number; damage: number }
  | { type: 'whiff'; player: 'p1' | 'p2' }
  | { type: 'denied'; player: 'p1' | 'p2'; reason: 'meter' | 'cooldown' }
