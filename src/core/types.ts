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
}

export interface PlayerState {
  id: number
  team: TeamId
  shotSkill: number
  dunkSkill: number
  stealSkill: number
  onFire: boolean
  hasBall: boolean
}

export interface ScoreState {
  team0: number
  team1: number
  quarter: number
  gameClockTicks: number
}

export interface GameState {
  tick: number
  score: ScoreState
  inboundTeam: TeamId | null
  players: PlayerState[]
  ball: BallState
}
