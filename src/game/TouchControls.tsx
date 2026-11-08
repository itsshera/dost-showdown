import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Shield, Swords, Zap } from 'lucide-react'
import type { HudSnapshot, InputSnapshot } from '../types'
import { inputManager } from './engine/input'

type Action = keyof InputSnapshot

function HoldButton({
  action,
  label,
  sub,
  color,
  size = 62,
  icon,
  onPress,
}: {
  action: Action
  label: string
  sub?: string
  color: string
  size?: number
  icon?: ReactNode
  onPress?: () => void
}) {
  const [active, setActive] = useState(false)
  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setActive(true)
    inputManager.setVirtual('p1', { [action]: true })
    onPress?.()
  }
  const release = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setActive(false)
    inputManager.setVirtual('p1', { [action]: false })
  }
  return (
    <button
      type="button"
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-btn ${active ? 'active' : ''}`}
      style={{ width: size, height: size, borderColor: active ? color : undefined }}
      aria-label={label}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-[0.6rem] leading-none" style={{ color }}>{label}</span>
      {sub && <span className="mt-0.5 text-[0.42rem] font-semibold tracking-[0.08em] text-slate-500">{sub}</span>}
    </button>
  )
}

export function TouchControls({ hud }: { hud: HudSnapshot }) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false })

  const updateJoystick = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = joystickRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const radius = rect.width * 0.34
    let dx = (e.clientX - cx) / radius
    let dy = (e.clientY - cy) / radius
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    }
    setKnob({ x: dx * radius, y: dy * radius, active: true })
    inputManager.setVirtual('p1', {
      left: dx < -0.32,
      right: dx > 0.32,
      up: dy < -0.42,
      down: dy > 0.42,
    })
  }, [])

  const startJoystick = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    updateJoystick(e)
  }

  const moveJoystick = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!knob.active) return
    updateJoystick(e)
  }

  const endJoystick = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setKnob({ x: 0, y: 0, active: false })
    inputManager.setVirtual('p1', { left: false, right: false, up: false, down: false })
  }

  const specialReady = hud.p1.power >= 50 && hud.p1.cooldownRemaining <= 0

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="pointer-events-auto flex flex-col items-center">
        <div
          ref={joystickRef}
          onPointerDown={startJoystick}
          onPointerMove={moveJoystick}
          onPointerUp={endJoystick}
          onPointerCancel={endJoystick}
          className="joy-base relative flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-full border border-slate-500/30 bg-slate-950/45 backdrop-blur-sm"
          aria-label="Movement joystick"
        >
          <span className="absolute inset-3 rounded-full border border-slate-600/20" />
          <span className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-600" />
          <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-600" />
          <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-slate-600" />
          <span className="absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-slate-600" />
          <div
            className="joystick-knob flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/40 bg-gradient-to-br from-slate-700/90 to-slate-950/95 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          >
            <span className="h-5 w-5 rounded-full border border-cyan-200/40 bg-cyan-400/15" />
          </div>
        </div>
        <span className="mt-1 text-[0.48rem] font-bold uppercase tracking-[0.18em] text-slate-600">Move / Jump</span>
      </div>

      <div className="pointer-events-auto flex items-end gap-2">
        <div className="flex flex-col items-center gap-2">
          <HoldButton action="block" label="BLOCK" color="#93c5fd" size={54} icon={<Shield size={16} />} />
          <HoldButton
            action="special"
            label="POWER"
            sub={specialReady ? 'READY' : `${Math.max(0, hud.p1.cooldownRemaining).toFixed(1)}s`}
            color={specialReady ? '#fbbf24' : '#64748b'}
            size={68}
            icon={<Zap size={20} />}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <HoldButton action="punch" label="PUNCH" color="#f472b6" size={62} icon={<Swords size={18} />} />
          <HoldButton action="kick" label="KICK" color="#22d3ee" size={62} icon={<Swords size={18} className="rotate-90" />} />
        </div>
      </div>
    </div>
  )
}
