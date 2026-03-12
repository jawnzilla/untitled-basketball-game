const FIXED_STEP_MS = 1000 / 60

export class GameLoop {
  private running = false
  private previousTime = 0
  private accumulator = 0

  constructor(private readonly onStep: () => void) {}

  start(): void {
    if (this.running) return
    this.running = true
    this.previousTime = performance.now()
    requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
  }

  private frame = (now: number): void => {
    if (!this.running) return

    const delta = now - this.previousTime
    this.previousTime = now
    this.accumulator += delta

    while (this.accumulator >= FIXED_STEP_MS) {
      this.onStep()
      this.accumulator -= FIXED_STEP_MS
    }

    requestAnimationFrame(this.frame)
  }
}
