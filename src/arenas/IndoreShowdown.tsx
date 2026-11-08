import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphicsQuality } from '../types'
import { Crowd, FloatingMotes, NeonSign, StringLights } from './common'
import { makeStreetTexture } from './textures'

const SHOPS = [
  { x: -6.2, color: '#9d174d', accent: '#f472b6', sign: 'CHAI POINT', sub: 'GARAM GARAM' },
  { x: -3.1, color: '#a16207', accent: '#fbbf24', sign: 'SAMOSA', sub: '₹20 ONLY' },
  { x: 0, color: '#0f766e', accent: '#22d3ee', sign: 'SWEETS', sub: 'MITHAAI' },
  { x: 3.1, color: '#6d28d9', accent: '#c4b5fd', sign: 'BANGLES', sub: 'CHAURI BAZAAR' },
  { x: 6.2, color: '#9a3412', accent: '#fb923c', sign: 'DHOLAK', sub: 'LIVE MUSIC' },
]

function Bunting({ y = 3.15, z = -2.9, span = 14, count = 22 }: { y?: number; z?: number; span?: number; count?: number }) {
  const flags = useMemo(() => {
    const colors = ['#fbbf24', '#f472b6', '#22d3ee', '#a3e635', '#fb923c']
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1)
      return {
        x: -span / 2 + t * span,
        y: y - Math.sin(t * Math.PI) * 0.6,
        color: colors[i % colors.length],
      }
    })
  }, [y, z, span, count])

  return (
    <group position={[0, 0, z]}>
      {flags.map((flag, i) => (
        <mesh key={i} position={[flag.x, flag.y, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.3, 3]} />
          <meshStandardMaterial color={flag.color} emissive={flag.color} emissiveIntensity={0.18} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function AutoRickshaw({ position }: { position: [number, number, number] }) {
  const wheel = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (wheel.current) wheel.current.rotation.x = state.clock.elapsedTime * 0.6
  })
  return (
    <group position={position} rotation={[0, -0.35, 0]} scale={0.9}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.25, 0.8, 1.9]} />
        <meshStandardMaterial color="#15803d" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.25, -0.15]} castShadow>
        <boxGeometry args={[1.15, 0.38, 1.3]} />
        <meshStandardMaterial color="#facc15" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.02, 0.62]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.06]} />
        <meshStandardMaterial color="#052e16" transparent opacity={0.55} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.78, -1.0]}>
        <boxGeometry args={[0.9, 0.5, 0.12]} />
        <meshStandardMaterial color="#166534" roughness={0.5} />
      </mesh>
      <mesh position={[0.42, 0.82, 0.98]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde68a" emissiveIntensity={1.2} />
      </mesh>
      <group ref={wheel} position={[0, 0.3, 0.65]}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.16, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.3, -0.72]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.14, 14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <pointLight position={[0.5, 0.9, 1.1]} color="#fde68a" intensity={4} distance={3} />
    </group>
  )
}

function ChaiStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.25, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 1, 0.9]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.9, 0.08, 1]} />
        <meshStandardMaterial color="#d6d3d1" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-0.45, 1.2, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#a8a29e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.2, 1.2, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.035, 0.035, 0.32, 6]} />
        <meshStandardMaterial color="#78716c" metalness={0.6} />
      </mesh>
      {[0.15, 0.42, 0.68].map((x) => (
        <mesh key={x} position={[x, 1.12, 0.1]}>
          <cylinderGeometry args={[0.07, 0.055, 0.12, 10]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.2, 1.5, 0]}>
        <boxGeometry args={[1.4, 0.8, 0.06]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} color="#fbbf24" intensity={8} distance={5} />
    </group>
  )
}

