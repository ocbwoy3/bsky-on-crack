import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'

// Statsig has been removed, so these are mocks/stubs.
type Gate = string

export function useStatsigGateOverrides(): Record<Gate, boolean> {
  const settings = useCrackSettings()
  return (settings.statsigGateOverrides ?? {}) as Record<Gate, boolean>
}

export function useSetStatsigGateOverride() {
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  return (gate: Gate, value: boolean | null) => {
    const nextOverrides = {...(settings.statsigGateOverrides ?? {})} as Record<
      Gate,
      boolean
    >
    if (value === null) {
      delete nextOverrides[gate]
    } else {
      nextOverrides[gate] = value
    }
    update({statsigGateOverrides: nextOverrides})
  }
}

export function StatsigGateOverridesBootstrap() {
  // Statsig is removed.
  return null
}