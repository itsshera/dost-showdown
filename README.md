# DOST SHOWDOWN: FRIENDS EDITION

A 3D browser fighting game built around five friends, five signature powers and three arenas. React + TypeScript + Vite + Three.js (React Three Fiber) on the front end, Zustand for state, Web Audio for all sound, and a Node.js + Socket.IO authoritative server for private online rooms.

No copyrighted art, music or voice assets are used. Every fighter, arena, effect and sound is generated procedurally in code.

---

## Quick start

Requirements: **Node.js 18+** (developed on Node 26) and npm.

```bash
cd dost-showdown
npm install
npm run dev
```

Open the printed URL (default `http://127.0.0.1:5173`).

### Online play

Online needs the authoritative server running as a second process:

```bash
# terminal 1
npm run server        # Socket.IO server on http://localhost:3001

# terminal 2
npm run dev
```

Then in the game: **PLAY → ONLINE ARENA**, create a private room, share the 5-character code, and have the second player join the same code (two browser windows or two devices on the same network). The host controls arena, rounds and timer; both players pick a fighter and press **READY UP**. The server starts the match when both are ready.

- Change the server URL in **Settings → Online server URL**, or set `VITE_SERVER_URL` before building/dev.
- For devices on a LAN, point the client at the host machine's IP, e.g. `VITE_SERVER_URL=http://192.168.1.20:3001`, and make sure port 3001 is reachable.
- Health check: `GET http://localhost:3001/health`.

### Production build

```bash
npm run build         # typecheck + vite build -> dist/
npm run preview       # serve the production bundle
npm run server        # also serves dist/ if it exists
```

A production build served by `npm run server` automatically points online play at the **same origin**, so one deploy hosts both the game and the Socket.IO server. Set `VITE_SERVER_URL` only if you split the frontend and server across different hosts.

## Deploy free

### Render (recommended, permanent)

`render.yaml` is included. It creates one free Node web service that builds the app and runs the authoritative server on the same origin.

1. Push this folder to a GitHub repository.
2. Render Dashboard → **New → Blueprint** → select the repo.
3. Open the generated `https://<service>.onrender.com` URL.

Free instances sleep after inactivity and wake on the next request (first load can take ~30s). WebSockets are supported on the free plan. No environment variables are required.

### Vercel/Netlify frontend + Render backend

Deploy `dist/` to Vercel or Netlify and the Node server to Render, then build the frontend with:

```bash
VITE_SERVER_URL=https://your-server.onrender.com npm run build
```

The server already sends `Access-Control-Allow-Origin: *`, so the split setup works.

### Ephemeral no-account tunnel

For a quick share link without signing up, run the production server and expose it with a Cloudflare quick tunnel:

```bash
npm run build
npm run server
cloudflared tunnel --url http://localhost:3001
```

The tunnel prints an HTTPS `*.trycloudflare.com` URL. It works on phones and supports WebSockets, but it lives only while the tunnel process and this machine stay running.

### Tests / checks

```bash
npm run typecheck     # TypeScript, no emit
npm run test:online   # spins up a server on :3199 and runs the full protocol test
npm run build
```

---

## Fighters

| Fighter | Nickname | Signature power | Style |
| --- | --- | --- | --- |
| Anay Ladha | **MOTA MAN** | SNACKQUAKE | Heavy bruiser, giant flying samosa + snack shockwave |
| Shubh Maheshwari | **SHUBH-SHOT** | LUCKY LAG | Fast technical, digital glitch freeze + follow-up strike |
| Shaurya Ladha | **BOSS BYTE** | FOUNDER MODE | Precision all-rounder, robotic interns + task overload |
| Varya Jain | **VARYA VOLTAGE** | VOLTAGE VORTEX | Aggressive speed/power, electric tornado + lightning |
| Mitansh Baldi | **MITTI MISSILE** | BALDI BLAST | Chaotic tank, surprise rocket + huge explosion |

Each fighter has independent power, speed, defense, technique and chaos stats, a distinct silhouette, hair, clothing, accessories and facial expression set.

## Arenas

- **Neon Rooftop** — rainy cyberpunk skyline, neon signs, distant traffic.
- **School Canteen** — long tables, ceiling fans, trophy shelf, very loud lunch break.
- **Indore Showdown** — night-time street stage with banners, crowd and city glow.

