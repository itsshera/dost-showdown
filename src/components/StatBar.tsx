export function StatBar({
  label,
  value,
  max = 10,
  color = '#22d3ee',
  compact = false,
}: {
  label: string
  value: number
  max?: number
  color?: string
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between gap-3">
        <span className={`font-semibold uppercase tracking-[0.18em] text-slate-400 ${compact ? 'text-[0.6rem]' : 'text-[0.68rem]'}`}>
          {label}
        </span>
        <span className="font-display text-sm text-slate-200">{value}</span>
      </div>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{
            width: `${Math.min(100, (value / max) * 100)}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 10px ${color}55`,
          }}
        />
      </div>
    </div>
  )
}
