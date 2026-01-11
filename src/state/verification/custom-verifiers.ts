import {useCallback, useMemo} from 'react'

import {useCrackSettings} from '#/state/preferences'
import {useSession} from '#/state/session'
import {clearCustomVerificationCache} from '#/state/verification/custom-verification'
import {account, useStorage} from '#/storage'

const FALLBACK_ACCOUNT_SCOPE = 'pwi'

export function useCustomVerificationEnabled() {
  const {customVerificationsEnabled} = useCrackSettings()
  return Boolean(customVerificationsEnabled)
}

export function useCustomVerificationTrustedList() {
  const {currentAccount} = useSession()
  const scope = currentAccount?.did ?? FALLBACK_ACCOUNT_SCOPE
  const [trusted = [], setTrusted] = useStorage(account, [
    scope,
    'trustedVerifiers',
  ] as const)

  const addTrusted = useCallback(
    (did: string) => {
      if (!did) return
      const next = new Set(trusted)
      next.add(did)
      setTrusted(Array.from(next))
      clearCustomVerificationCache()
    },
    [setTrusted, trusted],
  )

  const removeTrusted = useCallback(
    (did: string) => {
      setTrusted(trusted.filter(entry => entry !== did))
      clearCustomVerificationCache()
    },
    [setTrusted, trusted],
  )

  const toggleTrusted = useCallback(
    (did: string) => {
      if (trusted.includes(did)) {
        removeTrusted(did)
      } else {
        addTrusted(did)
      }
    },
    [addTrusted, removeTrusted, trusted],
  )

  const trustedSet = useMemo(() => new Set(trusted), [trusted])

  return {trusted, trustedSet, addTrusted, removeTrusted, toggleTrusted}
}

export function useCustomVerificationTrusted(mandatoryDid?: string) {
  const {trustedSet} = useCustomVerificationTrustedList()
  return useMemo(() => {
    const next = new Set(trustedSet)
    if (mandatoryDid) {
      next.add(mandatoryDid)
    }
    return next
  }, [mandatoryDid, trustedSet])
}
