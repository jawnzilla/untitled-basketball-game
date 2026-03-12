import type { PlayerState, TeamId, Vec3 } from '../core/types'

export interface ShotContext {
  shooter: PlayerState
  hoop: Vec3
  shooterPos: Vec3
  isThreePoint: boolean
  defendersNearby: number
  isOnFire: boolean
}

export interface ShotDecision {
  made: boolean
  quality: number
  targetOffset: Vec3
}

const SHOT_SKILL_BASE = [
  0.48, 0.50, 0.52, 0.55, 0.58, 0.61, 0.64, 0.68, 0.72, 0.76, 0.80
]

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function evaluateShot(ctx: ShotContext, random = Math.random): ShotDecision {
  const skill = SHOT_SKILL_BASE[clamp(Math.round(ctx.shooter.shotSkill), 0, 10)]

  const distanceX = ctx.hoop.x - ctx.shooterPos.x
  const distanceZ = ctx.hoop.z - ctx.shooterPos.z
  const distance = Math.hypot(distanceX, distanceZ)

  const distancePenalty = clamp((distance - 3.5) * 0.03, 0, 0.28)
  const threePenalty = ctx.isThreePoint ? 0.08 : 0
  const defensePenalty = ctx.defendersNearby * 0.04
  const onFireBonus = ctx.isOnFire ? 0.18 : 0

  const quality = clamp(skill - distancePenalty - threePenalty - defensePenalty + onFireBonus, 0.05, 0.97)
  const made = random() < quality

  const missSpread = made ? 0.035 : 0.32
  const targetOffset: Vec3 = {
    x: (random() - 0.5) * missSpread,
    y: 0,
    z: (random() - 0.5) * missSpread
  }

  return { made, quality, targetOffset }
}

export interface DunkContext {
  attacker: PlayerState
  attackerPos: Vec3
  hoop: Vec3
  defendersInPaint: number
  gameClockTicks: number
  trailingBy: number
}

export interface DunkDecision {
  isDunk: boolean
  chance: number
}

export function evaluateDunk(ctx: DunkContext, random = Math.random): DunkDecision {
  const dx = ctx.hoop.x - ctx.attackerPos.x
  const dz = ctx.hoop.z - ctx.attackerPos.z
  const paintDistance = Math.hypot(dx, dz)

  const inRange = paintDistance <= 2.25
  if (!inRange) return { isDunk: false, chance: 0 }

  const dunkSkillBonus = clamp(ctx.attacker.dunkSkill / 10, 0, 1) * 0.32
  const defensePenalty = ctx.defendersInPaint * 0.12
  const clutchPenalty = ctx.gameClockTicks < 5 * 60 ? 0.08 : 0
  const mercyBoost = ctx.trailingBy >= 6 ? 0.06 : 0

  const chance = clamp(0.36 + dunkSkillBonus - defensePenalty - clutchPenalty + mercyBoost, 0.02, 0.95)
  return { isDunk: random() < chance, chance }
}

export interface InboundState {
  inboundTeam: TeamId | null
  cooldownTicks: number
}

export function startInbound(team: TeamId): InboundState {
  return {
    inboundTeam: team,
    cooldownTicks: 60
  }
}

export function stepInbound(state: InboundState): InboundState {
  if (state.inboundTeam === null) return state
  const cooldownTicks = Math.max(0, state.cooldownTicks - 1)
  return {
    ...state,
    cooldownTicks,
    inboundTeam: cooldownTicks === 0 ? null : state.inboundTeam
  }
}