Each arena has its own lighting, palette, props, crowd and particle ambience. Camera work includes intro sweeps, close-ups, shake and KO treatment.

---

## Modes

- **Solo vs CPU** — four AI difficulties: Easy, Medium, Hard, INSANE. Difficulty changes decision-making, reaction time and aggression only; it never changes damage or health.
- **Local Multiplayer** — two players on one keyboard.
- **Training Room** — no timer, full meter, passive dummy for learning combos.
- **Online Arena** — private rooms with server-authoritative simulation, room codes, rematch, and disconnect handling.

Best-of-three is the default; rounds and timer are configurable in Settings (and by the host online).

## Controls

### Player 1

| Action | Key |
| --- | --- |
| Move / crouch | `A` / `D`, `W` jump, `S` crouch |
| Punch | `J` |
| Kick | `K` |
| Special | `L` |
| Block | `Shift` |

### Player 2

| Action | Key |
| --- | --- |
| Move / crouch | Arrow keys |
| Punch | `Numpad 1` (fallback `U`) |
| Kick | `Numpad 2` (fallback `I`) |
| Special | `Numpad 3` (fallback `O`) |
| Block | `Numpad 0` (fallback `P`) |

On touch devices an on-screen joystick plus PUNCH / KICK / POWER / BLOCK buttons appear automatically.

### Menus / match

- `Esc` — pause / leave match
- Mouse or touch drag — rotate fighter previews in Character Select
- **Character Select** supports random select, VS screen, per-fighter stats and special info.

---

## Power Lab

The in-game editor lets you rewrite any fighter's display name, nickname, description, power name/description, damage, range, cooldown, special animation, SFX and appearance (colors, hair, accessory, outfit).

- Changes apply immediately across Character Select and matches.
- Everything is validated (name lengths, damage/range/cooldown bounds) and saved to `localStorage`.
- **RESET ALL** restores the base roster.
- Online matches intentionally use the **base roster** stats for fairness, so Power Lab overrides are local-only.

---

## Combat system

- Health, hitboxes/hurtboxes, knockback, blocking (reduced damage), jumping, crouching, cooldowns, combo tracking and a power meter.
- Attacks use startup → active → recovery frames with anti-spam gating and whiff recovery.
- Rounds, timer, KO, round transitions, match end, victory/defeat and rematch.
- Fighters cannot pass through each other; arena bounds are enforced.
- Specials cost meter, have per-character cooldowns and unique procedural animations plus screen effects (sparks, shockwaves, lightning, explosions, damage numbers, slow-mo and camera shake).

## Audio

- All SFX synthesized with the Web Audio API: punches, kicks, blocks, jumps, specials, explosions, KO, menu select/back/hover, victory and defeat.
- Original procedural menu and fight music loops.
- Separate master / music / SFX volume, mute toggle, and optional browser speech-synthesis voice lines.

## Progression

- Wins, losses, current streak, best streak.
- Per-character records and recent match history.
- Results screen with score, duration, max combo and rematch.
- Tournament support is architected (mode/session types and round data) but not exposed as a finished UI.

---

## Architecture

```
dost-showdown/
├─ src/
│  ├─ screens/        Main menu, select, game, online, Power Lab, settings, how-to, results
│  ├─ game/
│  │  ├─ engine/      CombatEngine, Fighter, AI, input, frame data/constants
│  │  ├─ effects/     sparks, shockwaves, explosions, lightning, damage numbers
│  │  ├─ GameCanvas / CameraRig / FighterView / GameHUD / TouchControls
│  │  └─ renderTypes.ts  shared structural renderer contracts
│  ├─ characters/     procedural joint rig, poses/animations, GLB renderer
│  ├─ arenas/         three arenas + shared props/textures
│  ├─ components/     menu scene, previews, portraits, buttons, stat bars
│  ├─ audio/          Web Audio synthesis engine
│  ├─ multiplayer/    Socket.IO client + online snapshot adapter
│  ├─ store/          Zustand: settings, roster, progression, navigation, HUD, online
│  ├─ data/           roster, powers, arenas, editor options
│  └─ utils/          validation
├─ server/            Express + Socket.IO authoritative rooms and 60 Hz simulation
├─ scripts/           test-online.mjs protocol test
└─ public/assets/characters/<id>/  optional GLB replacement slots (README + model.json)
```

### Local vs online rendering

