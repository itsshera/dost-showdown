import type { AttackKind, CharacterId, FighterState, PowerAnimation } from '../types'

export type JointName =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'shoulderL'
  | 'elbowL'
  | 'wristL'
  | 'shoulderR'
  | 'elbowR'
  | 'wristR'
  | 'thighL'
  | 'kneeL'
  | 'ankleL'
  | 'thighR'
  | 'kneeR'
  | 'ankleR'

export const JOINT_NAMES: JointName[] = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'shoulderL',
  'elbowL',
  'wristL',
  'shoulderR',
  'elbowR',
  'wristR',
  'thighL',
  'kneeL',
  'ankleL',
  'thighR',
  'kneeR',
  'ankleR',
]

export type Vec3 = [number, number, number]
export type Expression = 'neutral' | 'angry' | 'hurt' | 'happy' | 'shock'

export interface Pose {
  joints: Record<JointName, Vec3>
  rootX: number
  rootY: number
  rootZ: number
  rootRx: number
  rootRz: number
  yawExtra: number
  expression: Expression
  mouthOpen: number
}

export interface PoseInput {
  characterId: CharacterId
  state: FighterState
  time: number
  stateTime: number
  attackPhase: 'startup' | 'active' | 'recovery' | null
  attackKind: AttackKind | null
  crouching: boolean
  combo: number
  specialAnimation: PowerAnimation | null
}

const baseJoints = (): Record<JointName, Vec3> => ({
  hips: [0.02, 0, 0],
  spine: [0.01, 0, 0],
  chest: [0, 0, 0],
  neck: [0, 0, 0],
  head: [-0.02, 0, 0],
  shoulderL: [-0.06, 0, 0.16],
  elbowL: [-0.32, 0, 0],
  wristL: [0, 0, 0],
  shoulderR: [-0.06, 0, -0.16],
  elbowR: [-0.32, 0, 0],
  wristR: [0, 0, 0],
  thighL: [0, 0, 0.035],
  kneeL: [0.05, 0, 0],
  ankleL: [0, 0, 0],
  thighR: [0, 0, -0.035],
  kneeR: [0.05, 0, 0],
  ankleR: [0, 0, 0],
})

const makePose = (): Pose => ({
  joints: baseJoints(),
  rootX: 0,
  rootY: 0,
  rootZ: 0,
  rootRx: 0,
  rootRz: 0,
  yawExtra: 0,
  expression: 'neutral',
  mouthOpen: 0,
})

