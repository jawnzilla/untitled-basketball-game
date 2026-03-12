import type { GameState } from '../core/types'

const formatClock = (ticks: number) => {
  const totalSeconds = Math.floor(ticks / 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const eventText: Record<GameState['lastPlay']['event'], string> = {
  none: 'No event',
  shot_made: 'Shot made',
  shot_miss: 'Shot missed',
  dunk_made: 'Dunk made',
  dunk_fail: 'Dunk failed',
  inbound: 'Inbound sequence',
  steal: 'Steal',
  pass: 'Pass',
  call_for_pass: 'Call for pass'
}

export function Hud({ state }: { state: Readonly<GameState> }) {
  const human = state.players[0]
  return (
    <div className="hud">
      <div>Q{state.score.quarter}</div>
      <div>{state.score.team0} - {state.score.team1}</div>
      <div>{formatClock(state.score.gameClockTicks)}</div>
      <div>Tick {state.tick}</div>
      <div>{state.inboundTeam === null ? 'Live Ball' : `Inbound: Team ${state.inboundTeam + 1} (${state.inboundCooldownTicks})`}</div>
      <div>{eventText[state.lastPlay.event]} ({Math.round(state.lastPlay.quality * 100)}%)</div>
      <div>pass_off: {state.flow.passOff}</div>
      <div>steals_off: {state.flow.stealsOff}</div>
      <div>charge: {human.shotChargeTicks}</div>
    </div>
  )
}
