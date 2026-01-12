import React from 'react'
import {LayoutAnimation, View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {emitOpenSettingsHelpModal, emitOpenWelcomeModal} from '#/state/events'
import {
  type CrackSettings,
  type CrackSettingsButtonItem,
  type CrackSettingsSection,
  crackSettingsSections,
  useCrackSettings,
  useCrackSettingsApi,
} from '#/state/preferences'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogOuterProps} from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import {Text} from '#/components/Typography'

export function CrackSettingsDialog({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const {_} = useLingui()
  const t = useTheme()
  const reducedMotion = useReducedMotion()
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  const [openSections, setOpenSections] = React.useState(() =>
    crackSettingsSections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = true
      return acc
    }, {}),
  )

  const toggleSection = React.useCallback(
    (section: CrackSettingsSection) => {
      if (!reducedMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      }
      setOpenSections(prev => ({
        ...prev,
        [section.id]: !prev[section.id],
      }))
    },
    [reducedMotion],
  )

  const onToggleSetting = React.useCallback(
    (key: keyof CrackSettings, value: boolean) => {
      update({[key]: value} as Partial<CrackSettings>)
    },
    [update],
  )

  const onPressButton = React.useCallback((item: CrackSettingsButtonItem) => {
    switch (item.id) {
      case 'openWelcomeModal':
        emitOpenWelcomeModal()
        break
      case 'openSettingsHelpModal':
        emitOpenSettingsHelpModal()
        break
    }
  }, [])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Crack settings`)}
        style={web({maxWidth: 420})}>
        <View style={[a.flex_row, a.align_start, a.justify_between, a.gap_md]}>
          <View style={[a.flex_1, a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Crack settings</Trans>
            </Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Exactly what it sounds like</Trans>
            </Text>
          </View>
          <Button
            label={_(msg`Close crack settings`)}
            size="tiny"
            shape="round"
            variant="ghost"
            color="secondary"
            onPress={() => control.close()}>
            <ButtonIcon icon={XIcon} />
          </Button>
        </View>
        <View style={[a.mt_md, a.gap_md]}>
          {crackSettingsSections.map(section => {
            const isOpen = openSections[section.id]
            return (
              <View key={section.id} style={[a.gap_sm]}>
                <SettingsList.PressableItem
                  label={_(msg`Toggle ${section.title} section`)}
                  onPress={() => toggleSection(section)}>
                  <View style={[a.flex_1, a.gap_2xs]}>
                    <Text style={[a.text_md, a.font_semi_bold]}>
                      {section.title}
                    </Text>
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {section.description}
                    </Text>
                  </View>
                  <SettingsList.ItemIcon
                    icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
                    size="md"
                  />
                </SettingsList.PressableItem>
                {isOpen && (
                  <View style={[a.gap_sm]}>
                    {section.items.map(item => {
                      if (item.type === 'toggle') {
                        const icon =
                          item.key === 'kawaiiMode'
                            ? SparkleIcon
                            : item.key === 'customVerificationsEnabled'
                              ? CircleCheckIcon
                              : WindowIcon
                        const value = settings[item.key]
                        return (
                          <Toggle.Item
                            key={item.key}
                            type="checkbox"
                            name={item.key}
                            label={item.label}
                            value={value}
                            onChange={next => onToggleSetting(item.key, next)}>
                            <SettingsList.Item>
                              <SettingsList.ItemIcon icon={icon} />
                              <View style={[a.flex_1, a.gap_2xs]}>
                                <Text style={[a.text_md, a.font_semi_bold]}>
                                  {item.label}
                                </Text>
                                <Text
                                  style={[
                                    a.text_sm,
                                    t.atoms.text_contrast_medium,
                                  ]}>
                                  {item.description}
                                </Text>
                              </View>
                              <Toggle.Platform />
                            </SettingsList.Item>
                          </Toggle.Item>
                        )
                      }

                      return (
                        <SettingsList.Item key={item.id}>
                          <SettingsList.ItemIcon icon={WindowIcon} />
                          <View style={[a.flex_1, a.gap_2xs]}>
                            <Text style={[a.text_md, a.font_semi_bold]}>
                              {item.label}
                            </Text>
                            <Text
                              style={[a.text_sm, t.atoms.text_contrast_medium]}>
                              {item.description}
                            </Text>
                          </View>
                          <Button
                            label={item.buttonLabel}
                            size="tiny"
                            shape="round"
                            variant="outline"
                            color="secondary"
                            onPress={() => onPressButton(item)}>
                            <ButtonText>{item.buttonLabel}</ButtonText>
                          </Button>
                        </SettingsList.Item>
                      )
                    })}
                  </View>
                )}
                <SettingsList.Divider />
              </View>
            )
          })}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