function applyIdle(pose: Pose, input: PoseInput) {
  const { time, characterId } = input
  const breathe = Math.sin(time * 2.05)
  const sway = Math.sin(time * 0.85)
  pose.rootY = breathe * 0.012
  pose.joints.spine[0] = 0.015 + breathe * 0.018
  pose.joints.chest[0] = -0.012
  pose.joints.head[0] = -0.03
  pose.joints.head[1] = Math.sin(time * 0.62) * 0.07
  pose.joints.shoulderL[0] = -0.07 + breathe * 0.025
  pose.joints.shoulderR[0] = -0.07 - breathe * 0.025
  pose.joints.shoulderL[2] = 0.17
  pose.joints.shoulderR[2] = -0.17
  pose.joints.elbowL[0] = -0.34
  pose.joints.elbowR[0] = -0.34
  pose.joints.hips[1] = sway * 0.05
  pose.joints.thighL[2] = 0.04
  pose.joints.thighR[2] = -0.04

  if (characterId === 'anay') {
    pose.rootY += Math.sin(time * 2.4) * 0.018
    pose.joints.spine[0] = 0.03 + breathe * 0.03
    pose.joints.elbowL[0] = -0.55
    pose.joints.elbowR[0] = -0.55
    pose.joints.shoulderL[2] = 0.26
    pose.joints.shoulderR[2] = -0.26
    pose.expression = 'happy'
  } else if (characterId === 'shubh') {
    pose.joints.head[1] = Math.sin(time * 0.9) * 0.16
    pose.joints.shoulderL[0] = -0.2
    pose.joints.shoulderR[0] = -0.2
    pose.joints.elbowL[0] = -0.65
    pose.joints.elbowR[0] = -0.65
    pose.joints.hips[1] = sway * 0.08
    pose.expression = 'neutral'
  } else if (characterId === 'shaurya') {
    const adjust = time % 5.5
    if (adjust < 0.7) {
      const p = Math.sin((adjust / 0.7) * Math.PI)
      pose.joints.shoulderR[0] = -1.6 * p
      pose.joints.shoulderR[2] = -0.55 * p
      pose.joints.elbowR[0] = -1.9 * p
      pose.joints.head[1] = 0.15 * p
    }
    pose.joints.head[0] = -0.05
    pose.expression = 'neutral'
  } else if (characterId === 'varya') {
    pose.joints.hips[1] = sway * 0.1
    pose.joints.head[2] = Math.sin(time * 1.1) * 0.05
    pose.joints.shoulderL[2] = 0.22 + breathe * 0.03
    pose.joints.shoulderR[2] = -0.22 - breathe * 0.03
    pose.expression = 'happy'
  } else if (characterId === 'mitansh') {
    pose.rootY += Math.abs(Math.sin(time * 3.2)) * 0.02
    pose.joints.head[1] = Math.sin(time * 1.7) * 0.18
    pose.joints.head[2] = Math.sin(time * 2.1) * 0.06
    pose.joints.shoulderL[0] = -0.12
    pose.joints.shoulderR[0] = -0.12
    pose.expression = 'neutral'
  }
}

function applyWalk(pose: Pose, input: PoseInput, backwards: boolean) {
  const { time } = input
  const phase = time * (backwards ? 7.4 : 9.2)
  const swing = Math.sin(phase)
  const bob = Math.abs(Math.sin(phase)) * 0.035
  pose.rootY = bob
  pose.joints.spine[0] = backwards ? -0.06 : 0.1
  pose.joints.chest[0] = backwards ? 0.02 : 0.04
  pose.joints.head[0] = -0.08
  pose.joints.thighL[0] = swing * 0.62
  pose.joints.thighR[0] = -swing * 0.62
  pose.joints.kneeL[0] = 0.12 + Math.max(0, -swing) * 0.7
  pose.joints.kneeR[0] = 0.12 + Math.max(0, swing) * 0.7
  pose.joints.ankleL[0] = -0.12
  pose.joints.ankleR[0] = -0.12
  pose.joints.shoulderL[0] = -0.15 + swing * 0.5
  pose.joints.shoulderR[0] = -0.15 - swing * 0.5
  pose.joints.elbowL[0] = -0.5
  pose.joints.elbowR[0] = -0.5
  pose.joints.hips[1] = -swing * 0.1
  pose.joints.chest[1] = swing * 0.12
  if (backwards) {
    pose.joints.shoulderL[2] = 0.24
    pose.joints.shoulderR[2] = -0.24
  }
}

function applyJump(pose: Pose, input: PoseInput) {
  const rise = Math.min(1, input.stateTime * 4)
  pose.rootY = 0.02
  pose.joints.spine[0] = 0.06
  pose.joints.head[0] = -0.1
  pose.joints.thighL[0] = -0.55 * rise
  pose.joints.thighR[0] = -0.35 * rise
  pose.joints.kneeL[0] = 1.0 * rise
  pose.joints.kneeR[0] = 0.8 * rise
  pose.joints.ankleL[0] = -0.4 * rise
  pose.joints.ankleR[0] = -0.3 * rise
  pose.joints.shoulderL[0] = -0.9 * rise
  pose.joints.shoulderR[0] = -0.9 * rise
  pose.joints.shoulderL[2] = 0.45
  pose.joints.shoulderR[2] = -0.45
  pose.joints.elbowL[0] = -0.7
  pose.joints.elbowR[0] = -0.7
  pose.expression = 'angry'
}

