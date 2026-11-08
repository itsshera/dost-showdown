import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { CharacterDefinition, FighterState } from '../types'
import { CharacterRenderer } from '../characters/CharacterRenderer'
import { useSettingsStore } from '../store/useSettingsStore'

function PreviewStage({ color, accent }: { color: string; accent: string }) {
  return (
    <group position={[0, -0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.15, 48]} />
        <meshStandardMaterial color="#0a0d1a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.05, 1.12, 48]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[0.55, 0.57, 48]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} color={accent} intensity={3} distance={2.4} />
    </group>
  )
}

export function CharacterPreview({
  character,
  state = 'idle',
  autoRotate = true,
  className = '',
  showStage = true,
}: {
  character: CharacterDefinition
  state?: FighterState
  autoRotate?: boolean
  className?: string
  showStage?: boolean
}) {
  const quality = useSettingsStore((s) => s.graphics)
  return (
    <div className={`relative ${className}`}>
      <Canvas
        dpr={quality === 'low' ? [0.75, 1] : quality === 'medium' ? [1, 1.25] : [1, 1.5]}
        gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'low-power', stencil: false }}
        camera={{ position: [0, 1.55, 4.6], fov: 36, near: 0.1, far: 40 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.95} color="#dbeafe" />
        <directionalLight position={[3, 6, 5]} intensity={2.3} color="#ffffff" />
        <directionalLight position={[-4, 3, 2]} intensity={0.8} color={character.accent} />
        <pointLight position={[-3, 2.2, 1]} color={character.accent} intensity={22} distance={8} decay={2} />
        <pointLight position={[3.2, 1.6, -1.5]} color={character.color} intensity={16} distance={8} decay={2} />
        <group>
          <CharacterRenderer character={character} preview previewState={state} scale={0.96} castShadow={false} />
          {showStage && <PreviewStage color={character.color} accent={character.accent} />}
        </group>
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={0.85}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.9}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 1.05, 0]}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
