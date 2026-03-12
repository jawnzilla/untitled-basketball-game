import type { GameplayTuning, PresetId } from '../game/tuning'

export type TeamId = 0 | 1

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface BallState {
  position: Vec3
  velocity: Vec3
  inAir: boolean
  target: Vec3 | null
  passTargetPlayerId: number | null
  shotInFlight: boolean
}

export interface PlayerState {
  id: number
  team: TeamId
  shotSkill: number
  dunkSkill: number
  stealSkill: number
  onFire: boolean
  hasBall: boolean
  position: Vec3
  isHuman?: boolean
  isJumping: boolean
  jumpVel: number
  shotChargeTicks: number
}

export interface ScoreState {
  team0: number
  team1: number
  quarter: number
  gameClockTicks: number
}

export interface LastPlayState {
  event: 'none' | 'shot_made' | 'shot_miss' | 'dunk_made' | 'dunk_fail' | 'inbound' | 'steal' | 'pass' | 'call_for_pass'
  quality: number
}

export interface RulesState {
  preset: PresetId
  tuning: GameplayTuning
}

export interface FlowTimers {
  passOff: number
  stealsOff: number
}

export interface GameState {
  tick: number
  score: ScoreState
  inboundTeam: TeamId | null
  inboundCooldownTicks: number
  players: PlayerState[]
  ball: BallState
  lastPlay: LastPlayState
  rules: RulesState
  flow: FlowTimers
}
