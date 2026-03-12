export type PresetId = 'classic' | 'competitive' | 'custom'

export interface GameplayTuning {
  cpuAssist: number // 0..1
  dunkFrequency: number // 0..1
  stealWindow: number // 0..1
  onFireBoost: number // 0..1
  shotVariance: number // 0..1
}

export const PRESETS: Record<PresetId, GameplayTuning> = {
  classic: {
    cpuAssist: 0.75,
    dunkFrequency: 0.7,
    stealWindow: 0.65,
    onFireBoost: 0.85,
    shotVariance: 0.6
  },
  competitive: {
    cpuAssist: 0.15,
    dunkFrequency: 0.5,
    stealWindow: 0.45,
    onFireBoost: 0.35,
    shotVariance: 0.35
  },
  custom: {
    cpuAssist: 0.5,
    dunkFrequency: 0.5,
    stealWindow: 0.5,
    onFireBoost: 0.5,
    shotVariance: 0.5
  }
}