function applyCrouch(pose: Pose) {
  pose.rootY = -0.3
  pose.joints.spine[0] = 0.18
  pose.joints.chest[0] = 0.08
  pose.joints.head[0] = -0.2
  pose.joints.thighL[0] = -1.1
  pose.joints.thighR[0] = -1.1
  pose.joints.kneeL[0] = 1.95
  pose.joints.kneeR[0] = 1.95
  pose.joints.ankleL[0] = -0.8
  pose.joints.ankleR[0] = -0.8
  pose.joints.shoulderL[0] = -0.6
  pose.joints.shoulderR[0] = -0.6
  pose.joints.elbowL[0] = -0.9
  pose.joints.elbowR[0] = -0.9
  pose.expression = 'angry'
}

function applyBlock(pose: Pose, input: PoseInput) {
  const shake = Math.sin(input.time * 30) * 0.01
  pose.rootY = -0.07
  pose.joints.spine[0] = 0.12
  pose.joints.chest[0] = 0.06
  pose.joints.head[0] = -0.14
  pose.joints.shoulderL[0] = -1.28 + shake
  pose.joints.shoulderR[0] = -1.28 - shake
  pose.joints.shoulderL[2] = 0.38
  pose.joints.shoulderR[2] = -0.38
  pose.joints.elbowL[0] = -1.72
  pose.joints.elbowR[0] = -1.72
  pose.joints.wristL[2] = 0.3
  pose.joints.wristR[2] = -0.3
  pose.joints.thighL[0] = -0.28
  pose.joints.thighR[0] = -0.28
  pose.joints.kneeL[0] = 0.55
  pose.joints.kneeR[0] = 0.55
  pose.joints.ankleL[0] = -0.3
  pose.joints.ankleR[0] = -0.3
  pose.expression = 'angry'
}

function applyPunch(pose: Pose, input: PoseInput) {
  const phase = input.attackPhase ?? 'startup'
  const useLeft = input.combo % 2 === 1
  const lead = useLeft ? 'L' : 'R'
  const off = useLeft ? 'R' : 'L'
  const sign = useLeft ? 1 : -1

  if (phase === 'startup') {
    pose.joints.hips[1] = 0.22 * sign
    pose.joints.chest[1] = 0.3 * sign
    pose.joints[`shoulder${lead}` as JointName][0] = 0.5
    pose.joints[`shoulder${lead}` as JointName][2] = 0.32 * sign
    pose.joints[`elbow${lead}` as JointName][0] = -1.7
    pose.joints[`shoulder${off}` as JointName][0] = -1.0
    pose.joints[`elbow${off}` as JointName][0] = -1.5
    pose.joints.head[1] = -0.12 * sign
    pose.expression = 'angry'
  } else if (phase === 'active') {
    pose.rootZ = 0.14
    pose.joints.hips[1] = -0.2 * sign
    pose.joints.spine[1] = -0.16 * sign
    pose.joints.chest[1] = -0.32 * sign
    pose.joints[`shoulder${lead}` as JointName][0] = -1.62
    pose.joints[`shoulder${lead}` as JointName][2] = 0.08 * sign
    pose.joints[`elbow${lead}` as JointName][0] = -0.08
    pose.joints[`wrist${lead}` as JointName][0] = 0.1
    pose.joints[`shoulder${off}` as JointName][0] = -0.45
    pose.joints[`elbow${off}` as JointName][0] = -1.4
    pose.joints.head[1] = 0.12 * sign
    pose.joints.head[0] = -0.08
    pose.joints.thighL[0] = -0.18
    pose.joints.thighR[0] = 0.12
    pose.joints.kneeL[0] = 0.25
    pose.expression = 'angry'
    pose.mouthOpen = 0.35
  } else {
    pose.joints.hips[1] = -0.06 * sign
    pose.joints.chest[1] = -0.1 * sign
    pose.joints[`shoulder${lead}` as JointName][0] = -0.7
    pose.joints[`elbow${lead}` as JointName][0] = -1.2
    pose.joints[`shoulder${off}` as JointName][0] = -0.5
    pose.joints[`elbow${off}` as JointName][0] = -1.0
    pose.expression = 'angry'
  }
}

