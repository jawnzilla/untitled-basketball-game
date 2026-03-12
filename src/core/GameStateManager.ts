import { evaluateDunk, evaluateShot, startInbound, stepInbound } from '../game/mechanics'
import { PRESETS } from '../game/tuning'
import type { GameState, TeamId, Vec3 } from './types'

const TICKS_PER_SECOND = 60

const TEAM0_HOOP: Vec3 = { x: 0, y: 3.05, z: -5.8 }
const TEAM1_HOOP: Vec3 = { x: 0, y: 3.05, z: 5.8 }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export class GameStateManager {
  private state: GameState

  constructor() {
    this.state = {
      tick: 0,
      score: {
        team0: 0,
        team1: 0,
        quarter: 1,
        gameClockTicks: 2 * 60 * TICKS_PER_SECOND
      },
      inboundTeam: null,
      inboundCooldownTicks: 0,
      lastPlay: {
        event: 'none',
        quality: 0
      },
      rules: {
        preset: 'classic',
        tuning: { ...PRESETS.classic }
      },
      players: [
        { id: 0, team: 0, shotSkill: 7, dunkSkill: 8, stealSkill: 6, onFire: false, hasBall: true, position: { x: -1.2, y: 0, z: 4.2 } },
        { id: 1, team: 0, shotSkill: 6, dunkSkill: 9, stealSkill: 5, onFire: false, hasBall: false, position: { x: 1.2, y: 0, z: 3.4 } },
        { id: 2, team: 1, shotSkill: 8, dunkSkill: 6, stealSkill: 8, onFire: false, hasBall: false, position: { x: -1.4, y: 0, z: -3.8 } },
        { id: 3, team: 1, shotSkill: 5, dunkSkill: 7, stealSkill: 7, onFire: false, hasBall: false, position: { x: 1.3, y: 0, z: -4.2 } }
      ],
      ball: {
        position: { x: -1.2, y: 1.05, z: 4.2 },
        velocity: { x: 0, y: 0, z: 0 },
        inAir: false,
        target: null
      }
    }
  }

  public getState(): Readonly<GameState> {
    return this.state
  }

  public setPreset(preset: 'classic' | 'competitive' | 'custom'): void {
    this.state.rules.preset = preset
    this.state.rules.tuning = { ...PRESETS[preset] }
  }

  public setTuningValue(key: keyof GameState['rules']['tuning'], value: number): void {
    this.state.rules.preset = 'custom'
    this.state.rules.tuning[key] = clamp(value, 0, 1)
  }

  public step(): void {
    this.state.tick += 1

    if (this.state.score.gameClockTicks > 0) {
      this.state.score.gameClockTicks -= 1
    }

    const inbound = stepInbound({ inboundTeam: this.state.inboundTeam, cooldownTicks: this.state.inboundCooldownTicks })
    this.state.inboundTeam = inbound.inboundTeam
    this.state.inboundCooldownTicks = inbound.cooldownTicks

    this.integrateBall()
  }

  public attemptShot(playerId = 0): void {
    if (this.state.ball.inAir || this.state.inboundTeam !== null) return

    const shooter = this.state.players[playerId]
    const hoop = shooter.team === 0 ? TEAM0_HOOP : TEAM1_HOOP
    const isThreePoint = Math.hypot(shooter.position.x - hoop.x, shooter.position.z - hoop.z) > 4.8

    const decision = evaluateShot({
      shooter,
      hoop,
      shooterPos: shooter.position,
      isThreePoint,
      defendersNearby: this.countDefendersNear(shooter.team, shooter.position, 2.2),
      isOnFire: shooter.onFire,
      tuning: this.state.rules.tuning
    })

    this.launchBallAt(hoop, shooter.position, decision.targetOffset, decision.made)
    this.state.lastPlay = { event: decision.made ? 'shot_made' : 'shot_miss', quality: decision.quality }

    if (decision.made) {
      const points = isThreePoint ? 3 : 2
      this.addScore(shooter.team, points)
      this.beginInbound(this.opponentTeam(shooter.team))
    }
  }

  public attemptDunk(playerId = 0): void {
    if (this.state.ball.inAir || this.state.inboundTeam !== null) return

    const attacker = this.state.players[playerId]
    const hoop = attacker.team === 0 ? TEAM0_HOOP : TEAM1_HOOP

    const decision = evaluateDunk({
      attacker,
      attackerPos: attacker.position,
      hoop,
      defendersInPaint: this.countDefendersNear(attacker.team, hoop, 2),
      gameClockTicks: this.state.score.gameClockTicks,
      trailingBy: this.teamScore(attacker.team) - this.teamScore(this.opponentTeam(attacker.team)),
      tuning: this.state.rules.tuning
    })

    const made = decision.isDunk
    this.launchBallAt(hoop, attacker.position, { x: 0, y: 0, z: 0 }, made)
    this.state.lastPlay = { event: made ? 'dunk_made' : 'dunk_fail', quality: decision.chance }

    if (made) {
      this.addScore(attacker.team, 2)
      this.beginInbound(this.opponentTeam(attacker.team))
    }
  }

  private integrateBall(): void {
    const { ball } = this.state
    if (!ball.inAir) return

    ball.velocity.y -= 0.014

    ball.position.x += ball.velocity.x
    ball.position.y += ball.velocity.y
    ball.position.z += ball.velocity.z

    if (ball.position.y <= 0.25) {
      ball.position.y = 0.25
      ball.velocity.y *= -0.58

      if (Math.abs(ball.velocity.y) < 0.03) {
        ball.velocity = { x: 0, y: 0, z: 0 }
        ball.inAir = false
      }
    }
  }

  private launchBallAt(target: Vec3, from: Vec3, offset: Vec3, made: boolean): void {
    const finalTarget = { x: target.x + offset.x, y: target.y + (made ? 0.15 : 0.1), z: target.z + offset.z }

    const dx = finalTarget.x - from.x
    const dz = finalTarget.z - from.z

    this.state.ball.inAir = true
    this.state.ball.position = { x: from.x, y: 1.05, z: from.z }
    this.state.ball.target = finalTarget
    this.state.ball.velocity = {
      x: clamp(dx * 0.03, -0.2, 0.2),
      y: made ? 0.28 : 0.24,
      z: clamp(dz * 0.03, -0.2, 0.2)
    }
  }

  private beginInbound(team: TeamId): void {
    const inbound = startInbound(team)
    this.state.inboundTeam = inbound.inboundTeam
    this.state.inboundCooldownTicks = inbound.cooldownTicks
    this.state.lastPlay.event = 'inbound'
  }

  private addScore(team: TeamId, points: number): void {
    if (team === 0) this.state.score.team0 += points
    else this.state.score.team1 += points
  }

  private opponentTeam(team: TeamId): TeamId {
    return team === 0 ? 1 : 0
  }

  private teamScore(team: TeamId): number {
    return team === 0 ? this.state.score.team0 : this.state.score.team1
  }

  private countDefendersNear(offenseTeam: TeamId, origin: Vec3, radius: number): number {
    return this.state.players.filter((p) => p.team !== offenseTeam && Math.hypot(p.position.x - origin.x, p.position.z - origin.z) <= radius).length
  }
}
