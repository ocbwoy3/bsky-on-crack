import {type BskyAgent} from '@atproto/api'

import {
  ALTER_EGO_COLLECTION,
  type AlterEgoProfileOverlay,
  type AlterEgoRecord,
  parseAlterEgoUri,
  validateAlterEgoRecord,
} from '#/lib/crack/alter-ego'
import {logger} from '#/logger'
import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'

export function resolveAlterEgoBlobRefToUrl({
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
    avatar = resolveAlterEgoBlobRefToUrl({
      agent,
      did: repo,
      blob: record.avatar,
    })
  } catch (error) {
    logger.error('Failed to resolve alter ego avatar', {error})
  }

  try {
    banner = resolveAlterEgoBlobRefToUrl({
      agent,
      did: repo,
      blob: record.banner,
    })
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

export function useActiveAlterEgo(did: string) {
  const settings = useCrackSettings()
  const activeUri = settings.alterEgoByDid?.[did]
  return activeUri ? settings.alterEgoRecords?.[activeUri] : undefined
}

export function useSetActiveAlterEgo() {
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  return (did: string, uri: string | null) => {
    const nextByDid = {...(settings.alterEgoByDid ?? {})}
    if (uri) {
      nextByDid[did] = uri
      update({alterEgoByDid: nextByDid, alterEgoUri: uri})
    } else {
      delete nextByDid[did]
      update({alterEgoByDid: nextByDid, alterEgoUri: undefined})
    }
  }
}
