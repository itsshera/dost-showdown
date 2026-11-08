import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterDefinition, GraphicsQuality } from '../types'
import type { RenderableFighter } from './renderTypes'
import { CharacterRenderer } from '../characters/CharacterRenderer'

export function FighterView({
  fighter,
  character,
  quality,
}: {
  fighter: RenderableFighter
  character: CharacterDefinition
  quality: GraphicsQuality
}) {
  const group = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const shadowMaterial = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (group.current) {
      group.current.position.x = fighter.x
      group.current.position.y = fighter.y
      group.current.position.z = fighter.z
    }
    if (shadow.current) {
      shadow.current.position.y = 0.018 - fighter.y
      const s = Math.max(0.45, 1 - fighter.y * 0.22)
      shadow.current.scale.set(s, s, s)
    }
    if (shadowMaterial.current) {
      shadowMaterial.current.opacity = Math.max(0.08, 0.34 - fighter.y * 0.08)
    }
  })

  return (
    <group ref={group}>
      <CharacterRenderer
        character={character}
        fighter={fighter}
        facing={fighter.facing}
        scale={0.92}
        castShadow={quality !== 'low'}
      />
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <circleGeometry args={[0.66, 24]} />
        <meshBasicMaterial ref={shadowMaterial} color="#02020a" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <pointLight color={character.accent} intensity={0.55} distance={2.4} position={[0, 1.2, 0.7]} />
    </group>
  )
}
