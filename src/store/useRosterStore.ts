import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppearanceConfig, CharacterId, CharacterOverride, PowerConfig, RosterOverrides } from '../types'
import { BASE_CHARACTERS } from '../data/characters'
import { sanitisePower } from '../utils/validation'

interface RosterStore {
  overrides: RosterOverrides
  updateCharacter: (id: CharacterId, patch: Omit<CharacterOverride, 'power' | 'appearance'>) => void
  updatePower: (id: CharacterId, patch: Partial<PowerConfig>) => void
  updateAppearance: (id: CharacterId, patch: Partial<AppearanceConfig>) => void
  resetCharacter: (id: CharacterId) => void
  resetAll: () => void
}

const cleanPatch = (override: CharacterOverride): CharacterOverride => {
  const next: CharacterOverride = { ...override }
  if (next.power) next.power = sanitisePower({ ...BASE_CHARACTERS.anay.power, ...next.power })
  return next
}

export const useRosterStore = create<RosterStore>()(
  persist(
    (set) => ({
      overrides: {},
      updateCharacter: (id, patch) =>
        set((state) => {
          const existing = state.overrides[id] ?? {}
          const next: CharacterOverride = { ...existing, ...patch }
          if (patch.name !== undefined) next.name = patch.name.slice(0, 28)
          if (patch.nickname !== undefined) next.nickname = patch.nickname.slice(0, 22)
          if (patch.description !== undefined) next.description = patch.description.slice(0, 320)
          return { overrides: { ...state.overrides, [id]: cleanPatch(next) } }
        }),
      updatePower: (id, patch) =>
        set((state) => {
          const existing = state.overrides[id] ?? {}
          const base = BASE_CHARACTERS[id].power
          const merged = sanitisePower({ ...base, ...existing.power, ...patch })
          return {
            overrides: {
              ...state.overrides,
              [id]: { ...existing, power: merged },
            },
          }
        }),
      updateAppearance: (id, patch) =>
        set((state) => {
          const existing = state.overrides[id] ?? {}
          return {
            overrides: {
              ...state.overrides,
              [id]: {
                ...existing,
                appearance: { ...BASE_CHARACTERS[id].appearance, ...existing.appearance, ...patch },
              },
            },
          }
        }),
      resetCharacter: (id) =>
        set((state) => {
          const next = { ...state.overrides }
          delete next[id]
          return { overrides: next }
        }),
      resetAll: () => set({ overrides: {} }),
    }),
    { name: 'dost-showdown-roster-v1', version: 1 },
  ),
)
