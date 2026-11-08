// Authoritative online combat simulation.
// This intentionally mirrors the core rules of the client CombatEngine, but runs
// on the server so neither client can rewrite health, damage or positions.

const RANGE_LENGTH = { Short: 2.5, Medium: 3.6, Long: 4.8 }

export const GAME = {
  arenaMinX: -7.2,
  arenaMaxX: 7.2,
  gravity: -28,
  jumpVelocity: 8.6,
  airAccel: 9,
  minSeparation: 1.02,
  maxHealth: 100,
  meterMax: 100,
  meterStart: 50,
  specialCost: 50,
  comboWindow: 1.2,
}

const CHARACTERS = {
  anay: {
    color: '#ef4444',
    accent: '#fbbf24',
    stats: { speed: 5, defense: 7 },
    power: { damage: 26, range: 'Long', cooldown: 9, animation: 'snackquake', sfx: 'explosion' },
  },
  shubh: {
    color: '#3b82f6',
    accent: '#38bdf8',
    stats: { speed: 8, defense: 5 },
    power: { damage: 22, range: 'Short', cooldown: 7, animation: 'luckyLag', sfx: 'glitch' },
  },
  shaurya: {
    color: '#e2e8f0',
    accent: '#22d3ee',
    stats: { speed: 7, defense: 6 },
    power: { damage: 25, range: 'Medium', cooldown: 9, animation: 'founderMode', sfx: 'slam' },
  },
  varya: {
    color: '#a855f7',
    accent: '#22d3ee',
    stats: { speed: 8, defense: 5 },
    power: { damage: 28, range: 'Medium', cooldown: 10, animation: 'voltageVortex', sfx: 'electric' },
  },
  mitansh: {
    color: '#22c55e',
    accent: '#f97316',
    stats: { speed: 6, defense: 8 },
    power: { damage: 30, range: 'Long', cooldown: 11, animation: 'baldiBlast', sfx: 'missile' },
  },
}

const BASE_PUNCH = {
  kind: 'punch', startup: 0.09, active: 0.06, recovery: 0.16, damage: 6,
  range: 1.45, height: 1.35, knockback: 2.6, meterGain: 8, meterCost: 0, cooldown: 0,
}
const BASE_KICK = {
  kind: 'kick', startup: 0.16, active: 0.09, recovery: 0.26, damage: 11,
  range: 1.75, height: 1.05, knockback: 4.4, meterGain: 12, meterCost: 0, cooldown: 0,
}

const neutral = () => ({
  left: false, right: false, up: false, down: false,
  punch: false, kick: false, special: false, block: false,
})

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export function sanitizeInput(input) {
  const base = neutral()
  if (!input || typeof input !== 'object') return base
  for (const key of Object.keys(base)) base[key] = input[key] === true
  return base
}

function createFighter(id, characterId, x, facing) {
  const data = CHARACTERS[characterId] ?? CHARACTERS.anay
  const power = data.power
  return {
    id,
    characterId,
    x,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    facing,
    grounded: true,
    health: GAME.maxHealth,
    maxHealth: GAME.maxHealth,
    power: GAME.meterStart,
    wins: 0,
    state: 'idle',
    stateTime: 0,
    stun: 0,
    blockstun: 0,
    cooldown: 0,
    flash: 0,
    blocking: false,
    crouching: false,
    attack: null,
    specialAnimation: null,
    combo: 0,
    comboTimer: 0,
    comboDamage: 0,
    maxCombo: 0,
    input: neutral(),
    prevInput: neutral(),
    moveSpeed: 3.7 + data.stats.speed * 0.11,
    defenseMultiplier: Math.max(0.84, 1.08 - data.stats.defense * 0.02),
    powerData: power,
    color: data.color,
    accent: data.accent,
    attacks: {
      punch: { ...BASE_PUNCH },
      kick: { ...BASE_KICK },
      special: {
        kind: 'special',
        startup: 0.42,
        active: 0.16,
        recovery: 0.52,
        damage: power.damage,
        range: RANGE_LENGTH[power.range] ?? RANGE_LENGTH.Medium,
        height: 1.15,
        knockback: 7.5,
        meterGain: 0,
        meterCost: GAME.specialCost,
        cooldown: power.cooldown,
      },
    },
  }
}

