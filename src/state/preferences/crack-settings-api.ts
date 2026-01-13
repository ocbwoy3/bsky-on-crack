import {isWeb} from '#/platform/detection'
import {type Schema} from '#/state/persisted/schema'

export type CrackSettings = NonNullable<Schema['crackSettings']>
export type CrackSettingKey = keyof CrackSettings

export const crackSettingsDefaults: CrackSettings = {
  kawaiiMode: false,
  showWelcomeModal: true,
  customVerificationsEnabled: false,
  uncapLabelerLimit: false,
}

export type CrackSettingsToggleItem = {
  type: 'toggle'
  key: CrackSettingKey
  label: string
  description: string
}

export type CrackSettingsButtonItem = {
  type: 'button'
  id: string
  label: string
  description: string
  buttonLabel: string
}

export type CrackSettingsItem =
  | CrackSettingsToggleItem
  | CrackSettingsButtonItem

export type CrackSettingsItemWithPredicate = CrackSettingsItem & {
  predicate?: () => boolean
}

export type CrackSettingsSection = {
  id: string
  title: string
  description: string
  items: CrackSettingsItemWithPredicate[]
}

export const APPVIEW_DEFAULT_VERIFIERS: string[] = [
  'did:plc:z72i7hdynmk6r22z27h6tvur', // <-- Bluesky
  'did:plc:inz4fkbbp7ms3ixufw6xuvdi', // <-- WIRED
  'did:plc:b2kutgxqlltwc6lhs724cfwr', // <-- The Athletic
  'did:plc:eclio37ymobqex2ncko63h4r', // <-- The New York Times
]

export const NEG_APPVIEW_VERIFIERS_LABELER_SUB: {[did: string]: string[]} = {
  // anti-transphobia labeler
  'did:plc:4ugewi6aca52a62u62jccbl7': [
    'did:plc:eclio37ymobqex2ncko63h4r', // <-- nyt
  ],
}

export const crackSettingsSections: CrackSettingsSection[] = [
  {
    id: 'bluesky',
    title: 'Bluesky',
    description: 'All the cool stuff.',
    items: [
      {
        type: 'toggle',
        key: 'kawaiiMode',
        label: 'Kawaii mode',
        description: 'Swap in the cute logo.',
      },
    ],
  },
  {
    id: 'atproto',
    title: 'AT Protocol',
    description: 'Highly technical, I know.',
    items: [
      {
        type: 'toggle',
        key: 'uncapLabelerLimit',
        label: 'Uncap labeler limit',
        description: "Removes Bluesky's 20 labeler limit. Might break.",
      },
      {
        type: 'toggle',
        key: 'customVerificationsEnabled',
        label: 'Blue checkmark',
        description:
          'Become your own verifier, select your own trusted verifiers.',
      },
    ],
  },
  {
    id: 'nux',
    title: 'NUX',
    description: 'New user stuff',
    items: [
      {
        type: 'button',
        id: 'openSettingsHelpModal',
        label: 'Settings - Welcome',
        description: "What you'd see by default.",
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openWelcomeModal',
        label: 'Welcome',
        description: 'Web only',
        buttonLabel: 'Open',
        predicate: () => Boolean(isWeb),
      },
    ],
  },
]
