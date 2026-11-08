import type { CharacterDefinition, CharacterId, RangeClass } from '../types'

export const CHARACTER_IDS: CharacterId[] = ['anay', 'shubh', 'shaurya', 'varya', 'mitansh']

export const BASE_CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  anay: {
    id: 'anay',
    name: 'ANAY LADHA',
    nickname: 'MOTA MAN',
    tagline: 'The Snack-Powered Supernova',
    description:
      'A rounder-than-average legend with a hoodie full of crumbs and absolutely no regrets. Anay fights like a man who has never once shared his fries.',
    dialogue: 'SNACK ATTACK!',
    victoryLine: 'That was a full-course beatdown.',
    defeatLine: 'I let you win. I was hungry.',
    quote: 'Never fight a hungry man with a samosa.',
    color: '#ef4444',
    accent: '#fbbf24',
    assetDir: '/assets/characters/anay/',
    appearance: {
      skin: '#c98b62',
      hair: '#24160f',
      hairStyle: 'quiff',
      outfit: '#d92b3a',
      outfitSecondary: '#8f1420',
      accent: '#fbbf24',
      trousers: '#1b1b24',
      shoes: '#0d0d12',
      accessory: 'none',
      bodyScale: 1.08,
    },
    power: {
      name: 'SNACKQUAKE',
      description:
        'Summons a gigantic flying samosa, takes a bite out of it, then hurls it at the opponent. The resulting snack shockwave has been measured at 9.4 on the Richter scale.',
      damage: 26,
      range: 'Long',
      cooldown: 9,
      animation: 'snackquake',
      sfx: 'explosion',
    },
    stats: { power: 9, speed: 5, defense: 7, technique: 6, chaos: 9 },
  },
  shubh: {
    id: 'shubh',
    name: 'SHUBH MAHESHWARI',
    nickname: 'SHUBH-SHOT',
    tagline: 'The Human Skill Issue',
    description:
      'Sneaky, clever, and always three steps ahead — or at least pretending to be. Shubh fights with lag, frame data and pure audacity.',
    dialogue: 'Skill issue. Probably.',
    victoryLine: 'Skill issue. Probably.',
    defeatLine: 'Lag. Definitely lag.',
    quote: 'It is not cheating if the game allows it.',
    color: '#3b82f6',
    accent: '#38bdf8',
    assetDir: '/assets/characters/shubh/',
    appearance: {
      skin: '#d3a06f',
      hair: '#14110f',
      hairStyle: 'swoop',
      outfit: '#1e3a8a',
      outfitSecondary: '#172554',
      accent: '#38bdf8',
      trousers: '#0f172a',
      shoes: '#e2e8f0',
      accessory: 'headphones',
      bodyScale: 0.99,
    },
    power: {
      name: 'LUCKY LAG',
      description:
        'Glitches reality for just long enough to make the opponent question their internet. Blue particles swarm the arena while Shubh lines up a completely fair follow-up strike.',
      damage: 22,
      range: 'Short',
      cooldown: 7,
      animation: 'luckyLag',
      sfx: 'glitch',
    },
    stats: { power: 7, speed: 8, defense: 5, technique: 9, chaos: 7 },
  },
  shaurya: {
    id: 'shaurya',
    name: 'SHAURYA LADHA',
    nickname: 'BOSS BYTE',
    tagline: 'CEO of Every Side Hustle',
    description:
      'Entrepreneurial, confident and always pitching. Shaurya cannot throw a punch without first scheduling a follow-up meeting about it.',
    dialogue: "LET'S SCALE THIS!",
    victoryLine: "Let's circle back after I win the next one.",
    defeatLine: 'We will call this a learning experience.',
    quote: 'We are not fighting. We are disrupting combat.',
    color: '#e2e8f0',
    accent: '#22d3ee',
    assetDir: '/assets/characters/shaurya/',
    appearance: {
      skin: '#c98b62',
      hair: '#2b1d14',
      hairStyle: 'fade',
      outfit: '#f1f5f9',
      outfitSecondary: '#cbd5e1',
      accent: '#22d3ee',
      trousers: '#1e293b',
      shoes: '#e2e8f0',
      accessory: 'glasses',
      bodyScale: 1.0,
    },
    power: {
      name: 'FOUNDER MODE',
      description:
        'Opens an imaginary laptop and summons an army of miniature robotic interns. They swarm the opponent with deliverables, deadlines and one giant TASK OVERLOAD explosion.',
      damage: 25,
      range: 'Medium',
      cooldown: 9,
      animation: 'founderMode',
      sfx: 'slam',
    },
    stats: { power: 8, speed: 7, defense: 6, technique: 10, chaos: 4 },
  },
  varya: {
    id: 'varya',
    name: 'VARYA JAIN',
    nickname: 'VARYA VOLTAGE',
    tagline: 'Ten Thousand Volts of Attitude',
    description:
      'Energetic, confident and permanently charged. Varya does not enter a room — she causes a small electrical event in it.',
    dialogue: "YOU'RE FINISHED!",
    victoryLine: 'Shocking. Truly shocking.',
    defeatLine: 'My battery was at 2 percent.',
    quote: 'Stand back. Static is a personality.',
    color: '#a855f7',
    accent: '#22d3ee',
    assetDir: '/assets/characters/varya/',
    appearance: {
      skin: '#e0b48a',
      hair: '#1a1423',
      hairStyle: 'ponytail',
      outfit: '#7c3aed',
      outfitSecondary: '#4c1d95',
      accent: '#22d3ee',
      trousers: '#2e1065',
      shoes: '#0ea5e9',
      accessory: 'earrings',
      bodyScale: 0.97,
    },
    power: {
      name: 'VOLTAGE VORTEX',
      description:
        'Spins up a full electric tornado and calls down lightning with the confidence of someone who has never read a safety manual. Blockable, but you will feel it.',
      damage: 28,
      range: 'Medium',
      cooldown: 10,
      animation: 'voltageVortex',
      sfx: 'electric',
    },
    stats: { power: 9, speed: 8, defense: 5, technique: 8, chaos: 6 },
  },
  mitansh: {
    id: 'mitansh',
    name: 'MITANSH BALDI',
    nickname: 'MITTI MISSILE',
    tagline: 'Chaos With a Countdown',
    description:
      'Unpredictable and explosive. Mitansh will look behind you mid-fight, which is your only warning that something rocket-shaped is about to happen.',
    dialogue: 'INCOMING!',
    victoryLine: 'I did not plan that. It just happened.',
    defeatLine: 'I pressed the wrong button. Allegedly.',
    quote: 'If it explodes, it was probably me.',
    color: '#22c55e',
    accent: '#f97316',
    assetDir: '/assets/characters/mitansh/',
    appearance: {
      skin: '#b97a4e',
      hair: '#1c1917',
      hairStyle: 'curls',
      outfit: '#16a34a',
      outfitSecondary: '#14532d',
      accent: '#f97316',
      trousers: '#1f2937',
      shoes: '#111827',
      accessory: 'backpack',
      bodyScale: 1.03,
    },
    power: {
      name: 'BALDI BLAST',
      description:
        'Looks dramatically over their shoulder, summons a rocket from absolutely nowhere and launches it at the opponent. There is no strategy. There is only blast radius.',
      damage: 30,
      range: 'Long',
      cooldown: 11,
      animation: 'baldiBlast',
      sfx: 'missile',
    },
    stats: { power: 9, speed: 6, defense: 8, technique: 5, chaos: 10 },
  },
}

