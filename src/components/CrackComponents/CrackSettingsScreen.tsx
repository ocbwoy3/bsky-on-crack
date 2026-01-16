import {Fragment} from 'react'
import {type ComponentType} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {GATES} from '#/lib/statsig/gates'
import {useGate} from '#/lib/statsig/statsig'
import {
  useSetStatsigGateOverride,
  useStatsigGateOverrides,
} from '#/state/crack/statsig-overrides'
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
import {AlterEgoDialog} from '#/components/crack/AlterEgoDialog'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '../icons/Shield'

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
  const alterEgoDialogControl = useDialogControl()
  const gate = useGate()

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
      case 'openAlterEgo':
        alterEgoDialogControl.open()
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
                          //@ts-expect-error
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
          <StatsigSection gate={gate} />
        </View>
      </Layout.Content>
      <AlterEgoDialog control={alterEgoDialogControl} />
    </Layout.Screen>
  )
}

function StatsigSection({gate}: {gate: ReturnType<typeof useGate>}) {
  const t = useTheme()
  const {_} = useLingui()
  const overrides = useStatsigGateOverrides()
  const setOverride = useSetStatsigGateOverride()
  const values = GATES.map(gateName => ({
    gateName,
    enabled: gate(gateName, {dangerouslyDisableExposureLogging: true}),
    override: overrides[gateName],
  }))

  return (
    <View style={[a.pt_2xl]}>
      <Text
        style={[
          a.text_md,
          a.font_semi_bold,
          a.pb_md,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>Statsig</Trans>
      </Text>
      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        {values.map(({gateName, enabled}, index) => (
          <Fragment key={gateName}>
            {index > 0 && <Divider />}
            <ToggleRow
              icon={FilterIcon}
              title={gateName}
              description={
                typeof override === 'boolean'
                  ? override
                    ? _(msg`Overridden: Enabled`)
                    : _(msg`Overridden: Disabled`)
                  : enabled
                    ? _(msg`Enabled`)
                    : _(msg`Disabled`)
              }
              name={gateName}
              value={typeof override === 'boolean' ? override : enabled}
              onChange={next => setOverride(gateName, next)}
            />
          </Fragment>
        ))}
        <Divider />
        <ActionRow
          icon={FilterIcon}
          title={_(msg`Clear gate overrides`)}
          description={_(msg`Revert to remote gate values.`)}
          onPress={() => {
            for (const gateName of GATES) {
              if (gateName in overrides) {
                setOverride(gateName, null)
              }
            }
          }}
        />
      </View>
    </View>
  )
}

function getItemIcon(item: CrackSettingsSection['items'][number]) {
  if (item.type === 'toggle') {
    if (item.key === 'kawaiiMode') return SparkleIcon
    if (item.key === 'customVerificationsEnabled') return CircleCheckIcon
    if (item.key === 'hijackHideLabels') return CircleXIcon
    if (item.key === 'uncapLabelerLimit') return ShieldIcon

    return FilterIcon
  }
  if (item.id === 'openVerificationSettings') return CircleCheckIcon
  if (item.id === 'openAlterEgo') return SparkleIcon
  return WindowIcon
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  name,
  value,
  onChange,
  disabled = false,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  name: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
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
      <Toggle.Item
        label={title}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}>
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
