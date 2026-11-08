import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphicsQuality } from '../types'
import { CanteenTable, HangingLamp, NeonSign } from './common'
import { makeCheckerTexture, makePosterTexture, makeSignTexture } from './textures'

export function SchoolCanteen({ quality }: { quality: GraphicsQuality }) {
  const floorTexture = useMemo(() => makeCheckerTexture('#cbbfa6', '#b9aa8d', 9, 5), [])
  const menuTexture = useMemo(
    () =>
      makeSignTexture('MENU', '#fbbf24', {
        bg: '#2b1a0d',
        sub: 'SAMOSA ₹20   •   MAGGI ₹30   •   SURPRISE ₹??',
        fontSize: 96,
        width: 1024,
        height: 384,
      }),
    [],
  )
  const posterA = useMemo(() => makePosterTexture('QUIZ TODAY', 'No excuses. Mostly.', '#ef4444'), [])
  const posterB = useMemo(() => makePosterTexture('SPORTS DAY', 'Bring your own energy.', '#0ea5e9'), [])
  const fan = useRef<THREE.Group>(null)

  useEffect(
    () => () => {
      floorTexture.dispose()
      menuTexture.dispose()
      posterA.dispose()
      posterB.dispose()
    },
    [floorTexture, menuTexture, posterA, posterB],
  )

  useFrame((state) => {
    if (fan.current) fan.current.rotation.y = state.clock.elapsedTime * 2.4
  })

  return (
    <group>
      <color attach="background" args={['#1b130d']} />
      <fog attach="fog" args={['#24180f', 20, 44]} />

      <ambientLight intensity={0.62} color="#ffe7c2" />
      <directionalLight
        position={[4, 12, 7]}
        intensity={1.5}
        color="#fff0d4"
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-far={30}
      />
      <pointLight position={[0, 3.4, 3]} color="#ffd9a0" intensity={22} distance={14} decay={1.8} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial map={floorTexture} roughness={0.72} metalness={0.04} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 3, -4.6]} receiveShadow>
        <boxGeometry args={[16.4, 6.2, 0.2]} />
        <meshStandardMaterial color="#d8c8ab" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, -4.48]}>
        <boxGeometry args={[16.2, 1.5, 0.12]} />
        <meshStandardMaterial color="#7a5a3c" roughness={0.85} />
      </mesh>
      <mesh position={[-8.15, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 6.2, 0.2]} />
        <meshStandardMaterial color="#cbbfa6" roughness={0.92} />
      </mesh>
      <mesh position={[8.15, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[9, 6.2, 0.2]} />
        <meshStandardMaterial color="#cbbfa6" roughness={0.92} />
      </mesh>
      <mesh position={[0, 6.1, 0]}>
        <boxGeometry args={[16.4, 0.2, 9.2]} />
        <meshStandardMaterial color="#3b2b1c" roughness={0.95} />
      </mesh>

      {/* Ceiling beams */}
      {[-5.5, -1.8, 1.8, 5.5].map((x) => (
        <mesh key={x} position={[x, 5.95, 0]}>
          <boxGeometry args={[0.18, 0.25, 9]} />
          <meshStandardMaterial color="#57402a" roughness={0.9} />
        </mesh>
      ))}

      {/* Hanging lights */}
      <HangingLamp position={[-4.6, 4.45, -0.8]} cord={1.55} intensity={18} />
      <HangingLamp position={[-1.5, 4.55, -0.8]} cord={1.45} intensity={16} />
      <HangingLamp position={[1.5, 4.55, -0.8]} cord={1.45} intensity={16} />
      <HangingLamp position={[4.6, 4.45, -0.8]} cord={1.55} intensity={18} />

      {/* Fan */}
      <group position={[0, 5.25, 0.6]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 6]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <group ref={fan} position={[0, 0.05, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.5} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, (i / 3) * Math.PI * 2, 0]} position={[0, 0.02, 0]}>
              <boxGeometry args={[1.5, 0.025, 0.2]} />
              <meshStandardMaterial color="#6b7280" metalness={0.3} roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Menu board */}
      <group position={[0, 3.75, -4.43]}>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[5.2, 2.1, 0.1]} />
          <meshStandardMaterial color="#1c1209" roughness={0.8} />
        </mesh>
        <mesh>
          <planeGeometry args={[4.9, 1.9]} />
          <meshBasicMaterial map={menuTexture} toneMapped={false} />
        </mesh>
      </group>

      {/* Posters */}
      {[
        { pos: [-5.9, 2.9, -4.42] as [number, number, number], texture: posterA },
        { pos: [5.9, 2.9, -4.42] as [number, number, number], texture: posterB },
      ].map((poster, i) => (
        <mesh key={i} position={poster.pos}>
          <planeGeometry args={[1.25, 1.65]} />
          <meshBasicMaterial map={poster.texture} toneMapped={false} />
        </mesh>
      ))}

      {/* Clock */}
      <group position={[0, 5.1, -4.42]}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 0.06, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.03, 0.24, 0.01]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh position={[0.08, 0.06, 0.05]} rotation={[Math.PI / 2, 0, -1]}>
          <boxGeometry args={[0.03, 0.18, 0.01]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      {/* Food counter */}
      <group position={[0, 0, -3.55]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 1.1, 1.4]} />
          <meshStandardMaterial color="#9a6b3f" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.13, 0]} receiveShadow>
          <boxGeometry args={[7.7, 0.1, 1.55]} />
          <meshStandardMaterial color="#d7d2c8" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.55, 0.62]}>
          <boxGeometry args={[7.2, 0.72, 0.04]} />
          <meshStandardMaterial color="#cfe8f5" transparent opacity={0.28} roughness={0.1} metalness={0.2} />
        </mesh>
        {/* Trays and food */}
        {[-2.6, -1.2, 1.2, 2.6].map((x, i) => (
          <group key={x} position={[x, 1.21, 0.1]}>
            <mesh>
              <boxGeometry args={[0.9, 0.06, 0.6]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.45} />
            </mesh>
            {[0, 1, 2].map((j) => (
              <mesh key={j} position={[-0.25 + j * 0.25, 0.09, 0]} scale={[1, 0.7, 1]}>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshStandardMaterial
                  color={['#f59e0b', '#84cc16', '#f97316'][(i + j) % 3]}
                  roughness={0.7}
                />
              </mesh>
            ))}
          </group>
        ))}
        {/* Pots */}
        <mesh position={[-3.2, 1.42, -0.2]}>
          <cylinderGeometry args={[0.42, 0.34, 0.5, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-3.2, 1.68, -0.2]}>
          <sphereGeometry args={[0.43, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[3.25, 1.32, -0.1]}>
          <cylinderGeometry args={[0.24, 0.24, 0.34, 14]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>

      {/* Tables and benches */}
      <CanteenTable position={[-5.7, 0, -1.2]} rotation={0.08} />
      <CanteenTable position={[5.7, 0, -1.2]} rotation={-0.08} />
      <CanteenTable position={[-5.9, 0, 2.3]} rotation={-0.05} />
      <CanteenTable position={[5.9, 0, 2.3]} rotation={0.05} />

      {/* Water cooler */}
      <group position={[-7.2, 0, 2.9]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.55, 1.2, 0.55]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.36, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.4, 12]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.65} roughness={0.1} />
        </mesh>
      </group>

      {/* Trash bin */}
      <group position={[7.1, 0, 2.7]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.28, 0.9, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.06, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>

      {/* Plants */}
      {[
        [-7.3, 0, -3.9],
        [7.3, 0, -3.9],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.22, 0.55, 10]} />
            <meshStandardMaterial color="#a16207" roughness={0.8} />
          </mesh>
          {[0, 1, 2, 3].map((j) => (
            <mesh
              key={j}
              position={[Math.cos((j / 4) * Math.PI * 2) * 0.16, 0.75 + (j % 2) * 0.18, Math.sin((j / 4) * Math.PI * 2) * 0.16]}
              scale={[0.5, 1, 0.5]}
            >
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshStandardMaterial color="#4d7c0f" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Seated students for flavour */}
      {[
        [-5.7, 0, -0.35, 0.4],
        [5.9, 0, 2.9, -0.5],
      ].map(([x, y, z, rot], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, rot, 0]} scale={0.9}>
          <mesh position={[0, 0.62, 0]}>
            <capsuleGeometry args={[0.19, 0.5, 4, 8]} />
            <meshStandardMaterial color={i === 0 ? '#1d4ed8' : '#9d174d'} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.12, 0]}>
            <sphereGeometry args={[0.17, 10, 8]} />
            <meshStandardMaterial color="#c98b62" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.24, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.17, 8, 6]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <NeonSign
        text="CANTEEN"
        position={[0, 4.9, -4.38]}
        color="#fbbf24"
        width={2.6}
        height={1}
        sub="PERIOD 5"
      />
    </group>
  )
}
