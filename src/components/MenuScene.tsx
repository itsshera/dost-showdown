import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CHARACTER_IDS, getCharacter } from '../data/characters'
import { useRosterStore } from '../store/useRosterStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { CharacterRenderer } from '../characters/CharacterRenderer'
import { FloatingMotes } from '../arenas/common'

function CameraSway() {
  const { camera, size } = useThree()
  const base = useRef(new THREE.Vector3(0, 2.5, 11.6))
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const aspect = size.width / Math.max(1, size.height)
    const z = aspect < 0.8 ? 17 : aspect < 1.15 ? 14 : aspect < 1.5 ? 12.4 : 11.4
    base.current.z += (z - base.current.z) * 0.04
    camera.position.x = Math.sin(t * 0.1) * 0.65
    camera.position.y = 2.55 + Math.sin(t * 0.16) * 0.18
    camera.position.z = base.current.z
    camera.lookAt(0, 1.12, 0)
  })
  return null
}

export function MenuScene() {
  const overrides = useRosterStore((s) => s.overrides)
  const quality = useSettingsStore((s) => s.graphics)
  const characters = useMemo(
    () => CHARACTER_IDS.map((id) => getCharacter(id, overrides)),
    [overrides],
  )

  const buildings = useMemo(() => {
    let seed = 9
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    return Array.from({ length: quality === 'low' ? 10 : 20 }, (_, i) => ({
      x: -24 + i * 2.4 + random() * 1.4,
      z: -14 - random() * 8,
      w: 1.8 + random() * 2.4,
      h: 4 + random() * 12,
      color: i % 2 === 0 ? '#0b1020' : '#0a0d19',
      neon: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#22d3ee' : null,
    }))
  }, [quality])

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={quality === 'low' ? [0.7, 1] : quality === 'medium' ? [0.9, 1.3] : [1, 1.6]}
        gl={{ antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance', stencil: false }}
        camera={{ position: [0, 2.5, 11.6], fov: 38, near: 0.1, far: 100 }}
        shadows={false}
      >
        <color attach="background" args={['#05050d']} />
        <fog attach="fog" args={['#05050d', 16, 42]} />

        <ambientLight intensity={0.42} color="#9d8cff" />
        <spotLight position={[0, 9, 5]} angle={0.7} penumbra={0.85} intensity={90} color="#c4b5fd" distance={30} />
        <spotLight position={[-7, 6, 3]} angle={0.55} penumbra={0.9} intensity={60} color="#22d3ee" distance={24} />
        <spotLight position={[7, 6, 3]} angle={0.55} penumbra={0.9} intensity={60} color="#f472b6" distance={24} />
        <pointLight position={[0, 1.2, 3.5]} color="#a855f7" intensity={18} distance={12} />
        <pointLight position={[0, 3.5, -4]} color="#22d3ee" intensity={26} distance={16} />

        {/* Backdrop skyline */}
        {buildings.map((b, i) => (
          <group key={i} position={[b.x, 0, b.z]}>
            <mesh position={[0, b.h / 2, 0]}>
              <boxGeometry args={[b.w, b.h, 1.4]} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </mesh>
            {b.neon && (
              <>
                <mesh position={[0, b.h * 0.62, 0.72]}>
                  <boxGeometry args={[b.w * 0.45, 0.1, 0.03]} />
                  <meshBasicMaterial color={b.neon} toneMapped={false} transparent opacity={0.65} />
                </mesh>
                <mesh position={[0, b.h + 0.12, 0]}>
                  <boxGeometry args={[b.w * 0.75, 0.08, 0.08]} />
                  <meshBasicMaterial color={b.neon} toneMapped={false} transparent opacity={0.8} />
                </mesh>
              </>
            )}
            {Array.from({ length: 3 }, (_, w) => (
              <mesh key={w} position={[-b.w * 0.28 + w * b.w * 0.28, b.h * 0.35, 0.71]}>
                <boxGeometry args={[0.08, b.h * 0.14, 0.02]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.35} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Stage floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[40, 24]} />
          <meshStandardMaterial color="#07080f" roughness={0.55} metalness={0.45} />
        </mesh>
        <gridHelper args={[40, 60, '#4c1d95', '#111827']} position={[0, 0.005, 0]}>
          <lineBasicMaterial attach="material" transparent opacity={0.38} />
        </gridHelper>

        {/* Neon stage ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[7.6, 7.7, 96]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.35} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[6.2, 6.23, 96]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>

        {characters.map((character, i) => {
          const x = (i - 2) * 2.52
          return (
            <group key={character.id} position={[x, 0, -0.4 + Math.abs(i - 2) * 0.15]}>
              <group rotation={[0, -0.08 * (i - 2), 0]}>
                <CharacterRenderer character={character} preview previewState="idle" scale={1.02} castShadow={false} />
              </group>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
                <circleGeometry args={[0.95, 40]} />
                <meshBasicMaterial color={character.color} transparent opacity={0.1} toneMapped={false} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.86, 0.9, 40]} />
                <meshBasicMaterial color={character.accent} transparent opacity={0.55} toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
              <pointLight position={[0, 1.1, 0.7]} color={character.accent} intensity={3.2} distance={3.4} />
            </group>
          )
        })}

        <FloatingMotes count={quality === 'low' ? 40 : 110} color="#a855f7" color2="#22d3ee" quality={quality} position={[0, 1.5, 1]} area={[20, 8, 8]} />
        <CameraSway />
      </Canvas>
    </div>
  )
}