function attackTotal(spec) {
  return spec.startup + spec.active + spec.recovery
}

function attackPhase(spec, elapsed) {
  if (elapsed < spec.startup) return 'startup'
  if (elapsed < spec.startup + spec.active) return 'active'
  return 'recovery'
}

function emit(match, event) {
  match.events.push(event)
}

function announce(match, text, sub = '', duration = 1.4) {
  match.announcement = text
  match.announcementSub = sub
  match.announcementKey += 1
  match.announcementTimer = duration
  emit(match, { type: 'announce', text, sub })
}

function resetFighter(fighter, x, facing) {
  fighter.x = x
  fighter.y = 0
  fighter.z = 0
  fighter.vx = 0
  fighter.vy = 0
  fighter.facing = facing
  fighter.grounded = true
  fighter.health = fighter.maxHealth
  fighter.power = GAME.meterStart
  fighter.state = 'idle'
  fighter.stateTime = 0
  fighter.stun = 0
  fighter.blockstun = 0
  fighter.cooldown = 0
  fighter.flash = 0
  fighter.blocking = false
  fighter.crouching = false
  fighter.attack = null
  fighter.specialAnimation = null
  fighter.combo = 0
  fighter.comboTimer = 0
  fighter.comboDamage = 0
  fighter.input = neutral()
  fighter.prevInput = neutral()
}

function setupRound(match) {
  match.phase = 'intro'
  match.introElapsed = 0
  match.introStep = 0
  match.timer = match.roundSeconds
  match.roundEndTimer = 0
  resetFighter(match.p1, -3.1, 1)
  resetFighter(match.p2, 3.1, -1)
  announce(match, `ROUND ${match.round}`, 'GET READY', 1.15)
  emit(match, { type: 'roundStart', round: match.round })
}

export function createMatch({ p1Character, p2Character, roundsToWin = 2, roundSeconds = 60 }) {
  const match = {
    p1: createFighter('p1', p1Character, -3.1, 1),
    p2: createFighter('p2', p2Character, 3.1, -1),
    p1Character,
    p2Character,
    roundsToWin,
    roundSeconds,
    phase: 'intro',
    round: 1,
    timer: roundSeconds,
    matchElapsed: 0,
    introElapsed: 0,
    introStep: 0,
    roundEndTimer: 0,
    matchEndTimer: 0,
    announcement: '',
    announcementSub: '',
    announcementKey: 0,
    announcementTimer: 0,
    shake: 0,
    hitstop: 0,
    timeScale: 1,
    finished: false,
    result: null,
    events: [],
    inputs: { p1: neutral(), p2: neutral() },
  }
  setupRound(match)
  return match
}

export function setInput(match, slot, input) {
  if (!match || match.finished) return
  match.inputs[slot] = sanitizeInput(input)
}

function addPower(fighter, amount, match) {
  const before = fighter.power
  fighter.power = Math.min(GAME.meterMax, Math.max(0, fighter.power + amount))
  if (before < GAME.meterMax && fighter.power >= GAME.meterMax) {
    emit(match, { type: 'meterFull', player: fighter.id })
  }
}

function tickTimers(match, fighter, dt, allowRecover) {
  fighter.stateTime += dt
  fighter.flash = Math.max(0, fighter.flash - dt * 4)
  fighter.cooldown = Math.max(0, fighter.cooldown - dt)
  fighter.blockstun = Math.max(0, fighter.blockstun - dt)

  if (fighter.comboTimer > 0) {
    fighter.comboTimer -= dt
    if (fighter.comboTimer <= 0) {
      if (fighter.combo >= 2) {
        emit(match, {
          type: 'combo',
          player: fighter.id,
          count: fighter.combo,
          damage: Math.round(fighter.comboDamage),
        })
      }
      fighter.combo = 0
      fighter.comboDamage = 0
    }
  }

  if (fighter.stun > 0) {
    fighter.stun = Math.max(0, fighter.stun - dt)
    if (fighter.stun === 0 && allowRecover && fighter.health > 0) {
      if (fighter.state === 'hit' || fighter.state === 'stunned') fighter.state = 'idle'
    }
  }

  if (fighter.attack) {
    fighter.attack.elapsed += dt
    if (fighter.attack.elapsed >= attackTotal(fighter.attack.spec)) {
      fighter.attack = null
      fighter.specialAnimation = null
      if (allowRecover && fighter.health > 0) {
        fighter.state = fighter.grounded ? 'idle' : 'jump'
      }
    }
  }
}

