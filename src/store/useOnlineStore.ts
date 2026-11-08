import { create } from 'zustand'
import type { OnlineMatchStart, OnlineRoom } from '../multiplayer/client'

type OnlineStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'

interface OnlineStore {
  status: OnlineStatus
  error: string | null
  room: OnlineRoom | null
  matchStart: OnlineMatchStart | null
  mySlot: 0 | 1 | null
  setStatus: (status: OnlineStatus, error?: string | null) => void
  setRoom: (room: OnlineRoom | null) => void
  setMatchStart: (match: OnlineMatchStart | null) => void
  setMySlot: (slot: 0 | 1 | null) => void
  reset: () => void
}

export const useOnlineStore = create<OnlineStore>()((set) => ({
  status: 'idle',
  error: null,
  room: null,
  matchStart: null,
  mySlot: null,
  setStatus: (status, error = null) => set({ status, error }),
  setRoom: (room) => set({ room }),
  setMatchStart: (matchStart) => set({ matchStart }),
  setMySlot: (mySlot) => set({ mySlot }),
  reset: () =>
    set({
      status: 'idle',
      error: null,
      room: null,
      matchStart: null,
      mySlot: null,
    }),
}))
