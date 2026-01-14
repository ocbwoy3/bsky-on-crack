import React from 'react'
import {type ModerationUI} from '@atproto/api'

import {
  type ModerationCauseDescription,
  useModerationCauseDescription,
} from '#/lib/moderation/useModerationCauseDescription'
import {useCrackSettings} from '#/state/preferences'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'

type Context = {
  isContentVisible: boolean
  setIsContentVisible: (show: boolean) => void
  info: ModerationCauseDescription
  showInfoDialog: () => void
  meta: {
    isNoPwi: boolean
    allowOverride: boolean
  }
}

const Context = React.createContext<Context>({} as Context)
Context.displayName = 'HiderContext'

export const useHider = () => React.useContext(Context)

export function Outer({
  modui,
  isContentVisibleInitialState,
  allowOverride,
  children,
}: React.PropsWithChildren<{
  isContentVisibleInitialState?: boolean
  allowOverride?: boolean
  modui: ModerationUI | undefined
}>) {
  const control = useModerationDetailsDialogControl()
  const blur = modui?.blurs[0]
  const info = useModerationCauseDescription(blur)
  const {hijackHideLabels} = useCrackSettings()
  const isHijackHide =
    hijackHideLabels &&
    blur?.type === 'label' &&
    blur.label.val === '!hide' &&
    blur.label.neg !== true
  const [isContentVisible, setIsContentVisible] = React.useState(
    isContentVisibleInitialState || !blur || isHijackHide,
  )

  const meta = {
    isNoPwi: Boolean(
      modui?.blurs.find(
        cause =>
          cause.type === 'label' &&
          cause.labelDef.identifier === '!no-unauthenticated',
      ),
    ),
    allowOverride: (allowOverride ?? !modui?.noOverride) || isHijackHide,
  }

  const showInfoDialog = () => {
    control.open()
  }

  const onSetContentVisible = (show: boolean) => {
    if (!meta.allowOverride) return
    setIsContentVisible(show)
  }

  React.useEffect(() => {
    if (isHijackHide) {
      setIsContentVisible(true)
    }
  }, [isHijackHide])

  const ctx = {
    isContentVisible,
    setIsContentVisible: onSetContentVisible,
    showInfoDialog,
    info,
    meta,
  }

  return (
    <Context.Provider value={ctx}>
      {children}
      <ModerationDetailsDialog control={control} modcause={blur} />
    </Context.Provider>
  )
}

export function Content({children}: {children: React.ReactNode}) {
  const ctx = useHider()
  return ctx.isContentVisible ? children : null
}

export function Mask({children}: {children: React.ReactNode}) {
  const ctx = useHider()
  return ctx.isContentVisible ? null : children
}
