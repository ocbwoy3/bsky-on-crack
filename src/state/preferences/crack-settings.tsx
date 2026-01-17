import React from 'react'

import {parseAlterEgoUri} from '#/lib/crack/alter-ego'
import {logger} from '#/logger'
import {
  createCrackSettingsPreference,
  fetchCrackSettingsPreference,
  mergeCrackSettingsPreference,
  putCrackSettingsPreference,
} from '#/state/crack/settings-preferences'
import * as persisted from '#/state/persisted'
import {
  type CrackSettings,
  crackSettingsDefaults,
} from '#/state/preferences/crack-settings-api'
import {useAgent, useSession} from '#/state/session'
import {IS_WEB} from '#/env'

const defaultSettings = crackSettingsDefaults

const stateContext = React.createContext<CrackSettings>(defaultSettings)
stateContext.displayName = 'CrackSettingsStateContext'

const apiContext = React.createContext<{
  set: (next: CrackSettings) => void
  update: (patch: Partial<CrackSettings>) => void
}>({
  set: () => {},
  update: () => {},
})
apiContext.displayName = 'CrackSettingsApiContext'

function resolveSettings(settings?: persisted.Schema['crackSettings']) {
  const legacyKawaii = persisted.get('kawaii')
  const alterEgoByDid = {...(settings?.alterEgoByDid ?? {})}
  const alterEgoRecords = {...(settings?.alterEgoRecords ?? {})}
  if (
    settings?.alterEgoUri &&
    Object.keys(alterEgoByDid).length === 0 &&
    !alterEgoRecords[settings.alterEgoUri]
  ) {
    const parsed = parseAlterEgoUri(settings.alterEgoUri)
    if (parsed) {
      alterEgoByDid[parsed.repo] = settings.alterEgoUri
    }
  }
  return {
    ...defaultSettings,
    ...settings,
    kawaiiMode:
      settings?.kawaiiMode ??
      (typeof legacyKawaii === 'boolean'
        ? legacyKawaii
        : defaultSettings.kawaiiMode),
    alterEgoByDid,
    alterEgoRecords,
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const agent = useAgent()
  const {currentAccount, hasSession} = useSession()
  const [state, setState] = React.useState<CrackSettings>(() =>
    resolveSettings(persisted.get('crackSettings')),
  )
  const [isRemoteLoaded, setIsRemoteLoaded] = React.useState(false)
  const pendingRemoteSync = React.useRef<CrackSettings | null>(null)

  const persistState = React.useCallback(
    (next: CrackSettings) => {
      setState(next)
      persisted.write('crackSettings', next)
      if (typeof next.kawaiiMode === 'boolean') {
        persisted.write('kawaii', next.kawaiiMode)
      }
    },
    [setState],
  )

  const queueRemoteSync = React.useCallback(
    (next: CrackSettings) => {
      if (!hasSession || !agent?.did) {
        return
      }
      if (!isRemoteLoaded) {
        pendingRemoteSync.current = next
        return
      }
      const preference = createCrackSettingsPreference(next)
      putCrackSettingsPreference(agent, preference).catch(error => {
        logger.error('Failed to sync crack settings preference', {error})
      })
    },
    [agent, hasSession, isRemoteLoaded],
  )

  const set = React.useCallback(
    (next: CrackSettings) => {
      persistState(next)
      queueRemoteSync(next)
    },
    [persistState, queueRemoteSync],
  )

  const update = React.useCallback(
    (patch: Partial<CrackSettings>) => {
      setState(prev => {
        const next = {...prev, ...patch}
        persisted.write('crackSettings', next)
        if (typeof next.kawaiiMode === 'boolean') {
          persisted.write('kawaii', next.kawaiiMode)
        }
        queueRemoteSync(next)
        return next
      })
    },
    [queueRemoteSync],
  )

  React.useEffect(() => {
    return persisted.onUpdate('crackSettings', next => {
      setState(resolveSettings(next))
    })
  }, [])

  React.useEffect(() => {
    if (!persisted.get('crackSettings')) {
      persistState(resolveSettings(undefined))
    }
  }, [persistState])

  React.useEffect(() => {
    let cancelled = false
    const syncFromRemote = async () => {
      if (!hasSession || !agent?.did || !currentAccount?.did) {
        return
      }
      const pref = await fetchCrackSettingsPreference(agent)
      if (cancelled) return
      if (pref) {
        setState(prev => {
          const merged = mergeCrackSettingsPreference(prev, pref)
          persisted.write('crackSettings', merged)
          if (typeof merged.kawaiiMode === 'boolean') {
            persisted.write('kawaii', merged.kawaiiMode)
          }
          return merged
        })
      }
      setIsRemoteLoaded(true)
      if (pendingRemoteSync.current) {
        queueRemoteSync(pendingRemoteSync.current)
        pendingRemoteSync.current = null
      }
    }
    syncFromRemote().catch(error => {
      logger.error('Failed to load crack settings preference', {error})
      setIsRemoteLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [agent, currentAccount?.did, hasSession, queueRemoteSync])

  React.useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return
    const kawaiiParam = new URLSearchParams(window.location.search).get(
      'kawaii',
    )
    if (kawaiiParam === 'true' || kawaiiParam === 'false') {
      update({kawaiiMode: kawaiiParam === 'true'})
    }
  }, [update])

  const api = React.useMemo(() => ({set, update}), [set, update])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useCrackSettings() {
  return React.useContext(stateContext)
}

export function useCrackSettingsApi() {
  return React.useContext(apiContext)
}
