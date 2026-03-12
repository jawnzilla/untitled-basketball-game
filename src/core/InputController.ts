export class InputController {
  private pressed = new Set<string>()
  private justPressed = new Set<string>()
  private holdFrames = new Map<string, number>()

  attach(): void {
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
  }

  detach(): void {
    window.removeEventListener('keydown', this.onDown)
    window.removeEventListener('keyup', this.onUp)
  }

  beginFrame(): void {
    for (const code of this.pressed) {
      this.holdFrames.set(code, (this.holdFrames.get(code) ?? 0) + 1)
    }
  }

  endFrame(): void {
    this.justPressed.clear()
  }

  isPressed(code: string): boolean {
    return this.pressed.has(code)
  }

  wasJustPressed(code: string): boolean {
    return this.justPressed.has(code)
  }

  getHoldFrames(code: string): number {
    return this.holdFrames.get(code) ?? 0
  }

  private onDown = (event: KeyboardEvent): void => {
    if (!this.pressed.has(event.code)) {
      this.justPressed.add(event.code)
      this.holdFrames.set(event.code, 0)
    }
    this.pressed.add(event.code)
  }

  private onUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code)
    this.holdFrames.delete(event.code)
  }
}
