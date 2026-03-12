export class InputController {
  private pressed = new Set<string>()

  attach(): void {
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
  }

  detach(): void {
    window.removeEventListener('keydown', this.onDown)
    window.removeEventListener('keyup', this.onUp)
  }

  isPressed(code: string): boolean {
    return this.pressed.has(code)
  }

  private onDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code)
  }

  private onUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code)
  }
}
