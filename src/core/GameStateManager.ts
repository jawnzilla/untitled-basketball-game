import { evaluateDunk, evaluateShot, startInbound, stepInbound } from '../game/mechanics'
import { PRESETS } from '../game/tuning'
import type { GameState, TeamId, Vec3 } from './types'

const TICKS_PER_SECOND = 60

const TEAM0_HOOP: Vec3 = { x: -7.2, y: 3.05, z: 0 }
const TEAM1_HOOP: Vec3 = { x: 7.2, y: 3.05, z: 0 }

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
      lastPlay: { event: 'none', quality: 0 },
      rules: { preset: 'classic', tuning: { ...PRESETS.classic }, autoMakeShots: false },
      flow: { passOff: 0, stealsOff: 0 },
      players: [
        { id: 0, team: 0, shotSkill: 7, dunkSkill: 8, stealSkill: 6, onFire: false, hasBall: true, position: { x: 3.2, y: 0, z: -0.8 }, isHuman: true, isJumping: false, jumpVel: 0, shotChargeTicks: 0 },
        { id: 1, team: 0, shotSkill: 6, dunkSkill: 9, stealSkill: 5, onFire: false, hasBall: false, position: { x: 2.6, y: 0, z: 1.4 }, isJumping: false, jumpVel: 0, shotChargeTicks: 0 },
        { id: 2, team: 1, shotSkill: 8, dunkSkill: 6, stealSkill: 8, onFire: false, hasBall: false, position: { x: -2.6, y: 0, z: -1.3 }, isJumping: false, jumpVel: 0, shotChargeTicks: 0 },
        { id: 3, team: 1, shotSkill: 5, dunkSkill: 7, stealSkill: 7, onFire: false, hasBall: false, position: { x: -3.4, y: 0, z: 0.9 }, isJumping: false, jumpVel: 0, shotChargeTicks: 0 }
      ],
      ball: {
        position: { x: 3.2, y: 1.05, z: -0.8 },
        velocity: { x: 0, y: 0, z: 0 },
        inAir: false,
        target: null,
        passTargetPlayerId: null,
        shotInFlight: false
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

  public setAutoMakeShots(enabled: boolean): void {
    this.state.rules.autoMakeShots = enabled
  }

  public moveHuman(dx: number, dz: number): void {
    const p = this.state.players[0]
    const speed = p.isJumping ? 0.03 : 0.07
    p.position.x = clamp(p.position.x + dx * speed, -8.2, 8.2)
    p.position.z = clamp(p.position.z + dz * speed, -4.5, 4.5)
    if (p.hasBall && !this.state.ball.inAir) {
      this.state.ball.position = { x: p.position.x, y: 1.05 + p.position.y, z: p.position.z }
    }
  }

  public jump(playerId = 0): void {
    const p = this.state.players[playerId]
    if (p.isJumping) return
    p.isJumping = true
    p.jumpVel = 0.18
  }

  public setShotCharge(playerId = 0, charging = false): void {
    const p = this.state.players[playerId]
    if (!charging) {
      p.shotChargeTicks = 0
      return
    }
    p.shotChargeTicks = clamp(p.shotChargeTicks + 1, 0, 60)
  }

  public releaseShoot(playerId = 0): void {
    const p = this.state.players[playerId]
    if (!p.hasBall || this.state.ball.inAir || this.state.inboundTeam !== null) {
      p.shotChargeTicks = 0
      return
    }

    const hoop = p.team === 0 ? TEAM0_HOOP : TEAM1_HOOP
    const paintDist = Math.hypot(p.position.x - hoop.x, p.position.z - hoop.z)

    // close + jumping => dunk attempt first
    if (p.isJumping && paintDist < 2.1) {
      this.attemptDunk(playerId)
    } else {
      this.attemptShot(playerId)
    }

    p.shotChargeTicks = 0
  }

  public step(): void {
    this.state.tick += 1

    if (this.state.score.gameClockTicks > 0) this.state.score.gameClockTicks -= 1

    this.state.flow.passOff = Math.max(0, this.state.flow.passOff - 1)
    this.state.flow.stealsOff = Math.max(0, this.state.flow.stealsOff - 1)

    const inbound = stepInbound({ inboundTeam: this.state.inboundTeam, cooldownTicks: this.state.inboundCooldownTicks })
    this.state.inboundTeam = inbound.inboundTeam
    this.state.inboundCooldownTicks = inbound.cooldownTicks

    this.stepJumping()
    this.integrateBall()
    this.resolveLooseBallPickup()
    this.anchorBallToCarrier()
    this.stepDroneAI()
  }

  private stepJumping(): void {
    for (const p of this.state.players) {
      if (!p.isJumping) continue
      p.jumpVel -= 0.012
      p.position.y += p.jumpVel
      if (p.position.y <= 0) {
        p.position.y = 0
        p.jumpVel = 0
        p.isJumping = false
      }
    }
  }

  public attemptShot(playerId = 0): void {
    if (this.state.ball.inAir || this.state.inboundTeam !== null) return

    const shooter = this.state.players[playerId]
    if (!shooter.hasBall) return

    const hoop = shooter.team === 0 ? TEAM0_HOOP : TEAM1_HOOP
    const isThreePoint = Math.hypot(shooter.position.x - hoop.x, shooter.position.z - hoop.z) > 5.4

    const defendersNearby = this.countDefendersNear(shooter.team, shooter.position, 2.2)
    const timingQuality = this.shotTimingQuality(shooter.shotChargeTicks)
    const contestPenalty = shooter.isJumping ? 0 : defendersNearby * 0.06

    const decision = evaluateShot({
      shooter,
      hoop,
      shooterPos: shooter.position,
      isThreePoint,
      defendersNearby,
      isOnFire: shooter.onFire,
      tuning: this.state.rules.tuning
    })

    const adjustedQuality = clamp(decision.quality * timingQuality - contestPenalty, 0.03, 0.98)
    const made = this.state.rules.autoMakeShots ? true : Math.random() < adjustedQuality

    this.launchBallAt(hoop, shooter.position, decision.targetOffset, made)
    shooter.hasBall = false
    this.state.lastPlay = { event: made ? 'shot_made' : 'shot_miss', quality: adjustedQuality }

    if (made) {
      this.addScore(shooter.team, isThreePoint ? 3 : 2)
      this.beginInbound(this.opponentTeam(shooter.team))
    }
  }

  public attemptDunk(playerId = 0): void {
    if (this.state.ball.inAir || this.state.inboundTeam !== null) return

    const attacker = this.state.players[playerId]
    if (!attacker.hasBall) return

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

    const made = this.state.rules.autoMakeShots ? true : decision.isDunk
    this.launchBallAt(hoop, attacker.position, { x: 0, y: 0, z: 0 }, made)
    attacker.hasBall = false
    this.state.lastPlay = { event: made ? 'dunk_made' : 'dunk_fail', quality: decision.chance }

    if (made) {
      this.addScore(attacker.team, 2)
      this.beginInbound(this.opponentTeam(attacker.team))
    }
  }

  public attemptPass(playerId = 0): void {
    if (this.state.flow.passOff > 0 || this.state.inboundTeam !== null || this.state.ball.inAir) return
    const passer = this.state.players[playerId]
    if (!passer.hasBall) return

    const teammate = this.state.players.find((p) => p.team === passer.team && p.id !== passer.id)
    if (!teammate) return

    const leadTarget = { x: teammate.position.x + (teammate.team === 0 ? -0.45 : 0.45), y: 1.05, z: teammate.position.z }

    passer.hasBall = false
    this.state.ball.inAir = true
    this.state.ball.shotInFlight = false
    this.state.ball.passTargetPlayerId = teammate.id
    this.state.ball.target = leadTarget
    this.state.ball.position = { x: passer.position.x, y: 1.05 + passer.position.y, z: passer.position.z }
    this.state.ball.velocity = {
      x: clamp((leadTarget.x - passer.position.x) * 0.12, -0.35, 0.35),
      y: 0.02,
      z: clamp((leadTarget.z - passer.position.z) * 0.12, -0.35, 0.35)
    }

    this.state.flow.passOff = 12
    this.state.lastPlay = { event: 'pass', quality: 0.9 }
  }

  public attemptSteal(playerId = 0): void {
    if (this.state.flow.stealsOff > 0 || this.state.inboundTeam !== null) return
    const defender = this.state.players[playerId]

    const ballHandler = this.state.players.find((p) => p.hasBall && p.team !== defender.team)
    if (!ballHandler) return

    const distance = Math.hypot(defender.position.x - ballHandler.position.x, defender.position.z - ballHandler.position.z)
    if (distance > 1.5) return

    const stealFactor = clamp(defender.stealSkill / 10, 0, 1)
    const windowBoost = this.state.rules.tuning.stealWindow * 0.25
    const chance = clamp(0.18 + stealFactor * 0.45 + windowBoost, 0.05, 0.92)

    if (Math.random() < chance) {
      this.state.players.forEach((p) => (p.hasBall = p.id === defender.id))
      this.state.ball.position = { x: defender.position.x, y: 1.05 + defender.position.y, z: defender.position.z }
      this.state.lastPlay = { event: 'steal', quality: chance }
    }

    this.state.flow.stealsOff = 30
  }

  public callForPass(callerId = 0): void {
    const caller = this.state.players[callerId]
    if (!caller) return

    const teammate = this.state.players.find((p) => p.team === caller.team && p.id !== caller.id)
    if (!teammate || !teammate.hasBall) return

    this.state.lastPlay = { event: 'call_for_pass', quality: 1 }
    if (this.state.flow.passOff <= 0 && !this.state.ball.inAir) this.attemptPass(teammate.id)
  }

  private stepDroneAI(): void {
    if (this.state.tick % 24 !== 0) return

    const droneBallHandler = this.state.players.find((p) => !p.isHuman && p.hasBall)
    if (!droneBallHandler || this.state.inboundTeam !== null || this.state.ball.inAir) return

    const hoop = droneBallHandler.team === 0 ? TEAM0_HOOP : TEAM1_HOOP
    const dist = Math.hypot(droneBallHandler.position.x - hoop.x, droneBallHandler.position.z - hoop.z)

    if (dist < 2.1 && Math.random() < 0.45) {
      this.attemptDunk(droneBallHandler.id)
      return
    }

    if (Math.random() < 0.55) {
      this.attemptShot(droneBallHandler.id)
      return
    }

    if (this.state.flow.passOff <= 0) this.attemptPass(droneBallHandler.id)
  }

  private integrateBall(): void {
    const { ball } = this.state
    if (!ball.inAir) return

    if (!ball.shotInFlight && ball.passTargetPlayerId !== null) {
      ball.position.x += ball.velocity.x
      ball.position.y += ball.velocity.y
      ball.position.z += ball.velocity.z

      const targetPlayer = this.state.players.find((p) => p.id === ball.passTargetPlayerId)
      if (!targetPlayer) {
        ball.inAir = false
        ball.shotInFlight = false
        ball.passTargetPlayerId = null
        ball.velocity = { x: 0, y: 0, z: 0 }
        return
      }

      const defender = this.state.players.find((p) => {
        if (p.team === targetPlayer.team) return false
        const d = Math.hypot(p.position.x - ball.position.x, p.position.z - ball.position.z)
        if (d > 0.8) return false
        const chance = 0.12 + (p.stealSkill / 10) * 0.35 + this.state.rules.tuning.stealWindow * 0.2
        return Math.random() < chance
      })

      if (defender) {
        this.state.players.forEach((p) => (p.hasBall = p.id === defender.id))
        ball.position = { x: defender.position.x, y: 1.05 + defender.position.y, z: defender.position.z }
        ball.inAir = false
        ball.shotInFlight = false
        ball.passTargetPlayerId = null
        ball.velocity = { x: 0, y: 0, z: 0 }
        this.state.lastPlay = { event: 'steal', quality: 0.75 }
        this.state.flow.stealsOff = 24
        return
      }

      const toTarget = Math.hypot(targetPlayer.position.x - ball.position.x, targetPlayer.position.z - ball.position.z)
      if (toTarget < 0.55) {
        this.state.players.forEach((p) => (p.hasBall = p.id === targetPlayer.id))
        ball.position = { x: targetPlayer.position.x, y: 1.05 + targetPlayer.position.y, z: targetPlayer.position.z }
        ball.inAir = false
        ball.shotInFlight = false
        ball.passTargetPlayerId = null
        ball.velocity = { x: 0, y: 0, z: 0 }
        return
      }

      return
    }

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
        ball.shotInFlight = false
      }
    }
  }

  private resolveLooseBallPickup(): void {
    if (this.state.ball.inAir) return
    if (this.state.players.some((p) => p.hasBall)) return

    const nearest = this.state.players
      .map((p) => ({ p, d: Math.hypot(p.position.x - this.state.ball.position.x, p.position.z - this.state.ball.position.z) }))
      .sort((a, b) => a.d - b.d)[0]

    if (nearest && nearest.d < 1.1) {
      this.state.players.forEach((p) => (p.hasBall = p.id === nearest.p.id))
      this.state.ball.position = { x: nearest.p.position.x, y: 1.05 + nearest.p.position.y, z: nearest.p.position.z }
    }
  }

  private anchorBallToCarrier(): void {
    if (this.state.ball.inAir) return
    const carrier = this.state.players.find((p) => p.hasBall)
    if (!carrier) return
    this.state.ball.position = { x: carrier.position.x, y: 1.05 + carrier.position.y, z: carrier.position.z }
  }

  private launchBallAt(target: Vec3, from: Vec3, offset: Vec3, made: boolean): void {
    const finalTarget = { x: target.x + offset.x, y: target.y + (made ? 0.15 : 0.1), z: target.z + offset.z }
    const dx = finalTarget.x - from.x
    const dz = finalTarget.z - from.z

    this.state.ball.inAir = true
    this.state.ball.shotInFlight = true
    this.state.ball.passTargetPlayerId = null
    this.state.ball.position = { x: from.x, y: 1.05, z: from.z }
    this.state.ball.target = finalTarget
    const distance = Math.hypot(dx, dz)
    const lateralScale = 0.038
    const arcBase = 0.29
    const arcByDistance = clamp(distance * 0.01, 0, 0.12)

    this.state.ball.velocity = {
      x: clamp(dx * lateralScale, -0.34, 0.34),
      y: arcBase + arcByDistance + (made ? 0.02 : -0.01),
      z: clamp(dz * lateralScale, -0.34, 0.34)
    }
  }

  private shotTimingQuality(chargeTicks: number): number {
    const ideal = 18
    const delta = Math.abs(chargeTicks - ideal)
    return clamp(1 - delta / 26, 0.45, 1.02)
  }

  private beginInbound(team: TeamId): void {
    const inbound = startInbound(team)
    this.state.inboundTeam = inbound.inboundTeam
    this.state.inboundCooldownTicks = inbound.cooldownTicks
    this.state.lastPlay.event = 'inbound'
    this.state.flow.stealsOff = 20
    this.state.flow.passOff = 8
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
