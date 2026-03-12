import type { GameState } from './types'

const TICKS_PER_SECOND = 60

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
      players: [
        { id: 0, team: 0, shotSkill: 7, dunkSkill: 8, stealSkill: 6, onFire: false, hasBall: true },
        { id: 1, team: 0, shotSkill: 6, dunkSkill: 9, stealSkill: 5, onFire: false, hasBall: false },
        { id: 2, team: 1, shotSkill: 8, dunkSkill: 6, stealSkill: 8, onFire: false, hasBall: false },
        { id: 3, team: 1, shotSkill: 5, dunkSkill: 7, stealSkill: 7, onFire: false, hasBall: false }
      ],
      ball: {
        position: { x: 0, y: 1, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        inAir: false
      }
    }
  }

  public getState(): Readonly<GameState> {
    return this.state
  }

  public step(): void {
    this.state.tick += 1

    if (this.state.score.gameClockTicks > 0) {
      this.state.score.gameClockTicks -= 1
    }

    this.integrateBall()
  }

  private integrateBall(): void {
    const { ball } = this.state
    if (!ball.inAir) return

    ball.velocity.y -= 0.012

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

  public testShot(): void {
    const { ball } = this.state
    ball.inAir = true
    ball.velocity = { x: 0.03, y: 0.26, z: -0.03 }
  }
}
