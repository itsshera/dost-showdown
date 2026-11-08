import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SettingsState } from '../types'

function resolveDefaultServerUrl() {
  const configured = (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/$/, '')
  if (configured) return configured
  // A production build served by our own Node/Socket.IO server uses the same
  // origin, so one deploy gives both the game and the authoritative server.
  if (import.meta.env.PROD && typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    return window.location.origin
  }
  return 'http://localhost:3001'
}

const defaultServerUrl = resolveDefaultServerUrl()

const isCoarse =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

export const DEFAULT_SETTINGS: SettingsState = {
  masterVolume: 0.85,
  musicVolume: 0.4,
  sfxVolume: 0.85,
  muted: false,
  voiceLines: true,
  graphics: isCoarse ? 'medium' : 'high',
  difficulty: 'medium',
  roundsToWin: 2,
  roundSeconds: 60,
  screenShake: true,
  damageNumbers: true,
  showTouchControls: true,
  serverUrl: defaultServerUrl,
  playerName: '',
}

interface SettingsStore extends SettingsState {
  update: (patch: Partial<SettingsState>) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: 'dost-showdown-settings-v1', version: 1 },
  ),
)
