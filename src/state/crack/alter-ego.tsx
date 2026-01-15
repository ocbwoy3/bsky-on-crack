import {useEffect, useMemo} from 'react'
import {type BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {
  ALTER_EGO_COLLECTION,
  type AlterEgoProfileOverlay,
  type AlterEgoRecord,
  applyAlterEgoProfile,
  parseAlterEgoUri,
  validateAlterEgoRecord,
} from '#/lib/crack/alter-ego'
import {logger} from '#/logger'
import {useCrackSettings} from '#/state/preferences'
import {useAgent, useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

const ALTER_EGO_QUERY_KEY = ['crack', 'alter-ego']
let alterEgoOverlayCache: AlterEgoProfileOverlay | null = null

export function getAlterEgoOverlayCache() {
  return alterEgoOverlayCache
}

function setAlterEgoOverlayCache(overlay: AlterEgoProfileOverlay | null) {
  alterEgoOverlayCache = overlay
}

function resolveBlobRefToUrl({
  agent,
  did,
  blob,
}: {
  agent: BskyAgent
  did: string
  blob: AlterEgoRecord['avatar']
}): string | undefined {
  if (!blob) return undefined
  const ref = blob.ref as unknown as {toString?: () => string; $link?: string}
  const cid = ref.$link || ref.toString?.()
  if (!cid) {
    throw new Error('Invalid blob reference.')
  }
  const baseUrl = agent.pdsUrl?.toString() ?? agent.serviceUrl.toString()
  return `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
    did,
  )}&cid=${encodeURIComponent(cid)}`
}

export async function fetchAlterEgoProfile({
  agent,
  uri,
}: {
  agent: BskyAgent
  uri: string
}): Promise<AlterEgoProfileOverlay> {
  const parsed = parseAlterEgoUri(uri)
  if (!parsed) {
    throw new Error('Invalid alter ego URI.')
  }

  const {repo, rkey} = parsed
  const recordResponse = await agent.com.atproto.repo.getRecord({
    repo,
    collection: ALTER_EGO_COLLECTION,
    rkey,
  })
  const record = recordResponse.data.value

  if (!validateAlterEgoRecord(record)) {
    throw new Error('Alter ego record failed client validation.')
  }

  let avatar: string | undefined
  let banner: string | undefined

  try {
    avatar = resolveBlobRefToUrl({agent, did: repo, blob: record.avatar})
  } catch (error) {
    logger.error('Failed to resolve alter ego avatar', {error})
  }

  try {
    banner = resolveBlobRefToUrl({agent, did: repo, blob: record.banner})
  } catch (error) {
    logger.error('Failed to resolve alter ego banner', {error})
  }

  return {
    uri,
    avatar,
    banner,
    displayName: record.displayName,
    description: record.description,
    handle: record.handle,
  }
}

export function useAlterEgoOverlay() {
  const agent = useAgent()
  const settings = useCrackSettings()
  const uri = settings.alterEgoUri?.trim()
  useEffect(() => {
    if (!uri) {
      setAlterEgoOverlayCache(null)
    }
  }, [uri])
  return useQuery({
    queryKey: [...ALTER_EGO_QUERY_KEY, uri],
    enabled: Boolean(uri),
    queryFn: async () => {
      if (!uri) return undefined
      return fetchAlterEgoProfile({agent, uri})
    },
    //@ts-expect-error
    onSuccess: overlay => {
      if (overlay) {
        setAlterEgoOverlayCache(overlay)
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAlterEgoProfile<
  TProfile extends bsky.profile.AnyProfileView,
>(profile?: TProfile): TProfile | undefined {
  const {currentAccount} = useSession()
  const {data: overlay} = useAlterEgoOverlay()

  return useMemo(() => {
    if (!profile) return profile
    if (!overlay || profile.did !== currentAccount?.did) {
      return profile
    }
    return applyAlterEgoProfile(profile, overlay)
  }, [profile, overlay, currentAccount?.did])
}
