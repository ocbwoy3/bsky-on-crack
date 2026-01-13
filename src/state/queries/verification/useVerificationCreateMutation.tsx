import {type AppBskyActorDefs, type AppBskyActorGetProfile} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAgent, useSession} from '#/state/session'
import {clearCustomVerificationCacheForProfile} from '#/state/verification/custom-verification'
import type * as bsky from '#/types/bsky'

// ocbwoy3
function buildOptimisticVerificationState_ocbwoy3({
  profile,
  issuerDid,
  uri,
  createdAt,
}: {
  profile: bsky.profile.AnyProfileView
  issuerDid: string
  uri: string
  createdAt: string
}): AppBskyActorDefs.VerificationState {
  const existing = profile.verification?.verifications ?? []
  const next = existing.some(v => v.uri === uri)
    ? existing
    : [
        ...existing,
        {
          issuer: issuerDid,
          isValid: true,
          createdAt,
          uri,
        },
      ]

  next.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    $type: 'app.bsky.actor.defs#verificationState',
    verifications: next,
    verifiedStatus: next.some(v => v.isValid)
      ? 'valid'
      : next.length
        ? 'invalid'
        : 'none',
    trustedVerifierStatus:
      profile.verification?.trustedVerifierStatus ?? 'none',
  }
}

export function useVerificationCreateMutation() {
  const agent = useAgent()
  const qc = useQueryClient() // <-- ocbwoy3
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({profile}: {profile: bsky.profile.AnyProfileView}) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const createdAt = new Date().toISOString()
      const {uri} = await agent.app.bsky.graph.verification.create(
        {repo: currentAccount.did},
        {
          subject: profile.did,
          createdAt,
          handle: profile.handle,
          displayName: profile.displayName || '',
        },
      )
      return {uri, createdAt}
    },
    onSuccess({uri, createdAt}, {profile}) {
      logger.metric('verification:create', {}, {statsig: true})
      if (currentAccount) {
        // <-- ocbwoy3 (entire if block)
        const optimisticVerification = buildOptimisticVerificationState_ocbwoy3(
          {
            profile,
            issuerDid: currentAccount.did,
            uri,
            createdAt,
          },
        )
        updateProfileShadow(qc, profile.did, {
          verification: optimisticVerification,
        })
      }
      clearCustomVerificationCacheForProfile(profile.did)
      // eslint-disable-next-line no-void
      void (async () => {
        // <-- ocbwoy3
        let confirmed = false
        try {
          await until(
            5,
            1e3,
            ({data: updatedProfile}: AppBskyActorGetProfile.Response) =>
              Boolean(
                updatedProfile.verification?.verifications.some(
                  v => v.uri === uri,
                ),
              ),
            () => agent.getProfile({actor: profile.did ?? ''}),
          )
          confirmed = true
        } catch (error) {
          logger.error('verification:create reconcile failed', {
            safeMessage: error,
          })
        }
        if (confirmed) {
          await updateProfileVerificationCache({profile})
        }
      })()
    },
  })
}