Both modes share the same renderer contracts (`RenderableEngine`, `RenderableFighter`). The local `CombatEngine` steps the simulation on the client; `OnlineMatchEngine` is a thin adapter over server snapshots. The same canvas, camera, HUD and effects layer render both.

### Online authority

The server owns positions, health, meter, rounds and results. Clients send inputs (about 30 Hz); the server simulates at 60 Hz and broadcasts snapshots at 20 Hz plus events. The client never reports damage or health. Host leaving closes the room; a guest leaving notifies the host and returns the room to the lobby.

### Modular GLB pipeline

Characters render procedurally by default. To swap in a custom model, add a GLB to `public/assets/characters/<characterId>/` and set `appearance.modelUrl` (template `model.json` files are included). The renderer loads it with `useGLTF`, clones with `SkeletonUtils`, drives clips with `useAnimations`, and keeps the procedural body as a loading/fallback path. No GLB assets ship with the project.

---

## External dependencies and assets

Runtime: React 18, React DOM, Three.js, @react-three/fiber, @react-three/drei, Zustand, Socket.IO client/server, Express, CORS, lucide-react, Fontsource fonts (Bebas Neue, Rajdhani). Build: Vite, TypeScript, Tailwind CSS, PostCSS, Autoprefixer.

There are no downloaded art, audio, music, voice or model assets. All visuals are procedural geometry/materials and canvas textures; all audio is synthesized at runtime.

---

## What is genuinely working

Verified in this build:

- Startup, production build and clean TypeScript compile.
- Main menu with live 3D scene, all five fighters, progression footer and mode picker.
- Character Select with five rotatable 3D previews, cards, stats, special info, random select and VS screen.
- Local combat engine: movement, jumping, crouching, punch, kick, block (reduced damage), specials with meter/cooldown, combos, knockback, arena bounds, round timer, KO, round and match transitions, results and rematch. Full match flow was verified by stepping `CombatEngine` directly; live browser play verified P1 movement, punches, combos and the pause overlay.
- CPU AI with four profiles that differ in behaviour, not stats (verified by stepping the engine).
- Power Lab editing, validation, immediate reflection and `localStorage` persistence; RESET ALL.
- Settings (audio, graphics, difficulty, rounds, timer, shake, damage numbers, touch controls, server URL) with persistence.
- Three arenas with lighting, props and effects.
- Synthesized SFX, music and volume/mute controls.
- Online private rooms: create/join by code, character/arena/rules sync, ready-up, server-authoritative match, live snapshots, inputs, damage, specials, round flow, result overlay, rematch and leave/disconnect handling.
- `npm run test:online` passes the full protocol suite (connection, room lifecycle, ready, match start, movement, hits, damage, meter, special, leave, health).
- Touch controls render for coarse pointers; desktop keyboard controls verified.

## Known limitations / not fully verified

- **Online play was verified across two desktop browser tabs on one machine** against the local server, including create/join, ready-up, live inputs, damage, KO, result overlay and rematch. Real cross-device/LAN play and high-latency behaviour have not been load-tested.
- **Player 2 keyboard controls** use the same verified input pipeline as Player 1 and were smoke-tested by dispatching the mapped keys. A complete live P2 damage exchange was not confirmed because the automated browser tab throttled `requestAnimationFrame`; the engine-level match simulation covers both fighters.
- **Mobile/touch controls** are implemented and render on touch devices, but were not exercised on physical phones/tablets in this environment.
- **No shipped GLB characters**: the modular loader and slots exist, but the project uses procedural fighters by default.
- **Tournament mode** is future-ready in the data model but has no finished tournament UI.
- **No matchmaking/ranked/lobbies beyond private codes**, no spectator mode, no reconnect-into-match (a dropped connection loses the room).
- The **local Results screen** was not navigated to in the automated browser run because tab throttling prevented finishing a local match; its result payload is produced and verified by the engine, and the equivalent online result overlay was exercised end-to-end.
- Voice lines depend on the browser's `speechSynthesis` voices and are intentionally simple.
- Browser screenshot capture was unavailable in the test environment, so visual checks relied on DOM state, canvas presence, console output and engine simulation rather than image comparison.

---

## Scripts reference

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production bundle |
| `npm run server` | Authoritative Socket.IO server (port 3001, override with `PORT`) |
| `npm run test:online` | End-to-end online protocol test |
| `npm run typecheck` | TypeScript check only |

Built as a friends-edition arcade fighter. Stand back — static is a personality.
