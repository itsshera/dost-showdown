import { create } from 'zustand'
import type { HudSnapshot } from '../types'

export const EMPTY_HUD: HudSnapshot = {
  phase: 'intro',
  timer: 60,
  round: 1,
  roundsToWin: 2,
  p1: {
    id: 'p1',
    characterId: 'anay',
    name: 'ANAY LADHA',
    nickname: 'MOTA MAN',
    health: 100,
    maxHealth: 100,
    power: 50,
    wins: 0,
    combo: 0,
    comboDamage: 0,
    cooldownRemaining: 0,
    cooldownTotal: 9,
    state: 'idle',
    attackPhase: null,
  },
  p2: {
    id: 'p2',
    characterId: 'shubh',
    name: 'SHUBH MAHESHWARI',
    nickname: 'SHUBH-SHOT',
    health: 100,
    maxHealth: 100,
    power: 50,
    wins: 0,
    combo: 0,
    comboDamage: 0,
    cooldownRemaining: 0,
    cooldownTotal: 7,
    state: 'idle',
    attackPhase: null,
  },
  announcement: '',
  announcementSub: '',
  announcementKey: 0,
  comboText: '',
  shake: 0,
  slowMo: 0,
  training: false,
  online: false,
  connection: 'local',
}

interface HudStore {
  hud: HudSnapshot
  setHud: (hud: HudSnapshot) => void
  reset: () => void
}

export const useHudStore = create<HudStore>()((set) => ({
  hud: EMPTY_HUD,
  setHud: (hud) => set({ hud }),
  reset: () => set({ hud: EMPTY_HUD }),
}))
