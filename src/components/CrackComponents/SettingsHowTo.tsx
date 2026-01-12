import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export {useDialogControl} from '#/components/Dialog'

export function SettingsHowToDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  return (
    <Dialog.ScrollableInner
      label="Welcome!"
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {minHeight: 100},
        ]}>
        <Image
          accessibilityIgnoresInvertColors
          source={require('../../../assets/images/bigshot_settins_nux.gif')}
          style={[
            {
              aspectRatio: 450 / 544,
            },
          ]}
          alt={_(
            msg`An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts.`,
          )}
        />
      </View>

      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text
            style={[a.text_2xl, a.font_semi_bold, a.pr_4xl, a.leading_tight]}>
            Welcome!
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              Here's how to access settings so you can finally be a [[BIG
              SHOT]]! Have fun!
            </Trans>
          </Text>
        </View>

        <View style={[a.gap_sm]} />

        <View
          style={[
            a.w_full,
            a.gap_sm,
            a.justify_end,
            gtMobile ? [a.flex_row, a.justify_end] : [a.flex_col],
          ]}>
          <Button
            label={_(msg`Close dialog`)}
            size="small"
            variant="solid"
            color="secondary"
            onPress={() => {
              control.close()
            }}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
