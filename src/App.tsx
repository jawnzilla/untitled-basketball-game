import { useEffect, useMemo, useState } from 'react'
import { GameLoop } from './core/GameLoop'
import { GameStateManager } from './core/GameStateManager'
import { InputController } from './core/InputController'
import type { GameState } from './core/types'
import { UBGPrototypeScene } from './game/UBGPrototypeScene'
import { Hud } from './ui/Hud'

export function App() {
  const stateManager = useMemo(() => new GameStateManager(), [])
  const input = useMemo(() => new InputController(), [])

  const [state, setState] = useState<Readonly<GameState>>(stateManager.getState())

  useEffect(() => {
    input.attach()

    const loop = new GameLoop(() => {
      if (input.isPressed('KeyS')) {
        stateManager.attemptShot(0)
      }

      if (input.isPressed('KeyD')) {
        stateManager.attemptDunk(0)
      }

      stateManager.step()
      setState({ ...stateManager.getState() })
    })

    loop.start()

    return () => {
      loop.stop()
      input.detach()
    }
  }, [input, stateManager])

  return (
    <main className="app">
      <Hud state={state} />
      <div className="viewport">
        <UBGPrototypeScene state={state} />
      </div>
      <div className="help">Controls: S = Shot attempt, D = Dunk attempt.</div>
    </main>
  )
}
