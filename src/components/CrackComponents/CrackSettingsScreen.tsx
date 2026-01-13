import {Fragment} from 'react'
import {type ComponentType} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {emitOpenSettingsHelpModal, emitOpenWelcomeModal} from '#/state/events'
import {
  type CrackSettings,
  type CrackSettingsButtonItem,
  type CrackSettingsSection,
  crackSettingsSections,
  useCrackSettings,
  useCrackSettingsApi,
} from '#/state/preferences'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CrackSettings'>

const sectionIcons: Record<string, ComponentType<SVGIconProps>> = {
  bluesky: SparkleIcon,
  verification: CircleCheckIcon,
  atproto: FilterIcon,
  nux: WindowIcon,
}

export function CrackSettingsScreen({}: Props) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  const navigation = useNavigation<NavigationProp>()

  const onToggleSetting = (key: keyof CrackSettings, value: boolean) => {
    update({[key]: value} as Partial<CrackSettings>)
  }

  const onPressButton = (item: CrackSettingsButtonItem) => {
    switch (item.id) {
      case 'openWelcomeModal':
        emitOpenWelcomeModal()
        break
      case 'openSettingsHelpModal':
        emitOpenSettingsHelpModal()
        break
      case 'openVerificationSettings':
        navigation.navigate('CrackVerificationSettings')
        break
    }
  }

  return (
    <Layout.Screen testID="crackSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Bluesky on crack</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.pt_2xl, a.px_lg, gtMobile && a.px_2xl]}>
          {crackSettingsSections.map((section, sectionIndex) => {
            const visibleItems = section.items.filter(
              item => !item.predicate || item.predicate(),
            )
            if (!visibleItems.length) return null
            return (
              <View key={section.id} style={[sectionIndex > 0 && a.pt_2xl]}>
                <Text
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    a.pb_md,
                    t.atoms.text_contrast_high,
                  ]}>
                  {section.title}
                </Text>
                <View
                  style={[
                    a.w_full,
                    a.rounded_md,
                    a.overflow_hidden,
                    t.atoms.bg_contrast_25,
                  ]}>
                  {visibleItems.map((item, itemIndex) => (
                    <Fragment key={item.type === 'toggle' ? item.key : item.id}>
                      {itemIndex > 0 && <Divider />}
                      {item.type === 'toggle' ? (
                        <ToggleRow
                          icon={getItemIcon(item)}
                          title={item.label}
                          description={item.description}
                          name={item.key}
                          value={settings[item.key]!}
                          onChange={next => onToggleSetting(item.key, next)}
                        />
                      ) : (
                        <ActionRow
                          icon={sectionIcons[section.id] ?? WindowIcon}
                          title={item.label}
                          description={item.description}
                          onPress={() => onPressButton(item)}
                        />
                      )}
                    </Fragment>
                  ))}
                </View>
              </View>
            )
          })}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function getItemIcon(item: CrackSettingsSection['items'][number]) {
  if (item.type === 'toggle') {
    if (item.key === 'kawaiiMode') return SparkleIcon
    if (item.key === 'customVerificationsEnabled') return CircleCheckIcon
    if (item.key) return CircleCheckIcon
    return FilterIcon
  }
  if (item.id === 'openVerificationSettings') return CircleCheckIcon
  return WindowIcon
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  name,
  value,
  onChange,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  name: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_lg,
        a.gap_sm,
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
        <Icon size="md" style={[t.atoms.text_contrast_medium]} />
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text style={[a.text_md, a.font_semi_bold]}>{title}</Text>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {description}
          </Text>
        </View>
      </View>
      <Toggle.Item label={title} name={name} value={value} onChange={onChange}>
        <Toggle.Switch />
      </Toggle.Item>
    </View>
  )
}

function ActionRow({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <Button
      label={title}
      variant="ghost"
      color="secondary"
      style={[a.w_full, {backgroundColor: 'transparent'}]}
      onPress={onPress}>
      {state => (
        <View
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.p_lg,
            a.gap_sm,
            (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
          ]}>
          <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
            <Icon size="md" style={[t.atoms.text_contrast_medium]} />
            <View style={[a.flex_1, a.gap_2xs]}>
              <Text style={[a.text_md, a.font_semi_bold]}>{title}</Text>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {description}
              </Text>
            </View>
          </View>
          <ChevronRight
            size="sm"
            style={[t.atoms.text_contrast_low, a.self_end, {paddingBottom: 2}]}
          />
        </View>
      )}
    </Button>
  )
}
