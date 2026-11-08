import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GameEvent, PowerAnimation } from '../../types'
import type { RenderableEngine } from '../renderTypes'
import { useSettingsStore } from '../../store/useSettingsStore'

interface EffectInstance {
  id: number
  type:
    | 'sparks'
    | 'shockwave'
    | 'explosion'
    | 'lightning'
    | 'damage'
    | 'dust'
    | 'special'
    | 'confetti'
  x: number
  y?: number
  z: number
  color: string
  value?: number
  blocked?: boolean
  special?: PowerAnimation
  fromX?: number
  toX?: number
  life: number
  seed: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function Sparks({
  x,
  y,
  z,
  color,
  count = 22,
  life = 0.55,
  spread = 3.6,
  gravity = 9,
}: {
  x: number
  y: number
  z: number
  color: string
  count?: number
  life?: number
  spread?: number
  gravity?: number
}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const speed = spread * (0.35 + Math.random() * 0.9)
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      velocities[i * 3] = Math.cos(angle) * speed
      velocities[i * 3 + 1] = Math.random() * spread * 0.9
      velocities[i * 3 + 2] = Math.sin(angle) * speed * 0.5
    }
    return { positions, velocities }
  }, [count, spread])

  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.PointsMaterial>(null)
  const elapsed = useRef(0)

  useFrame((_, dt) => {
    elapsed.current += dt
    const pos = geometry.positions
    for (let i = 0; i < count; i += 1) {
      geometry.velocities[i * 3 + 1] -= gravity * dt
      pos[i * 3] += geometry.velocities[i * 3] * dt
      pos[i * 3 + 1] += geometry.velocities[i * 3 + 1] * dt
      pos[i * 3 + 2] += geometry.velocities[i * 3 + 2] * dt
    }
    if (points.current) {
      const attr = points.current.geometry.getAttribute('position') as THREE.BufferAttribute
      attr.needsUpdate = true
    }
    if (material.current) material.current.opacity = clamp01(1 - elapsed.current / life)
  })

  return (
    <points ref={points} position={[x, y, z]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        color={color}
        size={0.085}
        sizeAttenuation
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function Shockwave({ x, z, color, size = 3, life = 0.6 }: { x: number; z: number; color: string; size?: number; life?: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const elapsed = useRef(0)

  useFrame((_, dt) => {
    elapsed.current += dt
    const t = clamp01(elapsed.current / life)
    if (mesh.current) {
      const s = 0.2 + t * size
      mesh.current.scale.set(s, s, s)
    }
    if (material.current) material.current.opacity = (1 - t) * 0.8
  })

  return (
    <mesh ref={mesh} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 1, 48]} />
      <meshBasicMaterial ref={material} color={color} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Explosion({
  x,
  y,
  z,
  color,
  size = 1.6,
  life = 0.75,
}: {
  x: number
  y: number
  z: number
  color: string
  size?: number
  life?: number
}) {
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const elapsed = useRef(0)

  useFrame((_, dt) => {
    elapsed.current += dt
    const t = clamp01(elapsed.current / life)
    if (group.current) {
      const s = 0.2 + t * size
      group.current.scale.set(s, s, s)
      group.current.rotation.y += dt * 2.2
      group.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshBasicMaterial | undefined
        if (mat) mat.opacity = (1 - t) * 0.9
      })
    }
    if (light.current) light.current.intensity = (1 - t) * 26
  })

  return (
    <group ref={group} position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.8, 16, 12]} />
        <meshBasicMaterial color="#fff7ed" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <sphereGeometry args={[0.55, 14, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[-0.4, 0.35, 0.2]}>
        <sphereGeometry args={[0.4, 12, 10]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.75} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={color} intensity={26} distance={8} decay={2} />
    </group>
  )
}

function Lightning({ x, z, color, life = 0.5 }: { x: number; z: number; color: string; life?: number }) {
  const group = useRef<THREE.Group>(null)
  const elapsed = useRef(0)

  const lines = useMemo(() => {
    return Array.from({ length: 3 }, (_, l) => {
      const points: THREE.Vector3[] = []
      const startX = x + (l - 1) * 0.4
      const segments = 10
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        points.push(
          new THREE.Vector3(
            startX + (Math.random() - 0.5) * 0.9 * (1 - t),
            7.5 * (1 - t) + 0.6,
            z + (Math.random() - 0.5) * 0.5,
          ),
        )
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        toneMapped: false,
      })
      return new THREE.Line(geometry, material)
    })
  }, [x, z, color])

  useEffect(() => {
    return () => {
      lines.forEach((line) => {
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      })
    }
  }, [lines])

  useFrame((_, dt) => {
    elapsed.current += dt
    const flicker = Math.sin(elapsed.current * 45) > 0 ? 1 : 0.25
    const opacity = Math.max(0, 1 - elapsed.current / life) * flicker
    lines.forEach((line) => {
      ;(line.material as THREE.LineBasicMaterial).opacity = opacity
    })
    if (group.current) group.current.visible = elapsed.current < life
  })

  return (
    <group ref={group}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
}