function applyKick(pose: Pose, input: PoseInput) {
  const phase = input.attackPhase ?? 'startup'
  if (phase === 'startup') {
    pose.rootY = -0.02
    pose.joints.spine[0] = 0.1
    pose.joints.thighR[0] = -0.75
    pose.joints.kneeR[0] = 1.8
    pose.joints.ankleR[0] = -0.4
    pose.joints.thighL[0] = -0.12
    pose.joints.kneeL[0] = 0.3
    pose.joints.shoulderL[0] = -1.0
    pose.joints.shoulderR[0] = -0.7
    pose.joints.elbowL[0] = -1.5
    pose.joints.elbowR[0] = -1.4
    pose.expression = 'angry'
  } else if (phase === 'active') {
    pose.rootY = 0.04
    pose.rootRx = -0.16
    pose.joints.spine[0] = -0.12
    pose.joints.chest[1] = -0.16
    pose.joints.thighR[0] = -1.45
    pose.joints.kneeR[0] = 0.05
    pose.joints.ankleR[0] = 0.15
    pose.joints.thighL[0] = 0.22
    pose.joints.kneeL[0] = 0.16
    pose.joints.shoulderL[0] = -1.25
    pose.joints.shoulderR[0] = 0.4
    pose.joints.shoulderR[2] = -0.55
    pose.joints.elbowL[0] = -1.3
    pose.joints.elbowR[0] = -0.9
    pose.joints.head[0] = 0.05
    pose.expression = 'angry'
    pose.mouthOpen = 0.45
  } else {
    pose.rootRx = -0.05
    pose.joints.thighR[0] = -0.6
    pose.joints.kneeR[0] = 0.8
    pose.joints.shoulderL[0] = -0.8
    pose.joints.elbowL[0] = -1.1
    pose.expression = 'angry'
  }
}