export function IndoreShowdown({ quality }: { quality: GraphicsQuality }) {
  const street = useMemo(() => makeStreetTexture(), [])
  useEffect(() => () => street.dispose(), [street])

  const upper = useMemo(() => {
    let seed = 12
    const random = () => {
      seed = (seed * 48271) % 2147483647
      return seed / 2147483647
    }
    return Array.from({ length: 7 }, (_, i) => ({
      x: -9 + i * 3,
      height: 6.5 + random() * 3.5,
      color: i % 2 === 0 ? '#241226' : '#1d0f22',
      windows: 6,
    }))
  }, [])

  return (
    <group>
      <color attach="background" args={['#1a0a1c']} />
      <fog attach="fog" args={['#24101f', 18, 44]} />

      <ambientLight intensity={0.55} color="#ffd7b0" />
      <directionalLight
        position={[-6, 12, 9]}
        intensity={1.6}
        color="#ffe2bd"
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-far={32}
      />
      <pointLight position={[-6, 3, 0]} color="#fb923c" intensity={26} distance={14} decay={1.8} />
      <pointLight position={[6, 3.2, -1]} color="#f472b6" intensity={24} distance={14} decay={1.8} />

      {/* Street floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[17, 10]} />
        <meshStandardMaterial map={street} roughness={0.7} metalness={0.08} />
      </mesh>

      {/* Upper buildings */}
      {upper.map((b, i) => (
        <group key={i} position={[b.x, 0, -8.2]}>
          <mesh position={[0, b.height / 2, 0]}>
            <boxGeometry args={[2.95, b.height, 2]} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>
          {Array.from({ length: b.windows }, (_, w) => (
            <mesh
              key={w}
              position={[-0.9 + (w % 3) * 0.9, 4.4 + Math.floor(w / 3) * 1.6, 1.02]}
            >
              <boxGeometry args={[0.42, 0.62, 0.03]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.75}
                toneMapped={false}
              />
            </mesh>
          ))}
          <mesh position={[0, 3.6, 1.15]}>
            <boxGeometry args={[2.6, 0.08, 0.5]} />
            <meshStandardMaterial color="#3f2a1a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.8, 1.3]}>
            <boxGeometry args={[2.6, 0.35, 0.04]} />
            <meshStandardMaterial color="#2a1a10" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Shopfronts */}
      {SHOPS.map((shop, i) => (
        <group key={shop.sign} position={[shop.x, 0, -5.25]}>
          <mesh position={[0, 1.65, 0]} castShadow>
            <boxGeometry args={[2.85, 3.3, 1.5]} />
            <meshStandardMaterial color={shop.color} roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.25, 0.77]}>
            <boxGeometry args={[1.55, 2.5, 0.06]} />
            <meshStandardMaterial color="#1a1014" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.15, 0.79]}>
            <boxGeometry args={[1.45, 0.55, 0.02]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.55} />
          </mesh>
          {/* Awning */}
          <group position={[0, 2.72, 0.92]} rotation={[0.12, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[2.9, 0.09, 1.35]} />
              <meshStandardMaterial color={shop.accent} roughness={0.7} />
            </mesh>
            {[-1.1, -0.35, 0.35, 1.1].map((x) => (
              <mesh key={x} position={[x, 0.055, 0]}>
                <boxGeometry args={[0.32, 0.02, 1.3]} />
                <meshStandardMaterial color="#fef3c7" roughness={0.75} />
              </mesh>
            ))}
          </group>
          <NeonSign
            text={shop.sign}
            sub={shop.sub}
            position={[0, 3.55, 0.78]}
            color={shop.accent}
            width={2.55}
            height={0.95}
          />
          <pointLight position={[0, 2.4, 1.2]} color={shop.accent} intensity={9} distance={7} decay={2} />
          {/* Steps */}
          <mesh position={[0, 0.06, 0.95]}>
            <boxGeometry args={[2.6, 0.12, 0.55]} />
            <meshStandardMaterial color="#4a2a24" roughness={0.9} />
          </mesh>
          {i === 0 && <ChaiStall position={[0.15, 0, 1.35]} />}
        </group>
      ))}

      {/* Central banner */}
      <NeonSign
        text="INDORE SHOWDOWN"
        sub="SARRAFA BAZAAR // FESTIVAL NIGHT"
        position={[0, 5.1, -4.9]}
        color="#f472b6"
        width={6.2}
        height={1.6}
      />

      {/* Rangoli stage */}
      <group position={[0, 0.015, 0]}>
        {[
          { r: 2.9, color: '#f472b6' },
          { r: 2.35, color: '#fbbf24' },
          { r: 1.75, color: '#22d3ee' },
        ].map((ring) => (
          <mesh key={ring.r} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.r, 0.035, 8, 64]} />
            <meshBasicMaterial color={ring.color} toneMapped={false} transparent opacity={0.65} />
          </mesh>
        ))}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 2.6, 0.02, Math.sin(a) * 2.6]}
              rotation={[-Math.PI / 2, 0, a]}
              scale={[1, 0.5, 1]}
            >
              <circleGeometry args={[0.13, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#fbbf24' : '#fb7185'} toneMapped={false} transparent opacity={0.8} />
            </mesh>
          )
        })}
      </group>

      {/* String lights and bunting */}
      <StringLights y={3.7} z={-2.6} span={15} bulbs={34} />
      <StringLights y={4.2} z={-4.1} span={15} bulbs={30} colors={['#f472b6', '#fbbf24', '#a3e635']} />
      <Bunting y={3.2} z={-3.4} span={15} count={26} />

      {/* Crowd */}
      <Crowd count={quality === 'low' ? 10 : 18} z={-4.35} quality={quality} />

      {/* Street lamps */}
      {[
        [-7.6, 0, 1.3],
        [7.6, 0, 1.3],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 3.2, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 3.2, 0]} color="#fbbf24" intensity={16} distance={9} decay={1.8} />
        </group>
      ))}

      <AutoRickshaw position={[6.7, 0, -2.9]} />
      <ChaiStall position={[-6.9, 0, -2.6]} />

      <FloatingMotes count={90} color="#fbbf24" color2="#f472b6" quality={quality} position={[0, 1.4, -1]} />
    </group>
  )
}