function startAttack(match, fighter, kind) {
  if (fighter.attack || fighter.stun > 0) return
  const spec = fighter.attacks[kind]
  if (kind === 'special') {
    if (fighter.power < GAME.specialCost) {
      emit(match, { type: 'denied', player: fighter.id, reason: 'meter' })
      return
    }
    if (fighter.cooldown > 0) {
      emit(match, { type: 'denied', player: fighter.id, reason: 'cooldown' })
      return
    }
    fighter.power -= GAME.specialCost
    fighter.cooldown = spec.cooldown
    fighter.specialAnimation = fighter.powerData.animation
    emit(match, {
      type: 'special',
      player: fighter.id,
      x: fighter.x,
      y: fighter.y + 1.1,
      animation: fighter.powerData.animation,
      color: fighter.color,
    })
  }
  fighter.attack = { spec, elapsed: 0, hasHit: false, air: !fighter.grounded }
  fighter.state = kind
  fighter.stateTime = 0
  fighter.blocking = false
  if (fighter.grounded) fighter.vx = kind === 'kick' ? fighter.facing * 1.2 : 0
  emit(match, { type: 'whoosh', player: fighter.id, kind })
}

function controlFighter(match, fighter, input, dt) {
  fighter.input = input
  const previous = fighter.prevInput

  if (fighter.stun > 0) {
    fighter.blocking = false
    fighter.crouching = false
    fighter.vx *= Math.exp(-3 * dt)
    fighter.prevInput = input
    return
  }
  if (fighter.attack) {
    fighter.blocking = false
    fighter.crouching = false
    fighter.prevInput = input
    return
  }

  const dir = input.right && !input.left ? 1 : input.left && !input.right ? -1 : 0

  if (!fighter.grounded) {
    fighter.blocking = false
    fighter.crouching = false
    if (dir !== 0) {
      fighter.vx = clamp(
        fighter.vx + dir * GAME.airAccel * dt,
        -fighter.moveSpeed * 1.15,
        fighter.moveSpeed * 1.15,
      )
    }
    if (input.punch && !previous.punch) startAttack(match, fighter, 'punch')
    else if (input.kick && !previous.kick) startAttack(match, fighter, 'kick')
    else if (input.special && !previous.special) startAttack(match, fighter, 'special')
    fighter.prevInput = input
    return
  }

  fighter.crouching = input.down
  fighter.blocking = input.block

  if (fighter.blocking) {
    fighter.state = 'block'
    fighter.vx = 0
  } else if (fighter.crouching) {
    fighter.state = 'crouch'
    fighter.vx = 0
  } else if (input.up && !previous.up) {
    fighter.vy = GAME.jumpVelocity
    fighter.grounded = false
    fighter.state = 'jump'
    fighter.vx = dir * fighter.moveSpeed * 0.85
    emit(match, { type: 'jump', player: fighter.id })
  } else if (dir !== 0) {
    const forward = dir === fighter.facing
    fighter.state = forward ? 'walk' : 'backwalk'
    fighter.vx = dir * fighter.moveSpeed * (forward ? 1 : 0.72)
  } else {
    fighter.state = 'idle'
    fighter.vx = 0
  }

  if (!fighter.blocking) {
    if (input.punch && !previous.punch) startAttack(match, fighter, 'punch')
    else if (input.kick && !previous.kick) startAttack(match, fighter, 'kick')
    else if (input.special && !previous.special) startAttack(match, fighter, 'special')
  }
  fighter.prevInput = input
}

function physics(match, fighter, dt) {
  fighter.x += fighter.vx * dt
  if (!fighter.grounded) {
    fighter.vy += GAME.gravity * dt
    fighter.y += fighter.vy * dt
    if (fighter.y <= 0) {
      fighter.y = 0
      fighter.vy = 0
      fighter.grounded = true
      if (fighter.state === 'jump' && !fighter.attack) fighter.state = 'idle'
      emit(match, { type: 'land', player: fighter.id })
    }
  }
  if (fighter.stun > 0) fighter.vx *= Math.exp(-3.2 * dt)
  if (fighter.state === 'knockdown' || fighter.state === 'defeat') {
    fighter.vx *= Math.exp(-5 * dt)
  }
  fighter.x = clamp(fighter.x, GAME.arenaMinX, GAME.arenaMaxX)
}

