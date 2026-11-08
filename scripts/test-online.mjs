// End-to-end protocol test for the authoritative online server.
// Run with: npm run test:online
import { spawn } from 'node:child_process'
import { io } from 'socket.io-client'

const PORT = Number(process.env.TEST_PORT || 3199)
const URL = `http://127.0.0.1:${PORT}`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let server
let host
let guest
let failures = 0

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function waitForHealth(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  return (async () => {
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${URL}/health`)
        if (response.ok) return response.json()
      } catch {
        // server still booting
      }
      await sleep(120)
    }
    throw new Error('Server did not become healthy in time.')
  })()
}

function connectClient(label) {
  return new Promise((resolve, reject) => {
    const socket = io(URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
    })
    const timer = setTimeout(() => {
      socket.disconnect()
      reject(new Error(`${label} could not connect.`))
    }, 6000)
    socket.once('connect', () => {
      clearTimeout(timer)
      resolve(socket)
    })
    socket.once('connect_error', (error) => {
      clearTimeout(timer)
      reject(new Error(`${label}: ${error.message}`))
    })
  })
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (error, response) => {
      if (error) reject(new Error(`${event} timed out.`))
      else resolve(response)
    })
  })
}

function waitFor(socket, event, predicate = () => true, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent)
      reject(new Error(`Timed out waiting for ${event}.`))
    }, timeoutMs)
    const onEvent = (payload) => {
      if (!predicate(payload)) return
      clearTimeout(timer)
      socket.off(event, onEvent)
      resolve(payload)
    }
    socket.on(event, onEvent)
  })
}

async function main() {
  console.log(`[test:online] starting server on ${URL}`)
  server = spawn(process.execPath, ['server/index.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout.on('data', (data) => process.stdout.write(`  server | ${data}`))
  server.stderr.on('data', (data) => process.stderr.write(`  server ! ${data}`))

  const health = await waitForHealth()
  check('server /health responds', health.ok === true)

  host = await connectClient('host')
  guest = await connectClient('guest')
  check('two clients connect', host.connected && guest.connected)

  const created = await emitAck(host, 'room:create', {
    name: 'Host Test',
    character: 'shubh',
    arena: 'indore',
    roundsToWin: 1,
    roundSeconds: 30,
  })
  check('host creates room', created.ok === true, created.error)
  check('host gets slot 0', created.ok && created.slot === 0)
  const code = created.ok ? created.code : ''
  check('room code is 5 characters', /^[A-Z0-9]{5}$/.test(code), code)

  const joined = await emitAck(guest, 'room:join', {
    code,
    name: 'Guest Test',
    character: 'mitansh',
  })
  check('guest joins room', joined.ok === true, joined.error)
  check('guest gets slot 1', joined.ok && joined.slot === 1)
  check('room has two players', joined.ok && joined.room.players.length === 2)

  const hostUpdate = await waitFor(host, 'room:update', (room) => room.players.length === 2, 3000)
  check('host receives room update', hostUpdate.players.length === 2)

  host.emit('room:character', { character: 'shubh' })
  guest.emit('room:character', { character: 'mitansh' })
  host.emit('room:rules', { roundsToWin: 1, roundSeconds: 30 })
  host.emit('room:arena', { arena: 'indore' })

  const startPromise = waitFor(guest, 'match:start', () => true, 8000)
  host.emit('room:ready', { ready: true })
  guest.emit('room:ready', { ready: true })
  const start = await startPromise
  check('match starts when both ready', !!start && start.code === code)
  check('match uses host arena', start.arena === 'indore')
  check('match exposes both fighters', start.p1.character === 'shubh' && start.p2.character === 'mitansh')

  const events = []
  let latest = null
  let firstFight = null
  guest.on('match:state', ({ snapshot, events: tickEvents }) => {
    latest = snapshot
    if (snapshot.phase === 'fight' && !firstFight) firstFight = snapshot
    events.push(...tickEvents)
  })

  const fight = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Fight phase did not start.')), 8000)
    const poll = setInterval(() => {
      if (firstFight) {
        clearTimeout(timer)
        clearInterval(poll)
        resolve(firstFight)
      }
    }, 50)
  })
  check('round intro reaches fight phase', fight.phase === 'fight')
  check('server owns both health values', fight.p1.health === 100 && fight.p2.health === 100)

  const startX = fight.p1.x
  const moveTimer = setInterval(() => {
    host.emit('input', { input: { right: true } })
  }, 40)
  await sleep(1350)
  clearInterval(moveTimer)
  host.emit('input', { input: {} })
  await sleep(250)
  check('movement is applied by server', latest && latest.p1.x > startX + 1.5, latest ? `x ${startX} -> ${latest.p1.x}` : 'no snapshot')

  let punchOn = false
  const punchTimer = setInterval(() => {
    punchOn = !punchOn
    host.emit('input', { input: punchOn ? { punch: true } : {} })
  }, 65)
  await sleep(2600)
  clearInterval(punchTimer)
  host.emit('input', { input: {} })
  await sleep(350)

  const hits = events.filter((event) => event.type === 'hit' && !event.blocked)
  check('server emits hit events', hits.length > 0, `${hits.length} hits`)
  check('server applies damage', latest && latest.p2.health < 100, latest ? `p2 HP ${latest.p2.health}` : 'no snapshot')
  check('attacker gains meter', latest && latest.p1.power > 50, latest ? `power ${latest.p1.power}` : 'no snapshot')

  host.emit('input', { input: { special: true } })
  await sleep(120)
  host.emit('input', { input: {} })
  await sleep(800)
  const specials = events.filter((event) => event.type === 'special')
  check('special is accepted and broadcast', specials.length > 0, `${specials.length} specials`)

  const beforeLeave = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 2500)
    host.once('room:opponentLeft', () => {
      clearTimeout(timer)
      resolve(true)
    })
    guest.emit('room:leave')
  })
  check('leaving notifies the opponent', beforeLeave === true)

  const finalHealth = await (await fetch(`${URL}/health`)).json()
  check('server health reports rooms', typeof finalHealth.rooms === 'number')

  console.log(`[test:online] ${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
  if (failures > 0) process.exitCode = 1
}

try {
  await main()
} catch (error) {
  console.error(`[test:online] ERROR ${error.message}`)
  process.exitCode = 1
} finally {
  guest?.disconnect()
  host?.disconnect()
  if (server) {
    server.kill()
    await sleep(250)
  }
  setTimeout(() => process.exit(process.exitCode ?? 0), 100)
}