function applySpecial(pose: Pose, input: PoseInput) {
  const phase = input.attackPhase ?? 'startup'
  const anim = input.specialAnimation ?? 'custom'
  const t = input.stateTime
  const active = phase === 'active'
  const recovery = phase === 'recovery'
  pose.expression = active ? 'shock' : 'angry'
  pose.mouthOpen = active ? 0.95 : 0.35

  if (anim === 'snackquake') {
    if (phase === 'startup') {
      pose.joints.hips[1] = 0.25
      pose.joints.chest[1] = 0.3
      pose.joints.shoulderR[0] = 0.7
      pose.joints.elbowR[0] = -1.85
      pose.joints.shoulderL[0] = -0.5
      pose.joints.elbowL[0] = -1.5
      pose.joints.head[0] = 0.12
      pose.joints.head[1] = -0.15
      pose.joints.thighL[0] = -0.25
      pose.joints.kneeL[0] = 0.45
    } else if (active) {
      pose.rootZ = 0.16
      pose.joints.hips[1] = -0.35
      pose.joints.spine[1] = -0.2
      pose.joints.chest[1] = -0.4
      pose.joints.shoulderR[0] = -2.2
      pose.joints.shoulderR[2] = -0.25
      pose.joints.elbowR[0] = -0.15
      pose.joints.shoulderL[0] = 0.35
      pose.joints.shoulderL[2] = 0.7
      pose.joints.elbowL[0] = -0.4
      pose.joints.head[0] = -0.15
      pose.joints.thighL[0] = -0.3
      pose.joints.thighR[0] = 0.2
    } else {
      pose.joints.shoulderR[0] = -1.2
      pose.joints.elbowR[0] = -0.9
      pose.joints.shoulderL[0] = -0.5
      pose.joints.chest[1] = -0.1
    }
  } else if (anim === 'luckyLag') {
    const jitter = phase === 'startup' ? Math.sin(t * 90) * 0.025 : 0
    pose.rootX = jitter
    pose.rootZ = jitter * 1.5
    if (phase === 'startup') {
      pose.rootY = -0.08
      pose.joints.head[2] = Math.sin(t * 45) * 0.18
      pose.joints.shoulderL[2] = 0.8
      pose.joints.shoulderR[2] = -0.8
      pose.joints.elbowL[0] = -1.2
      pose.joints.elbowR[0] = -1.2
      pose.joints.spine[1] = Math.sin(t * 60) * 0.12
    } else if (active) {
      pose.rootZ = 0.22
      pose.joints.hips[1] = -0.35
      pose.joints.chest[1] = -0.45
      pose.joints.shoulderR[0] = -1.75
      pose.joints.elbowR[0] = -0.05
      pose.joints.shoulderL[0] = -0.9
      pose.joints.elbowL[0] = -1.7
      pose.joints.head[1] = 0.2
      pose.joints.thighL[0] = -0.2
    } else {
      pose.joints.shoulderR[0] = -0.9
      pose.joints.elbowR[0] = -1.2
    }
  } else if (anim === 'founderMode') {
    if (phase === 'startup') {
      pose.joints.shoulderL[0] = -1.25
      pose.joints.shoulderR[0] = -1.25
      pose.joints.elbowL[0] = -1.65
      pose.joints.elbowR[0] = -1.65
      pose.joints.wristL[0] = -0.2 + Math.sin(t * 22) * 0.15
      pose.joints.wristR[0] = -0.2 + Math.sin(t * 22 + 1.6) * 0.15
      pose.joints.head[0] = -0.18
      pose.joints.spine[0] = 0.18
    } else if (active) {
      pose.rootZ = 0.16
      pose.joints.spine[0] = 0.24
      pose.joints.chest[0] = 0.1
      pose.joints.shoulderL[0] = -1.55
      pose.joints.shoulderR[0] = -1.55
      pose.joints.shoulderL[2] = 0.24
      pose.joints.shoulderR[2] = -0.24
      pose.joints.elbowL[0] = -0.1
      pose.joints.elbowR[0] = -0.1
      pose.joints.head[0] = -0.25
      pose.joints.thighL[0] = -0.2
      pose.joints.thighR[0] = -0.2
      pose.joints.kneeL[0] = 0.3
      pose.joints.kneeR[0] = 0.3
    } else {
      pose.joints.shoulderL[0] = -1.1
      pose.joints.shoulderR[0] = -1.1
      pose.joints.elbowL[0] = -1.2
      pose.joints.elbowR[0] = -1.2
    }
  } else if (anim === 'voltageVortex') {
    pose.yawExtra = phase === 'startup' ? t * 7 : active ? 8 + t * 16 : 14
    if (phase === 'startup') {
      pose.joints.shoulderL[2] = 1.45
      pose.joints.shoulderR[2] = -1.45
      pose.joints.shoulderL[0] = -0.2
      pose.joints.shoulderR[0] = -0.2
      pose.joints.elbowL[0] = -0.2
      pose.joints.elbowR[0] = -0.2
      pose.joints.head[0] = -0.2
      pose.joints.spine[0] = -0.1
    } else if (active) {
      pose.joints.shoulderL[0] = -2.7
      pose.joints.shoulderR[0] = -2.7
      pose.joints.shoulderL[2] = 0.5
      pose.joints.shoulderR[2] = -0.5
      pose.joints.elbowL[0] = -0.2
      pose.joints.elbowR[0] = -0.2
      pose.joints.head[0] = -0.35
      pose.rootY = 0.12
    } else {
      pose.joints.shoulderL[0] = -1.4
      pose.joints.shoulderR[0] = -1.4
      pose.joints.elbowL[0] = -0.9
      pose.joints.elbowR[0] = -0.9
      pose.yawExtra = 14
    }
  } else if (anim === 'baldiBlast') {
    if (phase === 'startup') {
      pose.joints.head[1] = -1.35
      pose.joints.chest[1] = 0.35
      pose.joints.shoulderL[0] = -0.4
      pose.joints.shoulderR[0] = 0.5
      pose.joints.elbowL[0] = -0.9
      pose.joints.elbowR[0] = -1.2
      pose.joints.spine[0] = -0.08
    } else if (active) {
      pose.rootZ = 0.1
      pose.joints.head[1] = 0.2
      pose.joints.hips[1] = -0.3
      pose.joints.chest[1] = -0.35
      pose.joints.shoulderR[0] = -1.5
      pose.joints.elbowR[0] = -0.1
      pose.joints.shoulderL[0] = 0.5
      pose.joints.elbowL[0] = -0.6
      pose.joints.thighL[0] = -0.3
      pose.joints.thighR[0] = 0.25
    } else {
      pose.joints.shoulderR[0] = -0.9
      pose.joints.elbowR[0] = -0.9
      pose.joints.head[1] = 0.1
    }
  } else {
    if (phase === 'startup') {
      pose.joints.shoulderL[0] = -2.2
      pose.joints.shoulderR[0] = -2.2
      pose.joints.shoulderL[2] = 0.4
      pose.joints.shoulderR[2] = -0.4
      pose.joints.elbowL[0] = -0.6
      pose.joints.elbowR[0] = -0.6
      pose.rootY = 0.06
    } else if (active) {
      pose.joints.shoulderL[0] = -1.5
      pose.joints.shoulderR[0] = -1.5
      pose.joints.elbowL[0] = -0.1
      pose.joints.elbowR[0] = -0.1
      pose.rootZ = 0.18
      pose.joints.head[0] = -0.2
    } else {
      pose.joints.shoulderL[0] = -0.9
      pose.joints.shoulderR[0] = -0.9
      pose.joints.elbowL[0] = -1.0
      pose.joints.elbowR[0] = -1.0
    }
  }

  if (recovery) {
    pose.rootZ *= 0.3
  }
}

