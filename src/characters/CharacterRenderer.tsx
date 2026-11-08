import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { CharacterDefinition } from '../types'
import { CharacterModel, type CharacterModelProps } from './CharacterModel'

const CLIP_ALIASES: Record<string, string[]> = {
  idle: ['idle', 'breath', 'stand'],
  walk: ['walk', 'run', 'move'],
  backwalk: ['backwalk', 'walk_back', 'walkback', 'walk'],
  jump: ['jump', 'air', 'fall'],
  crouch: ['crouch', 'duck'],
  block: ['block', 'guard', 'shield'],
  punch: ['punch', 'jab', 'attack'],
  kick: ['kick', 'attack'],
  special: ['special', 'power', 'ultimate', 'cast'],
  hit: ['hit', 'hurt', 'damage', 'stun'],
  stunned: ['stun', 'hit', 'hurt'],
  knockdown: ['knockdown', 'ko', 'fall', 'death'],
  victory: ['victory', 'win', 'celebrate'],
  defeat: ['defeat', 'lose', 'death'],
}

function findClip(clips: THREE.AnimationClip[], state: string) {
  const aliases = CLIP_ALIASES[state] ?? [state]
  for (const alias of aliases) {
    const exact = clips.find((clip) => clip.name.toLowerCase() === alias)
    if (exact) return exact
  }
  for (const alias of aliases) {
    const partial = clips.find((clip) => clip.name.toLowerCase().includes(alias))
    if (partial) return partial
  }
  return clips[0] ?? null
}

function GltfCharacter({
  character,
  fighter,
  previewState = 'idle',
  facing = 1,
  autoRotate = false,
  preview = false,
  scale = 1,
  castShadow = true,
}: CharacterModelProps) {
  const { appearance } = character
  const url = appearance.modelUrl as string
  const { scene, animations } = useGLTF(url)
  const group = useRef<THREE.Group>(null)
  const currentAction = useRef<THREE.AnimationAction | null>(null)

  const model = useMemo(() => {
    const cloned = cloneSkeleton(scene)
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = castShadow
        mesh.receiveShadow = false
        mesh.frustumCulled = false
      }
    })
    return cloned
  }, [scene, castShadow])

  const { actions } = useAnimations(animations, group)
  const visualState = fighter?.state ?? previewState

  useEffect(() => {
    if (animations.length === 0) return
    const clip = findClip(animations, visualState)
    if (!clip) return
    const next = actions[clip.name]
    if (!next || next === currentAction.current) return
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.18).play()
    currentAction.current?.fadeOut(0.18)
    currentAction.current = next
  }, [actions, animations, visualState])

  useEffect(() => {
    return () => {
      currentAction.current?.fadeOut(0.1)
      currentAction.current = null
    }
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const baseYaw = preview ? 0 : facing === 1 ? Math.PI / 2 : -Math.PI / 2
    const spin = autoRotate ? state.clock.elapsedTime * 0.4 : 0
    group.current.rotation.y = baseYaw + (appearance.modelRotation ?? 0) + spin
    group.current.position.y = appearance.modelYOffset ?? 0
  })

  const modelScale = (appearance.modelScale ?? 1) * scale

  return (
    <group ref={group} scale={modelScale}>
      <primitive object={model} />
      <pointLight color={character.accent} intensity={0.5} distance={2.2} position={[0, 1.2, 0.55]} />
    </group>
  )
}

/**
 * Modular character renderer.
 *
 * - No modelUrl: the detailed procedural rig is used (default, zero downloads).
 * - modelUrl: a GLB is loaded from /public, cloned per fighter and driven by the
 *   same AnimationMixer contract. Drop-in models can expose clips named after
 *   the fighter states (idle, walk, punch, kick, special, hit, victory...).
 */
export function CharacterRenderer(props: CharacterModelProps) {
  const url = props.character.appearance.modelUrl
  if (!url) return <CharacterModel {...props} />
  return (
    <Suspense fallback={<CharacterModel {...props} />}>
      <GltfCharacter {...props} />
    </Suspense>
  )
}
