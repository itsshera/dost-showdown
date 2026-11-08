import type { InputSnapshot } from '../../types'

export type PlayerSlot = 'p1' | 'p2'

const emptyInput = (): InputSnapshot => ({
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false,
  kick: false,
  special: false,
  block: false,
})

const KEY_MAP: Record<string, { player: PlayerSlot; action: keyof InputSnapshot }> = {
  KeyA: { player: 'p1', action: 'left' },
  KeyD: { player: 'p1', action: 'right' },
  KeyW: { player: 'p1', action: 'up' },
  KeyS: { player: 'p1', action: 'down' },
  KeyJ: { player: 'p1', action: 'punch' },
  KeyK: { player: 'p1', action: 'kick' },
  KeyL: { player: 'p1', action: 'special' },
  ShiftLeft: { player: 'p1', action: 'block' },
  ShiftRight: { player: 'p1', action: 'block' },

  ArrowLeft: { player: 'p2', action: 'left' },
  ArrowRight: { player: 'p2', action: 'right' },
  ArrowUp: { player: 'p2', action: 'up' },
  ArrowDown: { player: 'p2', action: 'down' },
  Numpad1: { player: 'p2', action: 'punch' },
  Numpad2: { player: 'p2', action: 'kick' },
  Numpad3: { player: 'p2', action: 'special' },
  Numpad0: { player: 'p2', action: 'block' },
  // Fallbacks for laptops without a numpad.
  KeyU: { player: 'p2', action: 'punch' },
  KeyI: { player: 'p2', action: 'kick' },
  KeyO: { player: 'p2', action: 'special' },
  KeyP: { player: 'p2', action: 'block' },
}

const GAME_CODES = new Set(Object.keys(KEY_MAP))

export class InputManager {
  private keys = new Set<string>()
  private virtual: Record<PlayerSlot, InputSnapshot> = { p1: emptyInput(), p2: emptyInput() }
  private attached = false
  private enabled = true

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return
    if (e.repeat) {
      if (GAME_CODES.has(e.code)) e.preventDefault()
      return
    }
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (GAME_CODES.has(e.code)) {
      this.keys.add(e.code)
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (GAME_CODES.has(e.code)) {
      this.keys.delete(e.code)
      e.preventDefault()
    }
  }

  private onBlur = () => this.keys.clear()

  attach() {
    if (this.attached) return
    window.addEventListener('keydown', this.onKeyDown, { passive: false })
    window.addEventListener('keyup', this.onKeyUp, { passive: false })
    window.addEventListener('blur', this.onBlur)
    this.attached = true
  }

  detach() {
    if (!this.attached) return
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.attached = false
    this.keys.clear()
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) this.keys.clear()
  }

  getPlayer(player: PlayerSlot): InputSnapshot {
    const base = this.virtual[player]
    const out: InputSnapshot = { ...base }
    for (const [code, map] of Object.entries(KEY_MAP)) {
      if (map.player === player && this.keys.has(code)) out[map.action] = true
    }
    return out
  }

  setVirtual(player: PlayerSlot, patch: Partial<InputSnapshot>) {
    this.virtual[player] = { ...this.virtual[player], ...patch }
  }

  clearVirtual(player?: PlayerSlot) {
    if (player) this.virtual[player] = emptyInput()
    else this.virtual = { p1: emptyInput(), p2: emptyInput() }
  }

  reset() {
    this.keys.clear()
    this.clearVirtual()
  }
}

export const inputManager = new InputManager()
