import { createRef, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { CharacterDefinition, FighterState } from '../types'
import type { RenderableFighter } from '../game/renderTypes'
import { computePose, JOINT_NAMES, type JointName } from './animations'

export interface CharacterModelProps {
  character: CharacterDefinition
  fighter?: RenderableFighter | null
  previewState?: FighterState
  facing?: 1 | -1
  autoRotate?: boolean
  preview?: boolean
  scale?: number
  castShadow?: boolean
}

const makeJoints = () => {
  const entries = JOINT_NAMES.map((name) => [name, createRef<THREE.Group>()] as const)
  return Object.fromEntries(entries) as Record<JointName, RefObject<THREE.Group>>
}

function Hair({
  character,
  ponytailRef,
}: {
  character: CharacterDefinition
  ponytailRef: RefObject<THREE.Group>
}) {
  const { hair, accent, hairStyle } = character.appearance
  const mat = <meshStandardMaterial color={hair} roughness={0.82} metalness={0.04} />
  const accentMat = (
    <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0.5} />
  )

  return (
    <group>
      {/* base cap */}
      <mesh position={[0, 0.055, 0]} castShadow>
        <sphereGeometry args={[0.229, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        {mat}
      </mesh>

      {hairStyle === 'quiff' && (
        <>
          <mesh position={[0, 0.245, 0.1]} rotation={[-0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.085, 0.25, 7]} />
            {mat}
          </mesh>
          <mesh position={[0.09, 0.235, 0.07]} rotation={[-0.35, 0, 0.35]} castShadow>
            <coneGeometry args={[0.07, 0.2, 7]} />
            {mat}
          </mesh>
          <mesh position={[-0.085, 0.23, 0.06]} rotation={[-0.3, 0, -0.32]} castShadow>
            <coneGeometry args={[0.065, 0.18, 7]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.18, 0.185]} rotation={[0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.1, 14, 12]} />
            {mat}
          </mesh>
        </>
      )}

      {hairStyle === 'swoop' && (
        <>
          <mesh position={[0, 0.15, 0.165]} rotation={[0.1, 0, -0.28]} castShadow>
            <RoundedBox args={[0.36, 0.12, 0.16]} radius={0.05} smoothness={3} />
            {mat}
          </mesh>
          <mesh position={[0.16, 0.11, 0.11]} rotation={[0, 0.3, -0.5]} castShadow>
            <RoundedBox args={[0.16, 0.1, 0.13]} radius={0.04} smoothness={3} />
            {mat}
          </mesh>
          <mesh position={[-0.12, 0.17, 0.12]} rotation={[0, -0.2, 0.2]} castShadow>
            <sphereGeometry args={[0.11, 14, 12]} />
            {mat}
          </mesh>
        </>
      )}

      {hairStyle === 'fade' && (
        <>
          <mesh position={[0, 0.17, 0.01]} scale={[1.0, 0.55, 1.0]} castShadow>
            <sphereGeometry args={[0.21, 20, 14]} />
            {mat}
          </mesh>
          <mesh position={[0.03, 0.215, 0.08]} rotation={[-0.2, 0, -0.15]} castShadow>
            <RoundedBox args={[0.3, 0.08, 0.2]} radius={0.03} smoothness={3} />
            {mat}
          </mesh>
          <mesh position={[-0.16, 0.08, 0.04]} rotation={[0, 0, 0.2]} castShadow>
            <RoundedBox args={[0.07, 0.14, 0.16]} radius={0.02} smoothness={3} />
            {mat}
          </mesh>
        </>
      )}

      {hairStyle === 'ponytail' && (
        <>
          <mesh position={[0, 0.15, -0.02]} scale={[1.04, 0.8, 1.04]} castShadow>
            <sphereGeometry args={[0.22, 20, 16]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.1, -0.2]} castShadow>
            <torusGeometry args={[0.055, 0.02, 8, 14]} />
            {accentMat}
          </mesh>
          <group ref={ponytailRef} position={[0, 0.06, -0.22]}>
            <mesh position={[0, -0.08, -0.02]} rotation={[0.3, 0, 0]} castShadow>
              <capsuleGeometry args={[0.065, 0.24, 6, 12]} />
              {mat}
            </mesh>
            <mesh position={[0, -0.27, -0.06]} rotation={[0.25, 0, 0.1]} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 6, 12]} />
              {mat}
            </mesh>
            <mesh position={[0.035, -0.22, -0.04]} rotation={[0.2, 0, 0.2]} castShadow>
              <capsuleGeometry args={[0.02, 0.18, 5, 8]} />
              {accentMat}
            </mesh>
            <mesh position={[0, -0.41, -0.09]} castShadow>
              <sphereGeometry args={[0.045, 10, 8]} />
              {mat}
            </mesh>
          </group>
        </>
      )}

      {hairStyle === 'curls' && (
        <>
          {[
            [0, 0.22, 0.02, 0.1],
            [0.1, 0.2, 0.06, 0.085],
            [-0.1, 0.2, 0.06, 0.085],
            [0.15, 0.17, -0.02, 0.08],
            [-0.15, 0.17, -0.02, 0.08],
            [0.05, 0.24, -0.08, 0.09],
            [-0.05, 0.24, -0.08, 0.09],
            [0, 0.15, 0.16, 0.08],
            [0.13, 0.13, 0.12, 0.06],
            [-0.13, 0.13, 0.12, 0.06],
            [0, 0.2, -0.16, 0.08],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 12, 10]} />
              {mat}
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

function Accessory({ character }: { character: CharacterDefinition }) {
  const { accessory, accent, outfitSecondary } = character.appearance
  if (accessory === 'none') return null

  if (accessory === 'headphones') {
    return (
      <group>
        <mesh position={[0, 0.06, 0]} castShadow>
          <torusGeometry args={[0.235, 0.022, 8, 24, Math.PI]} />
          <meshStandardMaterial color={outfitSecondary} roughness={0.5} metalness={0.2} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.228, 0.01, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
              <meshStandardMaterial color={outfitSecondary} roughness={0.45} metalness={0.25} />
            </mesh>
            <mesh position={[s * 0.032, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.052, 0.052, 0.012, 16]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  if (accessory === 'glasses') {
    return (
      <group position={[0, 0.045, 0.19]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.085, 0, 0]}>
            <RoundedBox args={[0.12, 0.062, 0.025]} radius={0.015} smoothness={2}>
              <meshStandardMaterial color="#0b1220" roughness={0.25} metalness={0.4} />
            </RoundedBox>
            <RoundedBox args={[0.112, 0.052, 0.012]} radius={0.012} smoothness={2} position={[0, 0, 0.016]}>
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} transparent opacity={0.28} />
            </RoundedBox>
            <mesh position={[s * 0.06, 0, 0.006]}>
              <boxGeometry args={[0.012, 0.02, 0.02]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.05, 0.012, 0.014]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.15, 0.01, -0.06]} rotation={[0, s * 0.25, 0]}>
            <boxGeometry args={[0.012, 0.012, 0.13]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
      </group>
    )
  }

  if (accessory === 'earrings') {
    return (
      <group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.215, -0.055, 0.02]} castShadow>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} roughness={0.2} metalness={0.4} />
          </mesh>
        ))}
      </group>
    )
  }

  if (accessory === 'visor') {
    return (
      <group position={[0, 0.04, 0.185]}>
        <RoundedBox args={[0.38, 0.095, 0.06]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#07101d" roughness={0.2} metalness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.34, 0.05, 0.015]} radius={0.02} smoothness={2} position={[0, 0, 0.032]}>
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.5} transparent opacity={0.8} />
        </RoundedBox>
      </group>
    )
  }

  return null
}

