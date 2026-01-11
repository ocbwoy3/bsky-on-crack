import {type Schema} from '#/state/persisted/schema'

export type CrackSettings = NonNullable<Schema['crackSettings']>
export type CrackSettingKey = keyof CrackSettings

export const crackSettingsDefaults: CrackSettings = {
  kawaiiMode: false,
  showWelcomeModal: true,
  customVerificationsEnabled: false,
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

export type CrackSettingsSection = {
  id: string
  title: string
  description: string
  items: CrackSettingsItem[]
}

export const crackSettingsSections: CrackSettingsSection[] = [
  {
    id: 'visuals',
    title: 'Visuals',
    description: 'Branding, logos, and UI flourishes.',
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
    id: 'verification',
    title: 'Verification',
    description: 'Experimental verification tweaks.',
    items: [
      {
        type: 'toggle',
        key: 'customVerificationsEnabled',
        label: 'Custom verifications',
        description: 'Use trusted verifiers you choose instead of defaults.',
      },
    ],
  },
  {
    id: 'web',
    title: 'Web',
    description: 'Behavior only used on the web client.',
    items: [
      {
        type: 'button',
        id: 'openWelcomeModal',
        label: 'Welcome modal',
        description: 'Force open the welcome modal right now.',
        buttonLabel: 'Open',
      },
    ],
  },
]