function applyHit(pose: Pose, input: PoseInput) {
  const t = Math.min(1, input.stateTime * 7)
  pose.rootRx = 0.22 * t
  pose.rootZ = -0.12 * t
  pose.joints.spine[0] = -0.28 * t
  pose.joints.chest[0] = -0.2 * t
  pose.joints.head[0] = -0.35 * t
  pose.joints.head[2] = Math.sin(input.time * 25) * 0.1
  pose.joints.shoulderL[0] = 0.35 * t
  pose.joints.shoulderR[0] = 0.35 * t
  pose.joints.shoulderL[2] = 0.55
  pose.joints.shoulderR[2] = -0.55
  pose.joints.elbowL[0] = -0.9
  pose.joints.elbowR[0] = -0.9
  pose.joints.thighL[0] = 0.2 * t
  pose.joints.thighR[0] = -0.2 * t
  pose.joints.kneeL[0] = 0.35
  pose.joints.kneeR[0] = 0.35
  pose.expression = 'hurt'
  pose.mouthOpen = 0.7
}

function applyKnockdown(pose: Pose, input: PoseInput) {
  const t = Math.min(1, input.stateTime * 2.5)
  if (input.stateTime < 0.55) {
    pose.rootRx = -0.9 * t
    pose.rootY = 0.15
    pose.joints.shoulderL[2] = 0.9
    pose.joints.shoulderR[2] = -0.9
    pose.joints.elbowL[0] = -0.4
    pose.joints.elbowR[0] = -0.4
    pose.joints.thighL[0] = -0.4
    pose.joints.thighR[0] = 0.3
    pose.joints.kneeL[0] = 0.5
    pose.expression = 'hurt'
    pose.mouthOpen = 0.8
  } else {
    pose.rootRx = -1.48
    pose.rootY = 0.13
    pose.rootZ = -0.35
    pose.joints.head[0] = 0.2
    pose.joints.head[2] = 0.25
    pose.joints.shoulderL[2] = 1.0
    pose.joints.shoulderR[2] = -0.9
    pose.joints.elbowL[0] = -0.2
    pose.joints.elbowR[0] = -0.4
    pose.joints.thighL[0] = -0.25
    pose.joints.thighR[0] = -0.1
    pose.joints.kneeL[0] = 0.45
    pose.joints.kneeR[0] = 0.2
    pose.joints.ankleL[0] = -0.4
    pose.joints.ankleR[0] = -0.3
    pose.expression = 'hurt'
    pose.mouthOpen = 0.4
  }
}