export function CharacterModel({
  character,
  fighter,
  previewState = 'idle',
  facing = 1,
  autoRotate = false,
  preview = false,
  scale = 1,
  castShadow = true,
}: CharacterModelProps) {
  const joints = useMemo(makeJoints, [])
  const root = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Group>(null)
  const eyeR = useRef<THREE.Group>(null)
  const browL = useRef<THREE.Mesh>(null)
  const browR = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const ponytail = useRef<THREE.Group>(null)

  const { appearance, accent } = character
  const bodyScale = appearance.bodyScale

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const now = state.clock.elapsedTime
    let visualState: FighterState = fighter ? fighter.state : previewState
    let stateTime = fighter ? fighter.stateTime : now
    let attackPhase: 'startup' | 'active' | 'recovery' | null = fighter?.attackPhase ?? null
    let attackKind = fighter?.attack?.spec.kind ?? null
    let specialAnimation = fighter?.specialAnimation ?? null
    const combo = fighter?.combo ?? 0

    if (preview && !fighter) {
      if (visualState === 'special') {
        const cycle = now % 1.75
        stateTime = cycle
        attackPhase = cycle < 0.5 ? 'startup' : cycle < 0.68 ? 'active' : 'recovery'
        attackKind = 'special'
        specialAnimation = character.power.animation
      } else if (visualState === 'punch' || visualState === 'kick') {
        const cycle = now % 0.62
        stateTime = cycle
        attackPhase = cycle < 0.14 ? 'startup' : cycle < 0.26 ? 'active' : 'recovery'
        attackKind = visualState
      }
    }

    if (
      fighter &&
      !fighter.grounded &&
      (visualState === 'idle' || visualState === 'walk' || visualState === 'backwalk')
    ) {
      visualState = 'jump'
    }
    if (visualState === 'punch' || visualState === 'kick') {
      attackKind = visualState
    }

    const pose = computePose({
      characterId: character.id,
      state: visualState,
      time: now,
      stateTime,
      attackPhase,
      attackKind,
      crouching: fighter?.crouching ?? previewState === 'crouch',
      combo,
      specialAnimation,
    })

    for (const name of JOINT_NAMES) {
      const group = joints[name].current
      if (!group) continue
      const target = pose.joints[name]
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, target[0], 24, dt)
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, target[1], 24, dt)
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target[2], 24, dt)
    }

    if (root.current) {
      root.current.position.x = THREE.MathUtils.damp(root.current.position.x, pose.rootX, 20, dt)
      root.current.position.y = THREE.MathUtils.damp(root.current.position.y, pose.rootY, 20, dt)
      root.current.position.z = THREE.MathUtils.damp(root.current.position.z, pose.rootZ, 20, dt)
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, pose.rootRx, 18, dt)
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, pose.rootRz, 18, dt)
      const baseYaw = preview ? 0 : facing === 1 ? Math.PI / 2 : -Math.PI / 2
      const spin = autoRotate ? now * 0.4 : 0
      root.current.rotation.y = baseYaw + spin + pose.yawExtra
    }

    // Facial animation: blink, brows and mouth.
    const blinkPhase = (now + (character.id === 'shubh' ? 1.2 : character.id === 'varya' ? 2.1 : 0)) % 4.6
    const blink = blinkPhase < 0.09 ? 0.12 : 1
    const eyeScale = pose.expression === 'shock' || pose.expression === 'hurt' ? 1.18 : 1
    if (eyeL.current) eyeL.current.scale.y = THREE.MathUtils.damp(eyeL.current.scale.y, blink * eyeScale, 26, dt)
    if (eyeR.current) eyeR.current.scale.y = THREE.MathUtils.damp(eyeR.current.scale.y, blink * eyeScale, 26, dt)

    const browZ =
      pose.expression === 'angry'
        ? 0.34
        : pose.expression === 'hurt'
          ? -0.3
          : pose.expression === 'happy'
            ? 0.12
            : 0
    const browY = pose.expression === 'shock' ? 0.128 : pose.expression === 'hurt' ? 0.12 : 0.108
    if (browL.current) {
      browL.current.rotation.z = THREE.MathUtils.damp(browL.current.rotation.z, browZ, 18, dt)
      browL.current.position.y = THREE.MathUtils.damp(browL.current.position.y, browY, 18, dt)
    }
    if (browR.current) {
      browR.current.rotation.z = THREE.MathUtils.damp(browR.current.rotation.z, -browZ, 18, dt)
      browR.current.position.y = THREE.MathUtils.damp(browR.current.position.y, browY, 18, dt)
    }
    if (mouth.current) {
      const open = pose.mouthOpen
      const smile = pose.expression === 'happy'
      mouth.current.scale.x = THREE.MathUtils.damp(mouth.current.scale.x, smile ? 1.25 : 1, 18, dt)
      mouth.current.scale.y = THREE.MathUtils.damp(mouth.current.scale.y, 0.7 + open * 2.2, 22, dt)
      mouth.current.scale.z = THREE.MathUtils.damp(mouth.current.scale.z, 1 + open * 0.5, 18, dt)
      mouth.current.position.y = THREE.MathUtils.damp(mouth.current.position.y, -0.095 - open * 0.012, 18, dt)
    }
    if (ponytail.current) {
      const speed = visualState === 'walk' ? 2.2 : 1.4
      ponytail.current.rotation.x = Math.sin(now * speed) * 0.12 + (visualState === 'jump' ? 0.35 : 0)
      ponytail.current.rotation.z = Math.sin(now * speed * 0.7) * 0.1
    }
  })

  const outfit = appearance.outfit
  const outfitSecondary = appearance.outfitSecondary
  const skin = appearance.skin
  const trousers = appearance.trousers
  const shoes = appearance.shoes

  return (
    <group ref={root} scale={[bodyScale * scale, scale, bodyScale * scale]} dispose={null}>
      <group ref={joints.hips} position={[0, 0.98, 0]}>
        <mesh position={[0, 0.02, 0]} castShadow={castShadow}>
          <capsuleGeometry args={[0.2, 0.1, 8, 16]} />
          <meshStandardMaterial color={trousers} roughness={0.8} />
        </mesh>

        <group ref={joints.spine} position={[0, 0.08, 0]}>
          <group ref={joints.chest} position={[0, 0.3, 0]}>
            {/* Hoodie body */}
            <RoundedBox
              args={[0.62, 0.72, 0.4]}
              radius={0.14}
              smoothness={4}
              position={[0, 0.2, 0]}
              castShadow={castShadow}
            >
              <meshStandardMaterial color={outfit} roughness={0.78} metalness={0.02} />
            </RoundedBox>

            {/* Hood roll */}
            <mesh position={[0, 0.53, -0.13]} scale={[1.35, 0.62, 0.8]} castShadow={castShadow}>
              <sphereGeometry args={[0.2, 18, 14]} />
              <meshStandardMaterial color={outfitSecondary} roughness={0.82} />
            </mesh>

            {/* Kangaroo pocket */}
            <RoundedBox
              args={[0.36, 0.17, 0.05]}
              radius={0.04}
              smoothness={3}
              position={[0, 0.03, 0.2]}
            >
              <meshStandardMaterial color={outfitSecondary} roughness={0.85} />
            </RoundedBox>

            {/* Drawstrings */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.075, 0.35, 0.21]} rotation={[0.1, 0, s * 0.08]}>
                <cylinderGeometry args={[0.012, 0.012, 0.19, 6]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
              </mesh>
            ))}

            {/* Chest emblem */}
            <mesh position={[0.13, 0.32, 0.205]}>
              <circleGeometry args={[0.052, 20]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.75} roughness={0.4} />
            </mesh>

            <group ref={joints.neck} position={[0, 0.55, 0]}>
              <mesh position={[0, 0.02, 0]} castShadow={castShadow}>
                <cylinderGeometry args={[0.075, 0.09, 0.12, 12]} />
                <meshStandardMaterial color={skin} roughness={0.65} />
              </mesh>

              <group ref={joints.head} position={[0, 0.18, 0]}>
                {/* Ears */}
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[s * 0.215, -0.01, 0]} castShadow={castShadow}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial color={skin} roughness={0.62} />
                  </mesh>
                ))}

                {/* Head */}
                <mesh scale={[1, 1.04, 0.96]} castShadow={castShadow}>
                  <sphereGeometry args={[0.225, 28, 22]} />
                  <meshStandardMaterial color={skin} roughness={0.6} />
                </mesh>

                {/* Eyes */}
                {[-1, 1].map((s) => (
                  <group key={s} ref={s === -1 ? eyeL : eyeR} position={[s * 0.077, 0.035, 0.185]}>
                    <mesh scale={[1, 1.25, 0.7]}>
                      <sphereGeometry args={[0.052, 16, 12]} />
                      <meshStandardMaterial color="#f8fafc" roughness={0.35} />
                    </mesh>
                    <mesh position={[0, 0, 0.035]}>
                      <sphereGeometry args={[0.023, 12, 10]} />
                      <meshStandardMaterial color="#101018" roughness={0.2} />
                    </mesh>
                    <mesh position={[0.008, 0.008, 0.052]}>
                      <sphereGeometry args={[0.007, 8, 6]} />
                      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
                    </mesh>
                  </group>
                ))}

                {/* Brows */}
                <mesh ref={browL} position={[0.08, 0.108, 0.196]} rotation={[0, 0, 0]}>
                  <boxGeometry args={[0.085, 0.018, 0.022]} />
                  <meshStandardMaterial color={appearance.hair} roughness={0.85} />
                </mesh>
                <mesh ref={browR} position={[-0.08, 0.108, 0.196]} rotation={[0, 0, 0]}>
                  <boxGeometry args={[0.085, 0.018, 0.022]} />
                  <meshStandardMaterial color={appearance.hair} roughness={0.85} />
                </mesh>

                {/* Nose */}
                <mesh position={[0, -0.015, 0.218]} scale={[0.8, 1, 1]}>
                  <sphereGeometry args={[0.036, 12, 10]} />
                  <meshStandardMaterial color={skin} roughness={0.55} />
                </mesh>

                {/* Mouth */}
                <mesh ref={mouth} position={[0, -0.095, 0.203]}>
                  <sphereGeometry args={[0.065, 16, 10]} />
                  <meshStandardMaterial color="#3b1220" roughness={0.55} />
                </mesh>

                <Hair character={character} ponytailRef={ponytail} />
                <Accessory character={character} />
              </group>
            </group>

            {/* Arms */}
            {(
              [
                ['L', 1],
                ['R', -1],
              ] as const
            ).map(([side, sign]) => {
              const shoulder = joints[`shoulder${side}`]
              const elbow = joints[`elbow${side}`]
              const wrist = joints[`wrist${side}`]
              return (
                <group key={side} ref={shoulder} position={[sign * 0.345, 0.44, 0]}>
                  <mesh position={[0, -0.165, 0]} castShadow={castShadow}>
                    <capsuleGeometry args={[0.088, 0.16, 6, 12]} />
                    <meshStandardMaterial color={outfit} roughness={0.8} />
                  </mesh>
                  <group ref={elbow} position={[0, -0.33, 0]}>
                    <mesh position={[0, -0.15, 0]} castShadow={castShadow}>
                      <capsuleGeometry args={[0.075, 0.16, 6, 12]} />
                      <meshStandardMaterial color={outfitSecondary} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, -0.29, 0]}>
                      <cylinderGeometry args={[0.083, 0.078, 0.055, 12]} />
                      <meshStandardMaterial color={accent} roughness={0.55} metalness={0.1} />
                    </mesh>
                    <group ref={wrist} position={[0, -0.33, 0]}>
                      <mesh position={[0, -0.045, 0.01]} scale={[0.95, 1.05, 0.9]} castShadow={castShadow}>
                        <sphereGeometry args={[0.095, 16, 14]} />
                        <meshStandardMaterial color={skin} roughness={0.62} />
                      </mesh>
                    </group>
                  </group>
                </group>
              )
            })}

            <AccessoryBackpack character={character} />
          </group>
        </group>

        {/* Legs */}
        {(
          [
            ['L', 1],
            ['R', -1],
          ] as const
        ).map(([side, sign]) => {
          const thigh = joints[`thigh${side}`]
          const knee = joints[`knee${side}`]
          const ankle = joints[`ankle${side}`]
          return (
            <group key={side} ref={thigh} position={[sign * 0.17, -0.02, 0]}>
              <mesh position={[0, -0.22, 0]} castShadow={castShadow}>
                <capsuleGeometry args={[0.115, 0.21, 6, 12]} />
                <meshStandardMaterial color={trousers} roughness={0.82} />
              </mesh>
              <group ref={knee} position={[0, -0.44, 0]}>
                <mesh position={[0, -0.2, 0]} castShadow={castShadow}>
                  <capsuleGeometry args={[0.1, 0.19, 6, 12]} />
                  <meshStandardMaterial color={trousers} roughness={0.82} />
                </mesh>
                <group ref={ankle} position={[0, -0.4, 0]}>
                  <RoundedBox
                    args={[0.18, 0.11, 0.32]}
                    radius={0.04}
                    smoothness={3}
                    position={[0, -0.055, 0.055]}
                    castShadow={castShadow}
                  >
                    <meshStandardMaterial color={shoes} roughness={0.55} metalness={0.08} />
                  </RoundedBox>
                  <RoundedBox
                    args={[0.19, 0.035, 0.33]}
                    radius={0.015}
                    smoothness={2}
                    position={[0, -0.105, 0.055]}
                  >
                    <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
                  </RoundedBox>
                  <mesh position={[0, -0.05, 0.19]} rotation={[0.15, 0, 0]}>
                    <boxGeometry args={[0.14, 0.03, 0.04]} />
                    <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55} />
                  </mesh>
                </group>
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}

function AccessoryBackpack({ character }: { character: CharacterDefinition }) {
  if (character.appearance.accessory !== 'backpack') return null
  const accent = character.appearance.accent
  return (
    <group position={[0, 0.24, -0.27]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.085, 0.095, 0.38, 14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.085, 0.16, 14]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.21, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.06, 0.14, 10]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 3) * Math.PI * 2) * 0.12, -0.12, Math.sin((i / 3) * Math.PI * 2) * 0.12]}
          rotation={[0, (i / 3) * Math.PI * 2, 0.25]}
        >
          <boxGeometry args={[0.02, 0.16, 0.1]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <pointLight color={accent} intensity={0.5} distance={1.1} />
    </group>
  )
}