function resolveCollision(match) {
  const dx = match.p2.x - match.p1.x
  const distance = Math.abs(dx)
  if (distance >= GAME.minSeparation) return
  const dir = dx >= 0 ? 1 : -1
  const overlap = GAME.minSeparation - distance
  match.p1.x -= (dir * overlap) / 2
  match.p2.x += (dir * overlap) / 2
  match.p1.x = clamp(match.p1.x, GAME.arenaMinX, GAME.arenaMaxX)
  match.p2.x = clamp(match.p2.x, GAME.arenaMinX, GAME.arenaMaxX)
  if (match.p1.x <= GAME.arenaMinX) match.p2.x = Math.max(match.p2.x, GAME.arenaMinX + GAME.minSeparation)
  if (match.p2.x >= GAME.arenaMaxX) match.p1.x = Math.min(match.p1.x, GAME.arenaMaxX - GAME.minSeparation)
}

function faceOpponents(match) {
  const canAct = (f) => !f.attack && f.stun <= 0 && f.blockstun <= 0
  if (canAct(match.p1)) match.p1.facing = match.p2.x >= match.p1.x ? 1 : -1
  if (canAct(match.p2)) match.p2.facing = match.p1.x >= match.p2.x ? 1 : -1
}

function checkHit(match, attacker, target) {
  if (match.phase !== 'fight') return
  const attack = attacker.attack
  if (!attack || attack.hasHit) return
  if (attackPhase(attack.spec, attack.elapsed) !== 'active') return

  const spec = attack.spec
  const dx = target.x - attacker.x
  if (dx * attacker.facing < -0.25) return
  const distance = Math.abs(dx)
  if (distance > spec.range + 0.35) return
  if (spec.kind === 'punch' && target.crouching && !target.blocking) return

  const targetCenter = target.y + (target.crouching ? 0.62 : 0.95)
  const attackCenter = attacker.y + spec.height
  const verticalTolerance = spec.kind === 'special' ? 1.9 : 1.05
  if (Math.abs(targetCenter - attackCenter) > verticalTolerance) return

  attack.hasHit = true
  const targetFacingAttacker = (attacker.x - target.x) * target.facing >= 0
  const blocked = target.blocking && targetFacingAttacker && target.grounded
  const comboScale = Math.max(0.55, 1 - attacker.combo * 0.1)
  let raw = spec.damage * target.defenseMultiplier * comboScale
  if (blocked) raw *= spec.kind === 'special' ? 0.45 : 0.28
  const damage = Math.max(1, Math.round(raw))

  target.health = Math.max(0, target.health - damage)
  target.flash = 1

  if (blocked) {
    target.blockstun = 0.16
    target.vx = attacker.facing * 1.8
    addPower(attacker, 4, match)
    addPower(target, 4, match)
    match.shake = Math.max(match.shake, 0.16)
    emit(match, { type: 'block', player: target.id, x: target.x, y: target.y + 1.05 })
    emit(match, {
      type: 'hit', attacker: attacker.id, x: target.x, y: target.y + 1.1,
      damage, blocked: true, special: spec.kind === 'special', color: target.accent,
    })
  } else {
    attacker.combo = attacker.comboTimer > 0 ? attacker.combo + 1 : 1
    attacker.comboTimer = GAME.comboWindow
    attacker.comboDamage += damage
    attacker.maxCombo = Math.max(attacker.maxCombo, attacker.combo)

    target.stun = spec.kind === 'punch' ? 0.3 : spec.kind === 'kick' ? 0.4 : 0.72
    target.state = 'hit'
    target.attack = null
    target.specialAnimation = null
    target.blocking = false
    target.crouching = false
    target.vx = attacker.facing * spec.knockback
    if (spec.kind === 'special') {
      target.vy = 2.8
      target.grounded = false
    } else if (target.grounded && spec.kind === 'kick') {
      target.vy = 1.4
      target.grounded = false
    }

    addPower(attacker, spec.meterGain, match)
    addPower(target, 6, match)
    match.shake = Math.max(match.shake, spec.kind === 'special' ? 0.52 : 0.26)
    emit(match, {
      type: 'hit', attacker: attacker.id, x: target.x, y: target.y + 1.1,
      damage, blocked: false, special: spec.kind === 'special', color: attacker.accent,
    })
  }

  if (target.health <= 0) {
    target.state = 'knockdown'
    target.stun = 3
    target.vy = 4.5
    target.vx = attacker.facing * 9
    target.grounded = false
    match.shake = 0.8
    emit(match, { type: 'ko', winner: attacker.id, x: target.x, y: target.y + 1.2 })
    endRound(match, attacker.id, 'KO')
  }
}