function applyVictory(pose: Pose, input: PoseInput) {
  const bounce = Math.abs(Math.sin(input.time * 5))
  pose.rootY = bounce * 0.1
  pose.joints.spine[0] = -0.05
  pose.joints.head[0] = -0.2
  pose.joints.shoulderL[0] = -2.7
  pose.joints.shoulderR[0] = -2.7
  pose.joints.shoulderL[2] = 0.5
  pose.joints.shoulderR[2] = -0.5
  pose.joints.elbowL[0] = -0.25
  pose.joints.elbowR[0] = -0.25
  pose.joints.thighL[0] = -0.15
  pose.joints.thighR[0] = 0.15
  pose.joints.kneeL[0] = 0.3
  pose.joints.kneeR[0] = 0.3
  pose.joints.hips[1] = Math.sin(input.time * 2.5) * 0.12
  pose.expression = 'happy'
  pose.mouthOpen = 0.75
}

function applyDefeat(pose: Pose, input: PoseInput) {
  const settle = Math.min(1, input.stateTime * 2)
  pose.rootRx = -1.48 * settle
  pose.rootY = 0.13
  pose.rootZ = -0.3
  pose.joints.head[0] = 0.15
  pose.joints.head[2] = 0.3
  pose.joints.shoulderL[2] = 1.0
  pose.joints.shoulderR[2] = -0.85
  pose.joints.elbowL[0] = -0.15
  pose.joints.elbowR[0] = -0.35
  pose.joints.thighL[0] = -0.3
  pose.joints.thighR[0] = -0.05
  pose.joints.kneeL[0] = 0.5
  pose.joints.kneeR[0] = 0.2
  pose.expression = 'hurt'
  pose.mouthOpen = 0.2
}

function applyStunned(pose: Pose, input: PoseInput) {
  const wobble = Math.sin(input.time * 8)
  pose.rootRz = wobble * 0.08
  pose.joints.head[1] = wobble * 0.25
  pose.joints.head[2] = wobble * 0.2
  pose.joints.spine[0] = -0.08
  pose.joints.shoulderL[2] = 0.5
  pose.joints.shoulderR[2] = -0.5
  pose.joints.elbowL[0] = -0.7
  pose.joints.elbowR[0] = -0.7
  pose.expression = 'shock'
  pose.mouthOpen = 0.4
}

export function computePose(input: PoseInput): Pose {
  const pose = makePose()

  switch (input.state) {
    case 'idle':
      applyIdle(pose, input)
      break
    case 'walk':
      applyWalk(pose, input, false)
      break
    case 'backwalk':
      applyWalk(pose, input, true)
      break
    case 'jump':
      applyJump(pose, input)
      break
    case 'crouch':
      applyCrouch(pose)
      break
    case 'block':
      applyBlock(pose, input)
      break
    case 'punch':
      applyPunch(pose, input)
      break
    case 'kick':
      applyKick(pose, input)
      break
    case 'special':
      applySpecial(pose, input)
      break
    case 'hit':
      applyHit(pose, input)
      break
    case 'knockdown':
      applyKnockdown(pose, input)
      break
    case 'victory':
      applyVictory(pose, input)
      break
    case 'defeat':
      applyDefeat(pose, input)
      break
    case 'stunned':
      applyStunned(pose, input)
      break
    default:
      applyIdle(pose, input)
  }

  // Crouching under a block or attack keeps the silhouette low.
  if (input.crouching && input.state !== 'crouch' && input.state !== 'block' && input.state !== 'hit') {
    pose.rootY -= 0.14
    pose.joints.kneeL[0] += 0.5
    pose.joints.kneeR[0] += 0.5
    pose.joints.thighL[0] -= 0.25
    pose.joints.thighR[0] -= 0.25
  }

  return pose
}