function DamageNumber({
  x,
  y,
  z,
  value,
  blocked,
  color,
}: {
  x: number
  y: number
  z: number
  value: number
  blocked?: boolean
  color: string
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 92px Impact, sans-serif'
      ctx.lineWidth = 10
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'
      ctx.strokeText(blocked ? 'BLOCK' : `${value}`, 128, 64)
      ctx.fillStyle = blocked ? '#93c5fd' : color
      ctx.fillText(blocked ? 'BLOCK' : `${value}`, 128, 64)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [value, blocked, color])

  const sprite = useRef<THREE.Sprite>(null)
  const material = useRef<THREE.SpriteMaterial>(null)
  const elapsed = useRef(0)

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, dt) => {
    elapsed.current += dt
    if (sprite.current) {
      sprite.current.position.y += dt * 1.15
      const s = 1 + Math.sin(Math.min(1, elapsed.current * 8) * Math.PI) * 0.15
      sprite.current.scale.set(1.2 * s, 0.6 * s, 1)
    }
    if (material.current) material.current.opacity = Math.max(0, 1 - elapsed.current / 0.9)
  })

  return (
    <sprite ref={sprite} position={[x, y + 1.9, z]}>
      <spriteMaterial ref={material} map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function Dust({ x, z, color = '#94a3b8' }: { x: number; z: number; color?: string }) {
  return <Sparks x={x} y={0.1} z={z} color={color} count={12} life={0.45} spread={1.6} gravity={2} />
}

function SpecialEffect({
  x,
  y,
  z,
  color,
  special,
  fromX,
  toX,
  life,
}: {
  x: number
  y: number
  z: number
  color: string
  special: PowerAnimation
  fromX: number
  toX: number
  life: number
}) {
  const group = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const samosa = useRef<THREE.Group>(null)
  const missile = useRef<THREE.Group>(null)
  const vortex = useRef<THREE.Group>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const shockMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const internGroup = useRef<THREE.Group>(null)
  const [arrived, setArrived] = useState(false)
  const interns = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        delay: i * 0.025,
        offset: 0.4 + Math.random() * 0.6,
      })),
    [],
  )

  useFrame((_, dt) => {
    elapsed.current += dt
    const t = elapsed.current
    const travel = clamp01((t - 0.18) / 0.52)

    if (samosa.current) {
      samosa.current.position.x = fromX + (toX - fromX) * travel
      samosa.current.position.y = y + 1.4 + Math.sin(travel * Math.PI) * 1.8
      samosa.current.rotation.x += dt * 8
      samosa.current.rotation.z += dt * 5
      samosa.current.visible = t > 0.16 && t < 1.05
      const s = t < 0.35 ? 0.4 + t * 4 : 1.7
      samosa.current.scale.setScalar(s)
    }
    if (missile.current) {
      missile.current.position.x = fromX + (toX - fromX) * travel
      missile.current.position.y = y + 0.7 + Math.sin(travel * Math.PI) * 1.1
      missile.current.rotation.z = (toX > fromX ? -1 : 1) * (0.3 + travel * 0.6)
      missile.current.visible = t > 0.1 && t < 0.95
    }
    if (vortex.current) {
      vortex.current.rotation.y += dt * 10
      vortex.current.rotation.z += dt * 3
      const s = Math.min(2.4, 0.5 + t * 3.2)
      vortex.current.scale.setScalar(s)
      vortex.current.position.x = fromX + (toX - fromX) * travel
      vortex.current.visible = t < 1.2
    }
    if (ringA.current && ringB.current && shockMaterial.current) {
      const shockT = clamp01((t - 0.65) / 0.5)
      const s = 0.2 + shockT * 4.2
      ringA.current.scale.set(s, s, s)
      ringB.current.scale.set(s * 0.7, s * 0.7, s * 0.7)
      shockMaterial.current.opacity = Math.max(0, 1 - shockT) * 0.75
      ringA.current.position.x = toX
      ringB.current.position.x = toX
      ringA.current.visible = shockT > 0
      ringB.current.visible = shockT > 0
    }
    if (internGroup.current) {
      const t2 = clamp01((t - 0.3) / 0.6)
      internGroup.current.children.forEach((child, i) => {
        const intern = interns[i]
        if (!intern) return
        const localT = clamp01((t2 - intern.delay) / (1 - intern.delay))
        child.position.x = fromX + (toX - fromX) * localT + Math.cos(intern.angle) * (1 - localT) * intern.offset
        child.position.z = Math.sin(intern.angle) * (1 - localT) * intern.offset
        child.position.y = 0.35 + Math.abs(Math.sin(t * 12 + i)) * 0.1
        child.rotation.y += dt * 5
        child.visible = t > 0.25 && t < 1.1
      })
    }
    if (group.current) group.current.visible = t < life
    if (t > 0.72 && !arrived) setArrived(true)
  })

  const targetY = 1.1

  return (
    <group ref={group}>
      {special === 'snackquake' && (
        <group ref={samosa} position={[fromX, y + 1.4, z]}>
          <mesh castShadow>
            <coneGeometry args={[0.62, 1.05, 4]} />
            <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.35} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.1, 0.32]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.6} />
          </mesh>
          <mesh position={[0.2, 0.3, -0.1]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#a16207" toneMapped={false} />
          </mesh>
          <pointLight color="#fbbf24" intensity={12} distance={5} />
        </group>
      )}

      {special === 'baldiBlast' && (
        <group ref={missile} position={[fromX, y + 0.8, z]}>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.9, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.35} />
          </mesh>
          <mesh position={[0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.18, 0.32, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[-0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.22, 0.25, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
          </mesh>
          <pointLight color="#fb923c" intensity={14} distance={5} />
        </group>
      )}

      {special === 'voltageVortex' && (
        <group ref={vortex} position={[fromX, 1.0, z]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.5, 0, i * 0.6]}>
              <torusGeometry args={[0.8 + i * 0.25, 0.06, 8, 40]} />
              <meshBasicMaterial color={i === 1 ? '#fef3c7' : color} toneMapped={false} transparent opacity={0.85} />
            </mesh>
          ))}
          <pointLight color={color} intensity={18} distance={8} />
        </group>
      )}

      {special === 'founderMode' && (
        <group ref={internGroup}>
          {interns.map((intern, i) => (
            <group key={i}>
              <mesh position={[0, 0.28, 0]}>
                <boxGeometry args={[0.16, 0.24, 0.16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.47, 0]}>
                <boxGeometry args={[0.18, 0.14, 0.18]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.48, 0.095]}>
                <boxGeometry args={[0.12, 0.04, 0.02]} />
                <meshBasicMaterial color={color} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {special === 'luckyLag' && (
        <group>
          {Array.from({ length: 14 }, (_, i) => (
            <mesh
              key={i}
              position={[
                fromX + (Math.random() - 0.5) * 2.4,
                0.4 + Math.random() * 2.2,
                (Math.random() - 0.5) * 1.4,
              ]}
              rotation={[Math.random(), Math.random(), Math.random()]}
            >
              <boxGeometry args={[0.08, 0.08, 0.08]} />
              <meshBasicMaterial color={i % 2 === 0 ? color : '#e0f2fe'} toneMapped={false} transparent opacity={0.9} />
            </mesh>
          ))}
          <Lightning x={toX} z={0} color={color} />
          <Sparks x={toX} y={targetY} z={0} color={color} count={26} spread={3.2} />
        </group>
      )}

      {special === 'custom' && (
        <group position={[fromX, 1.0, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <pointLight color={color} intensity={16} distance={7} />
        </group>
      )}

      {/* Shockwave at target for impact specials */}
      {(special === 'snackquake' || special === 'founderMode' || special === 'baldiBlast' || special === 'custom') && (
        <>
          <mesh ref={ringA} position={[toX, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.7, 1, 48]} />
            <meshBasicMaterial ref={shockMaterial} color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh ref={ringB} position={[toX, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.7, 1, 48]} />
            <meshBasicMaterial color="#fff7ed" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

export function EffectsLayer({ engine }: { engine: RenderableEngine }) {
  const [effects, setEffects] = useState<EffectInstance[]>([])
  const nextId = useRef(1)

  useEffect(() => {
    const timers: number[] = []
    const unsubscribe = engine.onEvent((event: GameEvent) => {
      const settings = useSettingsStore.getState()
      const spawn = (effect: Omit<EffectInstance, 'id'>) => {
        const id = nextId.current++
        setEffects((prev) => [...prev.slice(-34), { ...effect, id }])
        timers.push(
          window.setTimeout(() => {
            setEffects((prev) => prev.filter((e) => e.id !== id))
          }, effect.life * 1000 + 200),
        )
      }

      const fighterX = (player: 'p1' | 'p2') => (player === 'p1' ? engine.p1.x : engine.p2.x)
      const opponentX = (player: 'p1' | 'p2') => (player === 'p1' ? engine.p2.x : engine.p1.x)

      switch (event.type) {
        case 'hit': {
          spawn({
            type: 'sparks',
            x: event.x,
            y: event.y,
            z: 0.2,
            color: event.blocked ? '#93c5fd' : event.special ? '#fbbf24' : event.color,
            life: event.special ? 0.8 : 0.5,
            seed: Math.random(),
          })
          if (event.special) {
            spawn({
              type: 'explosion',
              x: event.x,
              y: event.y,
              z: 0,
              color: event.color,
              life: 0.8,
              seed: Math.random(),
            })
            spawn({
              type: 'shockwave',
              x: event.x,
              z: 0,
              color: event.color,
              life: 0.7,
              seed: Math.random(),
            })
          }
          if (event.blocked) {
            spawn({
              type: 'shockwave',
              x: event.x,
              z: 0,
              color: '#93c5fd',
              life: 0.4,
              seed: Math.random(),
            })
          }
          if (settings.damageNumbers) {
            spawn({
              type: 'damage',
              x: event.x,
              y: event.y - 0.4,
              z: 0.5,
              color: event.blocked ? '#93c5fd' : event.special ? '#fbbf24' : '#fef08a',
              value: event.damage,
              blocked: event.blocked,
              life: 0.95,
              seed: Math.random(),
            })
          }
          break
        }
        case 'block': {
          spawn({
            type: 'shockwave',
            x: event.x,
            z: 0,
            color: '#93c5fd',
            life: 0.35,
            seed: Math.random(),
          })
          break
        }
        case 'special': {
          spawn({
            type: 'special',
            x: event.x,
            y: event.y,
            z: 0,
            color: event.color,
            special: event.animation,
            fromX: event.x,
            toX: opponentX(event.player),
            life: 1.45,
            seed: Math.random(),
          })
          break
        }
        case 'ko': {
          spawn({
            type: 'explosion',
            x: event.x,
            y: event.y,
            z: 0,
            color: '#fbbf24',
            life: 1.1,
            seed: Math.random(),
          })
          spawn({
            type: 'shockwave',
            x: event.x,
            z: 0,
            color: '#f472b6',
            life: 0.9,
            seed: Math.random(),
          })
          spawn({
            type: 'sparks',
            x: event.x,
            y: event.y,
            z: 0,
            color: '#fbbf24',
            life: 1,
            seed: Math.random(),
          })
          break
        }
        case 'jump': {
          spawn({
            type: 'dust',
            x: fighterX(event.player),
            y: 0.05,
            z: 0,
            color: '#cbd5e1',
            life: 0.45,
            seed: Math.random(),
          })
          break
        }
        case 'land': {
          spawn({
            type: 'dust',
            x: fighterX(event.player),
            y: 0.05,
            z: 0,
            color: '#94a3b8',
            life: 0.5,
            seed: Math.random(),
          })
          break
        }
        case 'roundEnd': {
          if (event.winner !== 'draw') {
            spawn({
              type: 'confetti',
              x: fighterX(event.winner),
              y: 2.2,
              z: 0,
              color: '#fbbf24',
              life: 1.4,
              seed: Math.random(),
            })
          }
          break
        }
      }
    })

    return () => {
      unsubscribe()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [engine])

  return (
    <group>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'sparks':
            return <Sparks key={effect.id} x={effect.x} y={effect.y ?? 0} z={effect.z} color={effect.color} life={effect.life} />
          case 'shockwave':
            return <Shockwave key={effect.id} x={effect.x} z={effect.z} color={effect.color} life={effect.life} />
          case 'explosion':
            return <Explosion key={effect.id} x={effect.x} y={effect.y ?? 0} z={effect.z} color={effect.color} life={effect.life} />
          case 'lightning':
            return <Lightning key={effect.id} x={effect.x} z={effect.z} color={effect.color} life={effect.life} />
          case 'damage':
            return (
              <DamageNumber
                key={effect.id}
                x={effect.x}
                y={effect.y ?? 0}
                z={effect.z}
                value={effect.value ?? 0}
                blocked={effect.blocked}
                color={effect.color}
              />
            )
          case 'dust':
            return <Dust key={effect.id} x={effect.x} z={effect.z} color={effect.color} />
          case 'special':
            return (
              <SpecialEffect
                key={effect.id}
                x={effect.x}
                y={effect.y ?? 0}
                z={effect.z}
                color={effect.color}
                special={effect.special ?? 'custom'}
                fromX={effect.fromX ?? effect.x}
                toX={effect.toX ?? effect.x}
                life={effect.life}
              />
            )
          case 'confetti':
            return (
              <Sparks
                key={effect.id}
                x={effect.x}
                y={effect.y ?? 0}
                z={effect.z}
                color={effect.color}
                count={32}
                spread={4.5}
                gravity={4}
                life={effect.life}
              />
            )
          default:
            return null
        }
      })}
    </group>
  )
}
