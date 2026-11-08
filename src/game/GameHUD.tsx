import { useEffect, useRef, useState } from 'react'
import { Flame, Pause, Shield, Timer, Zap } from 'lucide-react'
import type { HudSnapshot } from '../types'
import { FighterPortrait } from '../components/FighterPortrait'
import { getCharacter } from '../data/characters'
import { useRosterStore } from '../store/useRosterStore'
import { useSettingsStore } from '../store/useSettingsStore'

function RoundPips({ won, total, accent }: { won: number; total: number; accent: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`round-pip ${i < won ? 'won' : ''}`}
          style={i < won ? { background: `linear-gradient(135deg, ${accent}, #22d3ee)` } : undefined}
        />
      ))}
    </div>
  )
}

function HealthBar({
  hud,
  side,
}: {
  hud: HudSnapshot
  side: 'p1' | 'p2'
}) {
  const fighter = hud[side]
  const overrides = useRosterStore((s) => s.overrides)
  const character = getCharacter(fighter.characterId, overrides)
  const percent = Math.max(0, Math.min(100, (fighter.health / Math.max(1, fighter.maxHealth)) * 100))
  const low = percent <= 25
  const mid = percent <= 55 && !low
  const right = side === 'p2'
  const cooldownReady = fighter.cooldownRemaining <= 0
  const cooldownPct = fighter.cooldownTotal > 0 ? (fighter.cooldownRemaining / fighter.cooldownTotal) * 100 : 0
  const powerReady = fighter.power >= 50

  return (
    <div className={`flex min-w-0 flex-1 items-start gap-2 sm:gap-3 ${right ? 'flex-row-reverse' : ''}`}>
      <div className="relative shrink-0">
        <FighterPortrait
          character={character}
          className="h-11 w-11 rounded-sm border border-slate-600/50 bg-slate-950/80 sm:h-14 sm:w-14"
          mood={low ? 'hurt' : fighter.state === 'victory' ? 'happy' : fighter.combo >= 2 ? 'angry' : 'neutral'}
        />
        {fighter.combo >= 2 && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-amber-300/40 bg-amber-500/20 px-1 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.1em] text-amber-100">
            {fighter.combo} HIT
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
          <p className="truncate font-display text-base leading-none tracking-[0.06em] text-white sm:text-xl">
            {fighter.nickname}
          </p>
          <span className="hidden truncate text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">
            {fighter.name}
          </span>
          <span className={`${right ? 'mr-auto' : 'ml-auto'} shrink-0`}>
            <RoundPips won={fighter.wins} total={hud.roundsToWin} accent={character.accent} />
          </span>
        </div>

        <div className="health-track mt-1.5">
          <div
            className="health-ghost"
            style={right ? { width: `${percent}%`, marginLeft: 'auto' } : { width: `${percent}%`, marginRight: 'auto' }}
          />
          <div
            className={`health-fill ${low ? 'low' : mid ? 'mid' : ''}`}
            style={{ width: `${percent}%`, marginLeft: right ? 'auto' : undefined }}
          />
          <div className="absolute inset-y-0 flex w-full items-center justify-between px-1.5">
            <span className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-white/60">
              {Math.ceil(fighter.health)}
            </span>
            <span className="text-[0.48rem] font-bold uppercase tracking-[0.14em] text-white/35">HP</span>
          </div>
        </div>

        <div className={`mt-1 flex items-center gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
          <div className="power-track relative flex-1">
            <div className="power-fill" style={{ width: `${Math.max(0, Math.min(100, fighter.power))}%` }} />
            <span className="power-threshold" style={{ left: '50%' }} />
            {fighter.cooldownRemaining > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-slate-950/70 transition-all"
                style={{ width: `${cooldownPct}%` }}
              />
            )}
          </div>
          <span
            className={`flex shrink-0 items-center gap-1 rounded-sm border px-1 py-0.5 text-[0.46rem] font-bold uppercase tracking-[0.1em] ${
              powerReady
                ? 'border-cyan-300/50 bg-cyan-500/15 text-cyan-100'
                : 'border-slate-700/60 bg-slate-950/60 text-slate-500'
            }`}
            title={cooldownReady ? 'Special ready' : `Special cooling down: ${fighter.cooldownRemaining.toFixed(1)}s`}
          >
            {cooldownReady ? <Zap size={9} /> : <Timer size={9} />}
            {cooldownReady ? 'READY' : `${fighter.cooldownRemaining.toFixed(1)}s`}
          </span>
        </div>
      </div>
    </div>
  )
}

export function GameHUD({ hud, onPause }: { hud: HudSnapshot; onPause: () => void }) {
  const damageNumbers = useSettingsStore((s) => s.damageNumbers)
  const [danger, setDanger] = useState(false)
  const lastHealth = useRef(hud.p1.health)
  const [flashKey, setFlashKey] = useState(0)

  useEffect(() => {
    if (hud.p1.health < lastHealth.current) setFlashKey((k) => k + 1)
    lastHealth.current = hud.p1.health
    setDanger(hud.p1.health / Math.max(1, hud.p1.maxHealth) <= 0.22)
  }, [hud.p1.health, hud.p1.maxHealth])

  const timerText = hud.training ? '∞' : Math.ceil(hud.timer).toString().padStart(2, '0')
  const timerLow = !hud.training && hud.timer <= 10
  const combo = hud.p1.combo >= 2 ? hud.p1 : hud.p2.combo >= 2 ? hud.p2 : null

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {danger && hud.p1.health > 0 && (
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(220,38,38,0.22)_100%)]" />
      )}
      {flashKey > 0 && (
        <div key={flashKey} className="flash-hit absolute inset-0 bg-red-500/25" />
      )}

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#03040a]/90 via-[#03040a]/45 to-transparent px-2 pb-8 pt-2 sm:px-4 sm:pt-3">
        <div className="mx-auto flex max-w-[100rem] items-start gap-2 sm:gap-4">
          <HealthBar hud={hud} side="p1" />

          <div className="flex w-16 shrink-0 flex-col items-center sm:w-24">
            <div
              className={`flex h-11 w-full flex-col items-center justify-center rounded-sm border bg-slate-950/85 sm:h-14 ${
                timerLow ? 'border-red-400/70 shadow-[0_0_22px_rgba(248,113,113,0.35)]' : 'border-slate-600/50'
              }`}
            >
              <span
                className={`font-display text-3xl leading-none tracking-[0.06em] sm:text-4xl ${
                  timerLow ? 'text-red-300' : 'text-white'
                }`}
              >
                {timerText}
              </span>
              <span className="text-[0.44rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                {hud.training ? 'training' : 'seconds'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[0.46rem] font-bold uppercase tracking-[0.14em] text-slate-500">R{hud.round}</span>
              <span className="h-px w-4 bg-slate-700" />
              <span className="text-[0.46rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                BO{hud.roundsToWin * 2 - 1}
              </span>
            </div>
            <button
              type="button"
              onClick={onPause}
              className="pointer-events-auto mt-1.5 flex items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-950/70 px-1.5 py-0.5 text-[0.46rem] font-bold uppercase tracking-[0.12em] text-slate-400 transition hover:border-cyan-400/50 hover:text-white"
            >
              <Pause size={9} /> Esc
            </button>
          </div>

          <HealthBar hud={hud} side="p2" />
        </div>

        <div className="mx-auto mt-1.5 flex max-w-[100rem] items-center justify-between px-1 text-[0.48rem] font-bold uppercase tracking-[0.18em] text-slate-600 sm:px-0">
          <span className="flex items-center gap-1">
            <Shield size={9} /> {hud.p1.state.toUpperCase()}
            {hud.p1.attackPhase ? ` // ${hud.p1.attackPhase}` : ''}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            {hud.training ? 'TRAINING ROOM // NO TIMER' : hud.phase === 'intro' ? 'GET READY' : hud.phase === 'fight' ? 'FIGHT' : 'ROUND OVER'}
            {hud.online && <span className="ml-1 rounded-sm border border-pink-400/40 bg-pink-500/10 px-1 text-pink-200">ONLINE</span>}
          </span>
          <span className="flex items-center gap-1">
            {hud.p2.state.toUpperCase()}
            {hud.p2.attackPhase ? ` // ${hud.p2.attackPhase}` : ''} <Shield size={9} />
          </span>
        </div>
      </div>

      {combo && (
        <div
          key={`${combo.id}-${combo.combo}`}
          className={`combo-pop absolute top-24 flex flex-col ${
            combo.id === 'p1' ? 'left-3 items-start sm:left-6' : 'right-3 items-end sm:right-6'
          }`}
        >
          <span className="font-display text-4xl leading-none text-amber-300 text-shadow-hard sm:text-6xl">
            {combo.combo} HIT
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-amber-200/80">
            <Flame size={10} /> {combo.comboDamage} COMBO DAMAGE
          </span>
        </div>
      )}

      {hud.announcement && (
        <div key={hud.announcementKey} className="absolute inset-x-0 top-[34%] flex flex-col items-center px-4">
          <p className="announcement text-center font-display text-5xl leading-none tracking-[0.08em] text-white sm:text-7xl md:text-8xl">
            {hud.announcement}
          </p>
          {hud.announcementSub && (
            <p className="mt-1.5 text-center text-[0.6rem] font-bold uppercase tracking-[0.28em] text-cyan-200/80 sm:text-xs">
              {hud.announcementSub}
            </p>
          )}
        </div>
      )}

      {damageNumbers && hud.phase === 'training' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-sm border border-lime-400/30 bg-lime-500/10 px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-lime-200">
          Dummy HP {Math.ceil(hud.p2.health)} / {hud.p2.maxHealth}
        </div>
      )}
    </div>
  )
}
