import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterId, CharacterRecord, MatchRecord, ProgressionState } from '../types'
import { CHARACTER_IDS } from '../data/characters'

const emptyCharacter = (): CharacterRecord => ({ wins: 0, losses: 0, matches: 0, maxCombo: 0 })

const emptyByCharacter = () =>
  CHARACTER_IDS.reduce(
    (acc, id) => {
      acc[id] = emptyCharacter()
      return acc
    },
    {} as Record<CharacterId, CharacterRecord>,
  )

export const DEFAULT_PROGRESSION: ProgressionState = {
  wins: 0,
  losses: 0,
  streak: 0,
  bestStreak: 0,
  byCharacter: emptyByCharacter(),
  history: [],
}

interface ProgressionStore extends ProgressionState {
  recordMatch: (record: MatchRecord) => void
  reset: () => void
}

export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PROGRESSION,
      recordMatch: (record) =>
        set((state) => {
          const character = state.byCharacter[record.playerCharacter] ?? emptyCharacter()
          const streak = record.won ? state.streak + 1 : 0
          return {
            wins: state.wins + (record.won ? 1 : 0),
            losses: state.losses + (record.won ? 0 : 1),
            streak,
            bestStreak: Math.max(state.bestStreak, streak),
            byCharacter: {
              ...state.byCharacter,
              [record.playerCharacter]: {
                wins: character.wins + (record.won ? 1 : 0),
                losses: character.losses + (record.won ? 0 : 1),
                matches: character.matches + 1,
                maxCombo: Math.max(character.maxCombo, record.maxCombo),
              },
            },
            history: [record, ...state.history].slice(0, 30),
          }
        }),
      reset: () => set({ ...DEFAULT_PROGRESSION, byCharacter: emptyByCharacter(), history: [] }),
    }),
    {
      name: 'dost-showdown-progression-v1',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<ProgressionState> | undefined
        return {
          ...current,
          ...p,
          byCharacter: { ...emptyByCharacter(), ...(p?.byCharacter ?? {}) },
          history: p?.history ?? [],
        }
      },
    },
  ),
)
