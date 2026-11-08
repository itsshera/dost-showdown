import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CircleDot,
  Cpu,
  Dumbbell,
  Flame,
  Gamepad2,
  Globe2,
  Keyboard,
  Shield,
  Sparkles,
  Swords,
  Timer,
  Zap,
} from 'lucide-react'
import { useNavStore } from '../store/useNavStore'
import { audio } from '../audio/AudioEngine'

const TABS = [
  { id: 'basics', label: 'Basics', icon: BookOpen },
  { id: 'controls', label: 'Controls', icon: Keyboard },
  { id: 'combat', label: 'Combat', icon: Swords },
  { id: 'modes', label: 'Modes', icon: Gamepad2 },
] as const

function Key({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <span className={`keycap ${wide ? 'px-3' : ''}`}>{children}</span>
}

export function HowToPlay() {
  const setScreen = useNavStore((s) => s.setScreen)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('basics')

  return (
    <div className="screen vignette grid-bg bg-[#05060f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="arcade-scroll relative z-10 h-full overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                audio.play('back')
                setScreen('menu')
              }}
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/70 bg-slate-950/70 text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
              aria-label="Back to main menu"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.32em] text-amber-300/80">Field manual</p>
              <h1 className="font-display text-3xl leading-none tracking-[0.08em] text-white sm:text-4xl">HOW TO PLAY</h1>
            </div>
            <span className="chip ml-auto hidden border-amber-400/30 bg-amber-500/10 text-amber-200 sm:flex">
              <Sparkles size={11} /> Read this before you lose
            </span>
          </header>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id)
                    audio.play('select')
                  }}
                  className={`tab flex items-center gap-1.5 ${tab === t.id ? 'active' : ''}`}
                >
                  <Icon size={13} /> {t.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-3">
              {tab === 'basics' && (
                <>
                  <div className="panel panel-accent rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-3xl leading-none tracking-[0.05em] text-white">THE PITCH</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Five friends. Three arenas. One extremely questionable power each. Pick a fighter, learn the frame data,
                      and reduce your opponent's health bar to zero before the timer runs out. Best of three rounds by default.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        { icon: Swords, title: 'Strike', text: 'Punch fast, kick harder. Both build power meter.', color: '#f472b6' },
                        { icon: Shield, title: 'Block', text: 'Hold block to cut damage by 72%. Specials still chip.', color: '#93c5fd' },
                        { icon: Zap, title: 'Unleash', text: 'At 50 meter, fire your signature power. It has a cooldown.', color: '#fbbf24' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.title} className="rounded-sm border border-slate-700/60 bg-slate-950/50 p-2.5">
                            <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.18em]" style={{ color: item.color }}>
                              <Icon size={11} /> {item.title}
                            </p>
                            <p className="mt-1 text-[0.7rem] leading-snug text-slate-500">{item.text}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-white">WIN CONDITION</h2>
                    <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-400">
                      <p className="flex gap-2">
                        <CircleDot size={14} className="mt-1 shrink-0 text-cyan-300" />
                        <span>Win a round by KO or by having more health when the timer hits zero.</span>
                      </p>
                      <p className="flex gap-2">
                        <CircleDot size={14} className="mt-1 shrink-0 text-cyan-300" />
                        <span>First fighter to win the configured number of rounds takes the match (best of 3 by default).</span>
                      </p>
                      <p className="flex gap-2">
                        <CircleDot size={14} className="mt-1 shrink-0 text-cyan-300" />
                        <span>A draw on time replays the round. Nobody escapes that easily.</span>
                      </p>
                    </div>
                  </div>
                </>
              )}

              {tab === 'controls' && (
                <>
                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-cyan-200">PLAYER 1 // KEYBOARD</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        { action: 'Move', keys: ['A', 'D'], icon: Keyboard },
                        { action: 'Jump', keys: ['W'], icon: Keyboard },
                        { action: 'Crouch', keys: ['S'], icon: Keyboard },
                        { action: 'Punch', keys: ['J'], icon: Swords },
                        { action: 'Kick', keys: ['K'], icon: Swords },
                        { action: 'Special', keys: ['L'], icon: Zap },
                        { action: 'Block (hold)', keys: ['SHIFT'], icon: Shield },
                        { action: 'Pause', keys: ['ESC'], icon: Timer },
                      ].map((row) => (
                        <div key={row.action} className="flex items-center justify-between gap-2 rounded-sm border border-slate-700/50 bg-slate-950/50 px-2.5 py-1.5">
                          <span className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                            <row.icon size={11} className="text-slate-500" /> {row.action}
                          </span>
                          <span className="flex gap-1">
                            {row.keys.map((k) => (
                              <Key key={k} wide={k.length > 2}>{k}</Key>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-pink-200">PLAYER 2 // KEYBOARD</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        { action: 'Move', keys: ['←', '→'] },
                        { action: 'Jump', keys: ['↑'] },
                        { action: 'Crouch', keys: ['↓'] },
                        { action: 'Punch', keys: ['NUM 1', 'U'] },
                        { action: 'Kick', keys: ['NUM 2', 'I'] },
                        { action: 'Special', keys: ['NUM 3', 'O'] },
                        { action: 'Block (hold)', keys: ['NUM 0', 'P'] },
                      ].map((row) => (
                        <div key={row.action} className="flex items-center justify-between gap-2 rounded-sm border border-slate-700/50 bg-slate-950/50 px-2.5 py-1.5">
                          <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">{row.action}</span>
                          <span className="flex gap-1">
                            {row.keys.map((k) => (
                              <Key key={k} wide={k.length > 2}>{k}</Key>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[0.6rem] leading-snug text-slate-600">
                      Laptop without a numpad? Use U / I / O / P. Both sets work at the same time.
                    </p>
                  </div>

                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-lime-200">MOBILE // TOUCH</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      A virtual joystick appears bottom-left. Drag to move, push up to jump. Punch, kick, power and block
                      buttons sit bottom-right. Turn touch controls on or off in Settings or the pause menu.
                    </p>
                  </div>
                </>
              )}

              {tab === 'combat' && (
                <>
                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-white">FRAME DATA, BUT MAKE IT FUN</h2>
                    <div className="mt-3 space-y-2">
                      {[
                        { label: 'Startup', text: 'Wind-up before a hit can connect. Punches start fast, specials take longer.', color: '#fbbf24' },
                        { label: 'Active', text: 'The window where the hitbox exists. This is when damage happens.', color: '#f87171' },
                        { label: 'Recovery', text: 'You cannot act. Whiff a kick and a good opponent will punish it.', color: '#94a3b8' },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-2 rounded-sm border border-slate-700/50 bg-slate-950/50 p-2.5">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                          <div>
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]" style={{ color: row.color }}>{row.label}</p>
                            <p className="text-[0.72rem] leading-snug text-slate-500">{row.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-amber-200">COMBOS + METER</h2>
                    <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-400">
                      <p>Landing hits inside a short window chains a combo. Later hits in the same combo deal slightly less damage, so a 10-hit combo is not 10 free punches.</p>
                      <p>Punches and kicks build power meter. You start with 50 meter — enough for one special — and cap at 100. Specials cost 50 meter and have their own cooldown, shown next to your power bar.</p>
                      <p>Blocking reduces normal damage by 72% and specials by 55%. You still take chip damage and cannot block attacks from behind.</p>
                    </div>
                  </div>

                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-white">TINY TECH</h2>
                    <ul className="mt-2 grid gap-1.5 text-[0.75rem] leading-snug text-slate-400 sm:grid-cols-2">
                      <li>• Crouching ducks high punches, but kicks still hit.</li>
                      <li>• Jump attacks beat lows. You can punch or kick in the air.</li>
                      <li>• Blocking stops momentum. Release and punish recovery.</li>
                      <li>• Specials launch. Use the space to reset spacing.</li>
                      <li>• Low health does not change damage — only your decisions.</li>
                      <li>• Anti-spam: repeated attacks are governed by startup/recovery.</li>
                    </ul>
                  </div>
                </>
              )}

              {tab === 'modes' && (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { icon: Cpu, title: 'SOLO VS CPU', text: 'Four difficulty levels. Easy reacts late, INSANE blocks everything and punishes whiffs. Health and damage stay identical.', color: '#a855f7' },
                      { icon: Gamepad2, title: 'LOCAL 2P', text: 'Two players on one keyboard. P1 uses WASD + JKL, P2 uses arrows + numpad. Share the screen, not the blame.', color: '#22d3ee' },
                      { icon: Dumbbell, title: 'TRAINING', text: 'No timer, regenerating dummy, full meter. Toggle dummy block, reset the dummy and lab your combos.', color: '#a3e635' },
                      { icon: Globe2, title: 'ONLINE PRIVATE', text: 'Create a room, share the code, both pick fighters and ready up. The Node server runs the authoritative simulation.', color: '#f472b6' },
                    ].map((mode) => {
                      const Icon = mode.icon
                      return (
                        <div key={mode.title} className="panel rounded-sm p-4">
                          <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.18em]" style={{ color: mode.color }}>
                            <Icon size={12} /> {mode.title}
                          </p>
                          <p className="mt-1.5 text-[0.75rem] leading-snug text-slate-400">{mode.text}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="panel rounded-sm p-4 sm:p-5">
                    <h2 className="font-display text-2xl leading-none tracking-[0.06em] text-white">PROGRESSION</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Solo matches update your career wins, losses, streak, per-character record and match history. Everything
                      is stored locally. Power Lab edits persist too, so your custom fighter name and power show up everywhere.
                    </p>
                  </div>
                </>
              )}
            </div>

            <aside className="space-y-3">
              <div className="panel rounded-sm p-4">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                  <Flame size={11} className="text-amber-300" /> Quick combo starters
                </p>
                <div className="mt-2 space-y-2 text-[0.72rem] text-slate-400">
                  <p><b className="text-slate-200">Punch → Punch → Kick</b><br />Fast, safe, builds meter.</p>
                  <p><b className="text-slate-200">Kick → Punch</b><br />Higher damage, tighter timing.</p>
                  <p><b className="text-slate-200">Jump Kick → Punch</b><br />Ambiguous overhead pressure.</p>
                  <p><b className="text-slate-200">Block → Punish recovery → Special</b><br />The classic. Works on humans too.</p>
                </div>
              </div>
              <div className="panel rounded-sm p-4">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                  <Shield size={11} className="text-cyan-300" /> Defence checklist
                </p>
                <ul className="mt-2 space-y-1 text-[0.72rem] leading-snug text-slate-400">
                  <li>• Do not hold block forever — you need meter.</li>
                  <li>• Watch the opponent's startup animation.</li>
                  <li>• Block specials, but respect the chip damage.</li>
                  <li>• Back off after a whiffed special.</li>
                </ul>
              </div>
              <div className="panel-soft rounded-sm p-4">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-500">Good to know</p>
                <p className="mt-1.5 text-[0.7rem] leading-snug text-slate-500">
                  All audio is synthesized in the browser. Character voice lines use your device's speech synthesis, so they
                  may sound different across browsers. You can disable them in Settings.
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-4 flex justify-end pb-4">
            <button
              type="button"
              onClick={() => {
                audio.play('back')
                setScreen('menu')
              }}
              className="btn btn-ghost px-5 py-2.5 text-sm"
            >
              <ArrowLeft size={14} /> Back to menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
