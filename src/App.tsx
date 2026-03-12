import { useEffect, useMemo, useRef, useState } from 'react'
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
  const wasChargingRef = useRef(false)

  useEffect(() => {
    input.attach()

    const loop = new GameLoop(() => {
      input.beginFrame()

      const dx = (input.isPressed('ArrowRight') ? 1 : 0) - (input.isPressed('ArrowLeft') ? 1 : 0)
      const dz = (input.isPressed('ArrowDown') ? 1 : 0) - (input.isPressed('ArrowUp') ? 1 : 0)
      if (dx !== 0 || dz !== 0) stateManager.moveHuman(dx, dz)

      if (input.wasJustPressed('Space')) stateManager.jump(0)

      const charging = input.isPressed('KeyS')
      stateManager.setShotCharge(0, charging)
      if (wasChargingRef.current && !charging) {
        stateManager.releaseShoot(0)
      }
      wasChargingRef.current = charging

      if (input.wasJustPressed('KeyA')) stateManager.attemptSteal(0)
      if (input.wasJustPressed('KeyF')) stateManager.attemptPass(0)
      if (input.wasJustPressed('KeyC')) stateManager.callForPass(0)

      stateManager.step()
      setState({ ...stateManager.getState() })
      input.endFrame()
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
          onAutoMakeShots={(enabled) => {
            stateManager.setAutoMakeShots(enabled)
            setState({ ...stateManager.getState() })
          }}
        />
      </section>
      <div className="help">Move: Arrow Keys • Jump: Space • Shoot: Hold+Release S • A Steal • F Pass • C Call for Pass</div>
    </main>
  )
}
