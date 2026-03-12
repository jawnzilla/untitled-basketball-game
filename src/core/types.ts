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
}

export interface ScoreState {
  team0: number
  team1: number
  quarter: number
  gameClockTicks: number
}

export interface LastPlayState {
  event: 'none' | 'shot_made' | 'shot_miss' | 'dunk_made' | 'dunk_fail' | 'inbound'
  quality: number
}

export interface RulesState {
  preset: PresetId
  tuning: GameplayTuning
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
}
