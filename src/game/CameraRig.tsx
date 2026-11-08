import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { RenderableEngine } from './renderTypes'
import { useSettingsStore } from '../store/useSettingsStore'

export function CameraRig({ engine }: { engine: RenderableEngine }) {
  const { camera, size } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 1.15, 0))
  const desired = useMemo(() => new THREE.Vector3(0, 3.4, 9.6), [])
  const target = useMemo(() => new THREE.Vector3(0, 1.15, 0), [])
  const shakeVec = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const perspective = camera as THREE.PerspectiveCamera
    const p1 = engine.p1
    const p2 = engine.p2
    const mid = (p1.x + p2.x) / 2
    const separation = Math.abs(p1.x - p2.x)

    let x = mid
    let y = 3.25 + separation * 0.075
    let z = 8.6 + separation * 0.46
    let lookX = mid
    let lookY = 1.12
    let lookZ = 0

    const specialAttacker =
      p1.state === 'special' ? p1 : p2.state === 'special' ? p2 : null
    if (specialAttacker && specialAttacker.attackPhase !== 'recovery') {
      const other = specialAttacker === p1 ? p2 : p1
      x = specialAttacker.x * 0.62 + other.x * 0.38
      z = 6.5
      y = 2.25
      lookX = specialAttacker.x * 0.55 + other.x * 0.45
      lookY = 1.3
    }

    if (engine.phase === 'roundEnd' || engine.phase === 'matchEnd') {
      const winner = p1.wins >= p2.wins ? p1 : p2
      x = winner.x * 0.7 + mid * 0.3
      z = 7.2
      y = 2.1
      lookX = winner.x * 0.72 + mid * 0.28
      lookY = 1.25
    }

    const settings = useSettingsStore.getState()
    const shake = settings.screenShake ? engine.shake : 0
    if (shake > 0.001) {
      shakeVec.set(
        (Math.random() - 0.5) * shake * 0.9,
        (Math.random() - 0.5) * shake * 0.55,
        (Math.random() - 0.5) * shake * 0.25,
      )
    } else {
      shakeVec.set(0, 0, 0)
    }

    desired.set(x + shakeVec.x, y + shakeVec.y, z + shakeVec.z)
    target.set(lookX + shakeVec.x * 0.25, lookY + shakeVec.y * 0.25, lookZ)

    const smooth = 1 - Math.exp(-dt * 4.2)
    camera.position.lerp(desired, smooth)
    lookAt.current.lerp(target, 1 - Math.exp(-dt * 5.2))
    camera.lookAt(lookAt.current)

    const aspect = size.width / Math.max(1, size.height)
    const fov = aspect < 0.72 ? 60 : aspect < 1.05 ? 52 : aspect < 1.45 ? 46 : 42
    perspective.fov = THREE.MathUtils.damp(perspective.fov, fov, 5, dt)
    perspective.updateProjectionMatrix()
  })

  return null
}
