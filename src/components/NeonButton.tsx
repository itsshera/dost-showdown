import type { ReactNode } from 'react'
import { audio } from '../audio/AudioEngine'

export function NeonButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  icon,
  subtitle,
  sound = 'select',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  className?: string
  disabled?: boolean
  icon?: ReactNode
  subtitle?: string
  sound?: 'select' | 'back' | 'none'
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => {
        if (!disabled) audio.play('hover')
      }}
      onClick={() => {
        if (disabled) return
        if (sound === 'select') audio.play('select')
        if (sound === 'back') audio.play('back')
        onClick?.()
      }}
      className={`btn ${
        variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-ghost'
      } ${className}`}
    >
      {icon && <span className="shrink-0 opacity-90">{icon}</span>}
      <span className="flex flex-col items-start leading-none">
        <span>{children}</span>
        {subtitle && (
          <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.2em] text-current opacity-60">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  )
}
