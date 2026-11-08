import { create } from 'zustand'
import type { ArenaId, CharacterId, Difficulty, GameMode, GameSession, MatchResult, ScreenId } from '../types'

interface NavStore {
  screen: ScreenId
  session: GameSession
  lastResult: MatchResult | null
  selectMode: 'solo' | 'local'
  setScreen: (screen: ScreenId) => void
  setSelectMode: (mode: 'solo' | 'local') => void
  startGame: (opts: {
    mode: GameMode
    p1: CharacterId
    p2: CharacterId
    arena: ArenaId
    difficulty?: Difficulty
  }) => void
  rematch: () => void
  finishMatch: (result: MatchResult) => void
  clearResult: () => void
}

const defaultSession: GameSession = {
  mode: 'solo',
  p1: 'anay',
  p2: 'shubh',
  arena: 'rooftop',
  difficulty: 'medium',
}

export const useNavStore = create<NavStore>()((set, get) => ({
  screen: 'menu',
  session: defaultSession,
  lastResult: null,
  selectMode: 'solo',
  setScreen: (screen) => set({ screen }),
  setSelectMode: (selectMode) => set({ selectMode }),
  startGame: ({ mode, p1, p2, arena, difficulty }) =>
    set({
      session: {
        mode,
        p1,
        p2,
        arena,
        difficulty: difficulty ?? get().session.difficulty,
      },
      lastResult: null,
      screen: 'game',
    }),
  rematch: () => set({ screen: 'game', lastResult: null }),
  finishMatch: (result) => set({ lastResult: result, screen: 'results' }),
  clearResult: () => set({ lastResult: null }),
}))