function endRound(match, winner, reason) {
  if (match.phase !== 'fight') return
  match.phase = 'roundEnd'
  match.roundEndTimer = 3.15
  const winnerFighter = winner === 'p1' ? match.p1 : winner === 'p2' ? match.p2 : null
  const loserFighter = winner === 'p1' ? match.p2 : winner === 'p2' ? match.p1 : null

  if (winnerFighter) {
    winnerFighter.wins += 1
    winnerFighter.state = 'victory'
    winnerFighter.stun = 0
    winnerFighter.attack = null
    winnerFighter.specialAnimation = null
  }
  if (loserFighter) {
    if (reason === 'KO') {
      loserFighter.state = 'knockdown'
      loserFighter.stun = 2.5
    } else {
      loserFighter.state = 'defeat'
      loserFighter.stun = 0
    }
  } else {
    match.p1.state = 'defeat'
    match.p2.state = 'defeat'
    match.p1.stun = 0
    match.p2.stun = 0
  }

  announce(
    match,
    reason === 'KO' ? 'K.O.' : 'TIME UP',
    winnerFighter ? `${winnerFighter.id.toUpperCase()} TAKES THE ROUND` : 'DRAW — ROUND REPLAYED',
    2.2,
  )
  emit(match, { type: 'roundEnd', winner: winner ?? 'draw', round: match.round })
}

function startMatchEnd(match) {
  match.phase = 'matchEnd'
  match.matchEndTimer = 3.1
  const winner = match.p1.wins > match.p2.wins ? match.p1 : match.p2
  const loser = winner === match.p1 ? match.p2 : match.p1
  winner.state = 'victory'
  winner.stun = 0
  winner.attack = null
  loser.state = 'defeat'
  loser.attack = null
  loser.stun = 0
  announce(match, `${winner.id.toUpperCase()} WINS`, 'MATCH COMPLETE', 2.6)
}

function updateIntro(match, dt) {
  match.introElapsed += dt
  if (match.introStep === 0 && match.introElapsed > 0.9) {
    match.introStep = 1
    announce(match, '3', '', 0.42)
  } else if (match.introStep === 1 && match.introElapsed > 1.2) {
    match.introStep = 2
    announce(match, '2', '', 0.42)
  } else if (match.introStep === 2 && match.introElapsed > 1.5) {
    match.introStep = 3
    announce(match, '1', '', 0.42)
  } else if (match.introStep === 3 && match.introElapsed > 1.8) {
    match.introStep = 4
    match.phase = 'fight'
    match.timer = match.roundSeconds
    announce(match, 'FIGHT!', '', 0.85)
  }
  tickTimers(match, match.p1, dt, true)
  tickTimers(match, match.p2, dt, true)
  controlFighter(match, match.p1, neutral(), dt)
  controlFighter(match, match.p2, neutral(), dt)
  physics(match, match.p1, dt)
  physics(match, match.p2, dt)
  resolveCollision(match)
  faceOpponents(match)
}

function updateFight(match, dt) {
  tickTimers(match, match.p1, dt, true)
  tickTimers(match, match.p2, dt, true)
  controlFighter(match, match.p1, match.inputs.p1, dt)
  controlFighter(match, match.p2, match.inputs.p2, dt)
  physics(match, match.p1, dt)
  physics(match, match.p2, dt)
  resolveCollision(match)
  faceOpponents(match)
  checkHit(match, match.p1, match.p2)
  checkHit(match, match.p2, match.p1)

  if (match.phase === 'fight') {
    match.timer = Math.max(0, match.timer - dt)
    match.matchElapsed += dt
    if (match.timer <= 0) {
      const winner =
        match.p1.health === match.p2.health ? null : match.p1.health > match.p2.health ? 'p1' : 'p2'
      endRound(match, winner, 'TIME')
    }
  }
}

