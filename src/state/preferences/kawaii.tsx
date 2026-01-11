import type React from 'react'

import {useCrackSettings} from '#/state/preferences/crack-settings'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return <>{children}</>
}

export function useKawaiiMode() {
  return useCrackSettings().kawaiiMode
}
