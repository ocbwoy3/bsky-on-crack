import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {fetchAlterEgoProfile, useAlterEgoOverlay} from '#/state/crack/alter-ego'
import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'

export function AlterEgoDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  const {data: overlay, isFetching} = useAlterEgoOverlay()
  const [draftUri, setDraftUri] = useState(settings.alterEgoUri ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftUri(settings.alterEgoUri ?? '')
  }, [settings.alterEgoUri])

  const applyAlterEgo = async () => {
    const nextUri = draftUri.trim()
    if (!nextUri) {
      setError('Enter an at:// URI for an alter ego record.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await fetchAlterEgoProfile({agent, uri: nextUri})
      update({alterEgoUri: nextUri})
      Toast.show(_(msg`Alter ego applied.`))
      control.close()
    } catch (err: any) {
      logger.error('Failed to apply alter ego', {err})
      setError(err?.message || 'Failed to apply alter ego.')
    } finally {
      setIsSaving(false)
    }
  }

  const clearAlterEgo = () => {
    update({alterEgoUri: undefined})
    setDraftUri('')
    setError(null)
    Toast.show(_(msg`Alter ego cleared.`))
  }

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label="" style={web({maxWidth: 520})}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Alter ego</Trans>
          </Text>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>
              Paste an at:// URI for a dev.ocbwoy3.crack.alterego record. The
              record will override your profile display data for this device.
            </Trans>
          </Text>

          <View style={[a.gap_sm]}>
            <TextField.LabelText>
              <Trans>Alter ego record URI</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={Boolean(error)}>
              <Dialog.Input
                value={draftUri}
                onChangeText={value => {
                  setDraftUri(value)
                  setError(null)
                }}
                autoCapitalize="none"
                autoCorrect={false}
                label="at://did:plc:example/dev.ocbwoy3.crack.alterego/..."
              />
            </TextField.Root>
            {error && (
              <Text style={[a.text_sm, {color: t.palette.negative_400}]}>
                {error}
              </Text>
            )}
          </View>

          {settings.alterEgoUri && (
            <View style={[a.gap_xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Active alter ego</Trans>
              </Text>
              <Text style={[a.text_md, a.font_semi_bold]}>
                {overlay?.displayName ||
                  overlay?.handle ||
                  settings.alterEgoUri}
              </Text>
            </View>
          )}

          <View style={[a.flex_row, a.justify_between, a.gap_sm]}>
            <Button
              variant="solid"
              color="secondary"
              size="small"
              label={_(msg`Clear`)}
              disabled={!settings.alterEgoUri || isSaving}
              onPress={clearAlterEgo}>
              <ButtonText>{_(msg`Clear`)}</ButtonText>
            </Button>
            <Button
              variant="solid"
              color="primary"
              size="small"
              label={_(msg`Apply`)}
              disabled={isSaving || isFetching}
              onPress={applyAlterEgo}>
              <ButtonText>
                {isSaving ? _(msg`Applying...`) : _(msg`Apply`)}
              </ButtonText>
            </Button>
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