export const RANGE_LENGTH: Record<RangeClass, number> = {
  Short: 2.5,
  Medium: 3.6,
  Long: 4.8,
}

export const RANGE_LABEL: Record<RangeClass, string> = {
  Short: 'Close range burst',
  Medium: 'Mid-screen pressure',
  Long: 'Full-screen threat',
}

export const POWER_ANIMATIONS = [
  { id: 'snackquake', label: 'SNACKQUAKE', hint: 'Giant flying samosa + snack shockwave' },
  { id: 'luckyLag', label: 'LUCKY LAG', hint: 'Digital glitch freeze + follow-up strike' },
  { id: 'founderMode', label: 'FOUNDER MODE', hint: 'Robotic interns + task overload' },
  { id: 'voltageVortex', label: 'VOLTAGE VORTEX', hint: 'Electric tornado + lightning strike' },
  { id: 'baldiBlast', label: 'BALDI BLAST', hint: 'Surprise rocket + huge explosion' },
  { id: 'custom', label: 'CUSTOM SIGNATURE', hint: 'Generic energy nova using character colours' },
] as const

export const SFX_OPTIONS = [
  { id: 'explosion', label: 'Explosion' },
  { id: 'glitch', label: 'Digital glitch' },
  { id: 'electric', label: 'Electric zap' },
  { id: 'missile', label: 'Missile launch' },
  { id: 'slam', label: 'Heavy slam' },
  { id: 'sparkle', label: 'Sparkle burst' },
  { id: 'quack', label: 'Ridiculous honk' },
] as const

export const HAIR_OPTIONS = [
  { id: 'quiff', label: 'Power Quiff' },
  { id: 'swoop', label: 'Sneaky Swoop' },
  { id: 'fade', label: 'Founder Fade' },
  { id: 'ponytail', label: 'Voltage Ponytail' },
  { id: 'curls', label: 'Missile Curls' },
] as const

export const ACCESSORY_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'glasses', label: 'Smart Glasses' },
  { id: 'earrings', label: 'Energy Earrings' },
  { id: 'backpack', label: 'Rocket Pack' },
  { id: 'visor', label: 'Neon Visor' },
] as const

export function getCharacter(
  id: CharacterId,
  roster?: Partial<Record<CharacterId, { name?: string; nickname?: string; description?: string; power?: Partial<CharacterDefinition['power']>; appearance?: Partial<CharacterDefinition['appearance']> }>>,
): CharacterDefinition {
  const base = BASE_CHARACTERS[id]
  const override = roster?.[id]
  if (!override) return base
  return {
    ...base,
    name: override.name ?? base.name,
    nickname: override.nickname ?? base.nickname,
    description: override.description ?? base.description,
    power: { ...base.power, ...override.power },
    appearance: { ...base.appearance, ...override.appearance },
  }
}
