import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphicsQuality } from '../types'
import { makeSignTexture } from './textures'

export function NeonSign({
  text,
  position,
  rotation = [0, 0, 0],
  color,
  width = 3.4,
  height = 1.5,
  sub,
}: {
  text: string
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  width?: number
  height?: number
  sub?: string
}) {
  const texture = useMemo(
    () => makeSignTexture(text, color, { sub, bg: 'rgba(3,3,12,0.88)', width: 512, height: 256 }),
    [text, color, sub],
  )
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.08]} />
        <meshStandardMaterial color="#080812" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

export function FloatingMotes({
  count = 70,
  color,
  color2,
  area = [16, 7, 9],
  position = [0, 2, 0],
  quality = 'high',
}: {
  count?: number
  color: string
  color2?: string
  area?: [number, number, number]
  position?: [number, number, number]
  quality?: GraphicsQuality
}) {
  const actual = quality === 'low' ? Math.floor(count * 0.45) : count
  const group = useRef<THREE.Group>(null)
  const { positionsA, positionsB } = useMemo(() => {
    const a: number[] = []
    const b: number[] = []
    for (let i = 0; i < actual; i += 1) {
      const arr = i % 2 === 0 ? a : b
      arr.push(
        (Math.random() - 0.5) * area[0],
        Math.random() * area[1],
        (Math.random() - 0.5) * area[2],
      )
    }
    return { positionsA: new Float32Array(a), positionsB: new Float32Array(b) }
  }, [actual, area])

  useFrame((state) => {
    if (!group.current) return
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.25
    group.current.rotation.y = state.clock.elapsedTime * 0.018
  })

  return (
    <group ref={group} position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positionsA, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.07}
          sizeAttenuation
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
      {color2 && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positionsB, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={color2}
            size={0.055}
            sizeAttenuation
            transparent
            opacity={0.65}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
    </group>
  )
}

export function StringLights({
  y = 3.6,
  z = -2.4,
  span = 14,
  bulbs = 30,
  colors = ['#fbbf24', '#f472b6', '#22d3ee'],
}: {
  y?: number
  z?: number
  span?: number
  bulbs?: number
  colors?: string[]
}) {
  const groups = useMemo(() => {
    const buckets: Record<string, number[]> = {}
    for (let i = 0; i <= bulbs; i += 1) {
      const x = -span / 2 + (i / bulbs) * span
      const sag = Math.sin((i / bulbs) * Math.PI) * 0.55
      const color = colors[i % colors.length]
      buckets[color] ??= []
      buckets[color].push(x, y - sag, z)
    }
    return Object.entries(buckets).map(([color, arr]) => ({
      color,
      positions: new Float32Array(arr),
    }))
  }, [y, z, span, bulbs, colors])

  return (
    <group>
      {groups.map((group) => (
        <points key={group.color}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[group.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={group.color}
            size={0.13}
            sizeAttenuation
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      ))}
      <pointLight position={[0, y - 0.4, z]} color="#fbbf24" intensity={12} distance={12} />
    </group>
  )
}

export function Crowd({
  count = 16,
  z = -4.3,
  quality = 'high',
}: {
  count?: number
  z?: number
  quality?: GraphicsQuality
}) {
  const actual = quality === 'low' ? Math.floor(count * 0.5) : count
  const group = useRef<THREE.Group>(null)
  const people = useMemo(() => {
    const colors = ['#f472b6', '#fbbf24', '#22d3ee', '#a855f7', '#a3e635', '#fb923c']
    return Array.from({ length: actual }, (_, i) => {
      const x = -8 + (i / Math.max(1, actual - 1)) * 16 + (Math.random() - 0.5) * 0.5
      return {
        x,
        z: z - Math.random() * 1.6,
        h: 1.35 + Math.random() * 0.45,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
        arms: Math.random() > 0.5,
      }
    })
  }, [actual, z])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.children.forEach((child, i) => {
      const person = people[i]
      if (!person) return
      child.position.y = Math.abs(Math.sin(t * 2.2 + person.phase)) * 0.08
      child.rotation.z = Math.sin(t * 1.7 + person.phase) * 0.05
    })
  })

  return (
    <group ref={group}>
      {people.map((person, i) => (
        <group key={i} position={[person.x, 0, person.z]} scale={[0.8, person.h / 1.6, 0.8]}>
          <mesh position={[0, 0.62, 0]} castShadow={false}>
            <capsuleGeometry args={[0.22, 0.65, 4, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#1e1b2e' : '#171426'} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.28, 0]}>
            <sphereGeometry args={[0.18, 10, 8]} />
            <meshStandardMaterial color="#3a2a2a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.43, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshStandardMaterial color="#12101a" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.85, 0.18]}>
            <boxGeometry args={[0.3, 0.12, 0.05]} />
            <meshStandardMaterial color={person.color} emissive={person.color} emissiveIntensity={0.4} />
          </mesh>
          {person.arms && (
            <>
              <mesh position={[0.3, 1.0, 0]} rotation={[0, 0, -0.9]}>
                <capsuleGeometry args={[0.06, 0.38, 4, 8]} />
                <meshStandardMaterial color="#171426" roughness={0.9} />
              </mesh>
              <mesh position={[-0.3, 1.0, 0]} rotation={[0, 0, 0.9]}>
                <capsuleGeometry args={[0.06, 0.38, 4, 8]} />
                <meshStandardMaterial color="#171426" roughness={0.9} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  )
}

export function HangingLamp({
  position,
  color = '#fff1c9',
  intensity = 14,
  cord = 1.4,
}: {
  position: [number, number, number]
  color?: string
  intensity?: number
  cord?: number
}) {
  return (
    <group position={position}>
      <mesh position={[0, cord / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, cord, 5]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.34, 0.16, 0.16, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.3, 0]} color={color} intensity={intensity} distance={9} decay={1.8} />
    </group>
  )
}

export function CanteenTable({
  position,
  rotation = 0,
}: {
  position: [number, number, number]
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.8]} />
        <meshStandardMaterial color="#b78552" roughness={0.7} />
      </mesh>
      {[
        [-0.62, -0.28],
        [0.62, -0.28],
        [-0.62, 0.28],
        [0.62, 0.28],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.42, z]}>
            <boxGeometry args={[1.4, 0.06, 0.28]} />
            <meshStandardMaterial color="#8a5a33" roughness={0.75} />
          </mesh>
          {[-0.58, 0.58].map((x) => (
            <mesh key={x} position={[x, 0.21, z]}>
              <boxGeometry args={[0.05, 0.42, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
