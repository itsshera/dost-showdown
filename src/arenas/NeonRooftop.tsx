import { useMemo } from 'react'
import * as THREE from 'three'
import type { GraphicsQuality } from '../types'
import { FloatingMotes, NeonSign } from './common'

function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function NeonRooftop({ quality }: { quality: GraphicsQuality }) {
  const buildings = useMemo(() => {
    const random = seeded(42)
    const count = quality === 'low' ? 18 : 32
    return Array.from({ length: count }, () => {
      const width = 1.8 + random() * 3.4
      const height = 3.5 + random() * 14
      const depth = 1.8 + random() * 3
      const x = -30 + random() * 60
      const z = -18 - random() * 20
      const tint = random()
      return {
        x,
        z,
        width,
        height,
        depth,
        color: tint > 0.66 ? '#0c1524' : tint > 0.33 ? '#0a0f1d' : '#101827',
        neon: random() > 0.45 ? (tint > 0.5 ? '#22d3ee' : '#a855f7') : null,
        windows: Math.floor(2 + random() * 4),
      }
    })
  }, [quality])

  const stars = useMemo(() => {
    const random = seeded(7)
    const arr: number[] = []
    for (let i = 0; i < (quality === 'low' ? 100 : 220); i += 1) {
      arr.push(-45 + random() * 90, 8 + random() * 26, -20 - random() * 30)
    }
    return new Float32Array(arr)
  }, [quality])

  return (
    <group>
      <color attach="background" args={['#04030c']} />
      <fog attach="fog" args={['#070613', 20, 52]} />

      <ambientLight intensity={0.32} color="#8b7fd4" />
      <directionalLight
        position={[-8, 14, 8]}
        intensity={1.4}
        color="#d8d0ff"
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-far={40}
      />
      <pointLight position={[-7, 4, -1]} color="#a855f7" intensity={38} distance={18} decay={1.6} />
      <pointLight position={[7, 3.4, -1]} color="#22d3ee" intensity={34} distance={18} decay={1.6} />
      <pointLight position={[0, 2.2, 4]} color="#f472b6" intensity={16} distance={14} decay={2} />

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#dbeafe" size={0.08} sizeAttenuation transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </points>

      {/* Moon */}
      <mesh position={[-13, 15, -32]}>
        <sphereGeometry args={[2.1, 24, 20]} />
        <meshBasicMaterial color="#e9e4ff" toneMapped={false} />
      </mesh>
      <mesh position={[-13, 15, -31.8]}>
        <sphereGeometry args={[2.6, 24, 20]} />
        <meshBasicMaterial color="#8b7fd4" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[-13, 15, -30]} color="#c4b5fd" intensity={40} distance={35} decay={2} />

      {/* Skyline */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.height / 2, 0]}>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial color={b.color} roughness={0.9} metalness={0.15} />
          </mesh>
          {Array.from({ length: b.windows }, (_, w) => (
            <mesh
              key={w}
              position={[
                -b.width / 2 + 0.45 + (w / Math.max(1, b.windows - 1)) * (b.width - 0.9),
                b.height * (0.35 + (w % 3) * 0.16),
                b.depth / 2 + 0.01,
              ]}
            >
              <boxGeometry args={[0.12, b.height * 0.22, 0.02]} />
              <meshBasicMaterial
                color={b.neon ?? '#fbbf24'}
                transparent
                opacity={0.55}
                toneMapped={false}
              />
            </mesh>
          ))}
          {b.neon && (
            <mesh position={[0, b.height + 0.25, 0]}>
              <boxGeometry args={[b.width * 0.8, 0.12, 0.12]} />
              <meshBasicMaterial color={b.neon} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* Rooftop platform */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[16.4, 0.36, 9.4]} />
        <meshStandardMaterial color="#0d0e1b" roughness={0.82} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.6, 8.6]} />
        <meshStandardMaterial color="#111225" roughness={0.55} metalness={0.28} />
      </mesh>
      <gridHelper args={[16, 32, '#7c3aed', '#1e293b']} position={[0, 0.02, 0]}>
        <lineBasicMaterial attach="material" transparent opacity={0.3} />
      </gridHelper>

      {/* Glowing platform edge */}
      {[
        { pos: [0, 0.05, -4.55] as [number, number, number], size: [16.2, 0.06, 0.08] as [number, number, number], color: '#a855f7' },
        { pos: [0, 0.05, 4.55] as [number, number, number], size: [16.2, 0.06, 0.08] as [number, number, number], color: '#22d3ee' },
        { pos: [-8.05, 0.05, 0] as [number, number, number], size: [0.08, 0.06, 8.8] as [number, number, number], color: '#a855f7' },
        { pos: [8.05, 0.05, 0] as [number, number, number], size: [0.08, 0.06, 8.8] as [number, number, number], color: '#22d3ee' },
      ].map((edge, i) => (
        <mesh key={i} position={edge.pos}>
          <boxGeometry args={edge.size} />
          <meshBasicMaterial color={edge.color} toneMapped={false} />
        </mesh>
      ))}

      {/* Back railing */}
      <group position={[0, 0, -4.25]}>
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} position={[-7 + i * 1.4, 0.55, 0]}>
            <boxGeometry args={[0.06, 1.1, 0.06]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {[0.35, 0.85].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[14.2, 0.05, 0.05]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Side railings */}
      {[-7.75, 7.75].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-3.5, -1, 1.5, 4].map((z) => (
            <mesh key={z} position={[0, 0.55, z]}>
              <boxGeometry args={[0.06, 1.1, 0.06]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.05, 0.05, 8.2]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Neon signage */}
      <NeonSign text="DOST" position={[-4.7, 3.8, -5.6]} color="#a855f7" width={3.1} height={1.35} />
      <NeonSign text="SHOWDOWN" position={[0, 4.35, -6]} color="#22d3ee" width={4.8} height={1.7} sub="FRIENDS EDITION" />
      <NeonSign text="SAMOSA 24/7" position={[4.9, 3.7, -5.5]} color="#fbbf24" width={3.5} height={1.4} />

      {/* Vertical sign */}
      <group position={[7.2, 3.2, -3.8]} rotation={[0, -0.35, 0]}>
        <NeonSign text="SNACKS" position={[0, 0, 0]} color="#f472b6" width={1.5} height={2.5} />
      </group>

      {/* Rooftop props */}
      <group position={[-6.2, 0, -3.3]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.3, 0.9, 1]} />
          <meshStandardMaterial color="#3f4a5a" roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.46, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.04, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.46, 0.54]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      <group position={[5.9, 0, -3.4]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.1, 0.8, 0.9]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0.3, 0.9, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* Water tank */}
      <group position={[6.8, 0, 2.2]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.85, 1.5, 18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.35} />
        </mesh>
        <mesh position={[0, 2.15, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.12, 18]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.4} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.08]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        ))}
      </group>

      {/* Satellite dish */}
      <group position={[-7.2, 1.1, 2.4]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 1.2, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[-0.5, 0.4, 0]}>
          <sphereGeometry args={[0.55, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#cbd5e1" side={THREE.DoubleSide} roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* Snack stash */}
      <group position={[-7.1, 0, -0.6]} rotation={[0, 0.35, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.13 + i * 0.26, 0]} rotation={[0, i * 0.3, 0]} castShadow>
            <boxGeometry args={[0.55, 0.25, 0.4]} />
            <meshStandardMaterial color={i === 1 ? '#fbbf24' : '#b45309'} roughness={0.7} />
          </mesh>
        ))}
      </group>

      <FloatingMotes count={80} color="#a855f7" color2="#22d3ee" quality={quality} position={[0, 1.2, 0]} />
    </group>
  )
}