function updateRoundEnd(match, dt) {
  tickTimers(match, match.p1, dt, false)
  tickTimers(match, match.p2, dt, false)
  physics(match, match.p1, dt)
  physics(match, match.p2, dt)
  resolveCollision(match)
  match.roundEndTimer -= dt

  if (match.roundEndTimer < 1.5) {
    for (const fighter of [match.p1, match.p2]) {
      if (fighter.state === 'knockdown') fighter.state = 'defeat'
    }
  }

  if (match.roundEndTimer <= 0) {
    if (match.p1.wins >= match.roundsToWin || match.p2.wins >= match.roundsToWin) {
      startMatchEnd(match)
    } else {
      match.round += 1
      setupRound(match)
    }
  }
}

function updateMatchEnd(match, dt) {
  tickTimers(match, match.p1, dt, false)
  tickTimers(match, match.p2, dt, false)
  physics(match, match.p1, dt)
  physics(match, match.p2, dt)
  match.matchEndTimer -= dt
  if (match.matchEndTimer <= 0 && !match.finished) {
    match.finished = true
    const winner = match.p1.wins > match.p2.wins ? 1 : 2
    match.result = {
      winner,
      score: [match.p1.wins, match.p2.wins],
      duration: match.matchElapsed,
      maxCombo: Math.max(match.p1.maxCombo, match.p2.maxCombo),
      mode: 'online',
      p1: match.p1Character,
      p2: match.p2Character,
      arena: match.arena ?? 'rooftop',
      difficulty: 'medium',
    }
    emit(match, { type: 'matchEnd', result: match.result })
  }
}

export function updateMatch(match, rawDt) {
  if (!match || match.finished) return
  const dt = Math.min(rawDt, 1 / 20)
  match.shake = Math.max(0, match.shake - dt * 2.6)
  match.announcementTimer = Math.max(0, match.announcementTimer - dt)

  if (match.hitstop > 0) {
    match.hitstop = Math.max(0, match.hitstop - dt)
    return
  }

  switch (match.phase) {
    case 'intro':
      updateIntro(match, dt)
      break
    case 'fight':
      updateFight(match, dt)
      break
    case 'roundEnd':
      updateRoundEnd(match, dt)
      break
    case 'matchEnd':
      updateMatchEnd(match, dt)
      break
    default:
      break
  }
}

function snapFighter(f) {
  return {
    id: f.id,
    characterId: f.characterId,
    x: Math.round(f.x * 1000) / 1000,
    y: Math.round(f.y * 1000) / 1000,
    z: 0,
    facing: f.facing,
    state: f.state,
    stateTime: Math.round(f.stateTime * 1000) / 1000,
    health: Math.max(0, Math.round(f.health * 10) / 10),
    maxHealth: f.maxHealth,
    power: Math.round(f.power * 10) / 10,
    wins: f.wins,
    cooldown: Math.round(f.cooldown * 100) / 100,
    cooldownTotal: f.powerData.cooldown,
    combo: f.combo,
    comboDamage: Math.round(f.comboDamage),
    blocking: f.blocking,
    crouching: f.crouching,
    grounded: f.grounded,
    attackKind: f.attack?.spec.kind ?? null,
    attackPhase: f.attack ? attackPhase(f.attack.spec, f.attack.elapsed) : null,
    specialAnimation: f.specialAnimation,
  }
}

export function getSnapshot(match, serverTime) {
  return {
    phase: match.phase,
    timer: Math.max(0, Math.round(match.timer * 10) / 10),
    round: match.round,
    roundsToWin: match.roundsToWin,
    p1: snapFighter(match.p1),
    p2: snapFighter(match.p2),
    announcement: match.announcementTimer > 0 ? match.announcement : '',
    announcementSub: match.announcementTimer > 0 ? match.announcementSub : '',
    announcementKey: match.announcementKey,
    shake: match.shake,
    slowMo: 0,
    serverTime,
  }
}

export function takeEvents(match) {
  const events = match.events
  match.events = []
  return events
}
