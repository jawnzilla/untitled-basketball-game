import type { GameState } from '../core/types'

const formatClock = (ticks: number) => {
  const totalSeconds = Math.floor(ticks / 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function Hud({ state }: { state: Readonly<GameState> }) {
  return (
    <div className="hud">
      <div>Q{state.score.quarter}</div>
      <div>{state.score.team0} - {state.score.team1}</div>
      <div>{formatClock(state.score.gameClockTicks)}</div>
      <div>Tick {state.tick}</div>
      <div>{state.inboundTeam === null ? 'Live Ball' : `Inbound: Team ${state.inboundTeam + 1}`}</div>
    </div>
  )
}
