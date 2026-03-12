import { useEffect, useMemo, useState } from 'react'
import { GameLoop } from './core/GameLoop'
import { GameStateManager } from './core/GameStateManager'
import { InputController } from './core/InputController'
import type { GameState } from './core/types'
import { UBGPrototypeScene } from './game/UBGPrototypeScene'
import { Hud } from './ui/Hud'
import { RulesPanel } from './ui/RulesPanel'

export function App() {
  const stateManager = useMemo(() => new GameStateManager(), [])
  const input = useMemo(() => new InputController(), [])

  const [state, setState] = useState<Readonly<GameState>>(stateManager.getState())

  useEffect(() => {
    input.attach()

    const loop = new GameLoop(() => {
      if (input.isPressed('KeyS')) stateManager.attemptShot(0)
      if (input.isPressed('KeyD')) stateManager.attemptDunk(0)
      if (input.isPressed('KeyA')) stateManager.attemptSteal(0)
      if (input.isPressed('KeyF')) stateManager.attemptPass(0)
      if (input.isPressed('KeyC')) stateManager.callForPass(0)

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
      <section className="content">
        <div className="viewport">
          <UBGPrototypeScene state={state} />
        </div>
        <RulesPanel
          state={state}
          onPreset={(preset) => {
            stateManager.setPreset(preset)
            setState({ ...stateManager.getState() })
          }}
          onTune={(key, value) => {
            stateManager.setTuningValue(key, value)
            setState({ ...stateManager.getState() })
          }}
        />
      </section>
      <div className="help">Controls: S Shot • D Dunk • A Steal • F Pass • C Call for Pass</div>
    </main>
  )
}
