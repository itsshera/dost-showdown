import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import type { ArenaId, GraphicsQuality } from '../types'
import type { RenderableEngine } from './renderTypes'
import { ArenaView } from '../arenas/ArenaView'
import { FighterView } from './FighterView'
import { EffectsLayer } from './effects/EffectsLayer'
import { CameraRig } from './CameraRig'

const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

function GameLoop({ engine }: { engine: RenderableEngine }) {
  useFrame((_, delta) => {
    engine.update(delta)
  })
  return null
}

export function GameCanvas({
  engine,
  arenaId,
  quality,
}: {
  engine: RenderableEngine
  arenaId: ArenaId
  quality: GraphicsQuality
}) {
  const dpr: [number, number] =
    quality === 'low' ? [0.75, 1] : quality === 'medium' ? [1, 1.4] : [1, 1.75]

  return (
    <Canvas
      shadows={quality === 'high' || (quality === 'medium' && !isCoarsePointer)}
      dpr={dpr}
      gl={{
        antialias: quality !== 'low',
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      camera={{ position: [0, 3.5, 9.8], fov: 44, near: 0.1, far: 130 }}
      className="absolute inset-0"
    >
      <Suspense fallback={null}>
        <GameLoop engine={engine} />
        <ArenaView arenaId={arenaId} quality={quality} />
        <FighterView fighter={engine.p1} character={engine.config.p1} quality={quality} />
        <FighterView fighter={engine.p2} character={engine.config.p2} quality={quality} />
        <EffectsLayer engine={engine} />
        <CameraRig engine={engine} />
      </Suspense>
    </Canvas>
  )
}
