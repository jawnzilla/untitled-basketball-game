import type { GameState } from '../core/types'

type Props = {
  state: Readonly<GameState>
  onPreset: (preset: 'classic' | 'competitive' | 'custom') => void
  onTune: (key: keyof GameState['rules']['tuning'], value: number) => void
}

const slider = (
  label: string,
  value: number,
  onChange: (v: number) => void
) => (
  <label className="ruleRow">
    <span>{label}</span>
    <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    <strong>{Math.round(value * 100)}%</strong>
  </label>
)

export function RulesPanel({ state, onPreset, onTune }: Props) {
  const { preset, tuning } = state.rules

  return (
    <aside className="rulesPanel">
      <h3>Gameplay Profile</h3>
      <div className="presetRow">
        <button className={preset === 'classic' ? 'active' : ''} onClick={() => onPreset('classic')}>Classic</button>
        <button className={preset === 'competitive' ? 'active' : ''} onClick={() => onPreset('competitive')}>Competitive</button>
        <button className={preset === 'custom' ? 'active' : ''} onClick={() => onPreset('custom')}>Custom</button>
      </div>

      {slider('CPU Assist / Rubberband', tuning.cpuAssist, (v) => onTune('cpuAssist', v))}
      {slider('Dunk Frequency', tuning.dunkFrequency, (v) => onTune('dunkFrequency', v))}
      {slider('Steal Window', tuning.stealWindow, (v) => onTune('stealWindow', v))}
      {slider('On Fire Boost', tuning.onFireBoost, (v) => onTune('onFireBoost', v))}
      {slider('Shot Variance', tuning.shotVariance, (v) => onTune('shotVariance', v))}
    </aside>
  )
}
