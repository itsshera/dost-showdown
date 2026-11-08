import express from 'express'
import cors from 'cors'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import { createMatch, getSnapshot, setInput, takeEvents, updateMatch } from './sim.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3001)

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10000,
  pingTimeout: 20000,
})

const rooms = new Map()
const CHARACTERS = new Set(['anay', 'shubh', 'shaurya', 'varya', 'mitansh'])
const ARENAS = new Set(['rooftop', 'canteen', 'indore'])
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeCode() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = ''
    for (let i = 0; i < 5; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    if (!rooms.has(code)) return code
  }
  return `R${Date.now().toString(36).slice(-4).toUpperCase()}`
}

function cleanName(name) {
  const text = String(name ?? '').trim().slice(0, 20)
  return text.length >= 2 ? text : 'Player'
}

function validCharacter(character) {
  return CHARACTERS.has(character) ? character : 'anay'
}

function validArena(arena) {
  return ARENAS.has(arena) ? arena : 'rooftop'
}

function roomPayload(room) {
  return {
    code: room.code,
    hostSlot: 0,
    status: room.status,
    arena: room.arena,
    roundsToWin: room.roundsToWin,
    roundSeconds: room.roundSeconds,
    players: room.players.map((player) => ({
      slot: player.slot,
      name: player.name,
      character: player.character,
      ready: player.ready,
      rematch: player.rematch,
    })),
  }
}

function emitRoom(room) {
  io.to(room.code).emit('room:update', roomPayload(room))
}

function stopMatch(room) {
  if (room.interval) {
    clearInterval(room.interval)
    room.interval = null
  }
  room.match = null
}

function leaveRoom(socket, { silent = false } = {}) {
  const code = socket.data.roomCode
  if (!code) return
  const room = rooms.get(code)
  socket.data.roomCode = null
  socket.leave(code)
  if (!room) return

  const player = room.players.find((p) => p.id === socket.id)
  if (!player) return

  if (player.slot === 0) {
    // The host owns the room. Closing it is clearer than silently renumbering slots.
    stopMatch(room)
    if (!silent) {
      io.to(code).emit('room:closed', { reason: 'The host left the room.' })
    }
    rooms.delete(code)
    return
  }

  stopMatch(room)
  room.players = room.players.filter((p) => p.id !== socket.id)
  room.status = 'lobby'
  room.players.forEach((p) => {
    p.ready = false
    p.rematch = false
  })
  if (!silent) io.to(code).emit('room:opponentLeft', { name: player.name })
  emitRoom(room)
}

