import {useEffect} from 'react'

import {type Gate, GATES} from '#/lib/statsig/gates'
import {useDangerousSetGate} from '#/lib/statsig/statsig'
import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'

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
  const overrides = useStatsigGateOverrides()
  const setGate = useDangerousSetGate()

  useEffect(() => {
    for (const gate of GATES) {
      const value = overrides[gate]
      if (typeof value === 'boolean') {
        setGate(gate, value)
      }
    }
  }, [overrides, setGate])

  return null
}