function startMatch(room) {
  if (room.players.length < 2) return
  const p1 = room.players.find((p) => p.slot === 0)
  const p2 = room.players.find((p) => p.slot === 1)
  if (!p1 || !p2) return

  stopMatch(room)
  room.status = 'playing'
  const match = createMatch({
    p1Character: p1.character,
    p2Character: p2.character,
    roundsToWin: room.roundsToWin,
    roundSeconds: room.roundSeconds,
  })
  match.arena = room.arena
  room.match = match
  room.players.forEach((p) => {
    p.ready = false
    p.rematch = false
  })

  io.to(room.code).emit('match:start', {
    code: room.code,
    arena: room.arena,
    roundsToWin: room.roundsToWin,
    roundSeconds: room.roundSeconds,
    p1: { slot: 0, name: p1.name, character: p1.character },
    p2: { slot: 1, name: p2.name, character: p2.character },
    serverTime: Date.now(),
  })
  emitRoom(room)

  let last = Date.now()
  room.interval = setInterval(() => {
    const current = rooms.get(room.code)
    if (!current || !room.match || room.status !== 'playing') {
      stopMatch(room)
      return
    }
    const now = Date.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    updateMatch(room.match, dt)
    const snapshot = getSnapshot(room.match, now)
    const events = takeEvents(room.match)
    io.to(room.code).emit('match:state', { snapshot, events })

    if (room.match.finished) {
      const result = room.match.result
      stopMatch(room)
      room.status = 'ended'
      room.players.forEach((p) => {
        p.ready = false
        p.rematch = false
      })
      io.to(room.code).emit('match:end', { result })
      emitRoom(room)
    }
  }, 1000 / 60)
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload = {}, ack = () => {}) => {
    try {
      leaveRoom(socket, { silent: true })
      const code = makeCode()
      const room = {
        code,
        hostId: socket.id,
        status: 'lobby',
        arena: validArena(payload.arena),
        roundsToWin: [1, 2, 3].includes(payload.roundsToWin) ? payload.roundsToWin : 2,
        roundSeconds: [30, 45, 60, 75, 90, 99].includes(payload.roundSeconds) ? payload.roundSeconds : 60,
        players: [
          {
            id: socket.id,
            slot: 0,
            name: cleanName(payload.name),
            character: validCharacter(payload.character),
            ready: false,
            rematch: false,
          },
        ],
        match: null,
        interval: null,
      }
      rooms.set(code, room)
      socket.join(code)
      socket.data.roomCode = code
      ack({ ok: true, code, slot: 0, room: roomPayload(room) })
      emitRoom(room)
    } catch (error) {
      ack({ ok: false, error: 'Could not create room.' })
    }
  })

  socket.on('room:join', (payload = {}, ack = () => {}) => {
    const code = String(payload.code ?? '').trim().toUpperCase()
    const room = rooms.get(code)
    if (!room) {
      ack({ ok: false, error: 'Room not found. Check the code.' })
      return
    }
    if (room.players.some((p) => p.id === socket.id)) {
      ack({ ok: true, code, slot: room.players.find((p) => p.id === socket.id).slot, room: roomPayload(room) })
      return
    }
    if (room.status !== 'lobby') {
      ack({ ok: false, error: 'That room is already in a match.' })
      return
    }
    if (room.players.length >= 2) {
      ack({ ok: false, error: 'Room is full.' })
      return
    }

    leaveRoom(socket, { silent: true })
    const player = {
      id: socket.id,
      slot: 1,
      name: cleanName(payload.name),
      character: validCharacter(payload.character),
      ready: false,
      rematch: false,
    }
    room.players.push(player)
    socket.join(code)
    socket.data.roomCode = code
    ack({ ok: true, code, slot: 1, room: roomPayload(room) })
    emitRoom(room)
  })

  socket.on('room:character', (payload = {}) => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || room.status === 'playing') return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return
    player.character = validCharacter(payload.character)
    player.ready = false
    emitRoom(room)
  })

  socket.on('room:arena', (payload = {}) => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || room.status === 'playing') return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player || player.slot !== 0) return
    room.arena = validArena(payload.arena)
    emitRoom(room)
  })

  socket.on('room:rules', (payload = {}) => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || room.status === 'playing') return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player || player.slot !== 0) return
    if ([1, 2, 3].includes(payload.roundsToWin)) room.roundsToWin = payload.roundsToWin
    if ([30, 45, 60, 75, 90, 99].includes(payload.roundSeconds)) room.roundSeconds = payload.roundSeconds
    emitRoom(room)
  })

  socket.on('room:ready', (payload = {}) => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || room.status === 'playing') return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return
    player.ready = payload.ready === true
    emitRoom(room)
    if (room.players.length === 2 && room.players.every((p) => p.ready)) {
      startMatch(room)
    }
  })

  socket.on('room:rematch', () => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || room.status !== 'ended' || room.players.length < 2) return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return
    player.rematch = true
    emitRoom(room)
    if (room.players.every((p) => p.rematch)) {
      startMatch(room)
    }
  })

  socket.on('input', (payload = {}) => {
    const room = rooms.get(socket.data.roomCode)
    if (!room || !room.match || room.status !== 'playing') return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return
    setInput(room.match, player.slot === 0 ? 'p1' : 'p2', payload.input ?? payload)
  })

  socket.on('room:leave', () => {
    leaveRoom(socket)
  })

  socket.on('disconnect', () => {
    leaveRoom(socket)
  })
})

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    players: [...rooms.values()].reduce((total, room) => total + room.players.length, 0),
    uptime: Math.round(process.uptime()),
  })
})

const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

server.listen(PORT, () => {
  console.log(`[dost-showdown] authoritative server listening on http://localhost:${PORT}`)
  console.log(`[dost-showdown] health: http://localhost:${PORT}/health`)
})
