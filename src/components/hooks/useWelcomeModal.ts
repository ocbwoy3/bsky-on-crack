import {useCallback, useEffect, useState} from 'react'

import {isWeb} from '#/platform/detection'
import {listenOpenWelcomeModal} from '#/state/events'
import {useCrackSettings} from '#/state/preferences'
import {useSession} from '#/state/session'

export function useWelcomeModal() {
  const {hasSession} = useSession()
  const {showWelcomeModal} = useCrackSettings()
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    // Mark that user has actively closed the modal, don't show again this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('welcomeModalClosed', 'true')
    }
  }, [])

  useEffect(() => {
    // Only show modal if:
    // 1. User is not logged in
    // 2. We're on the web (this is a web-only feature)
    // 3. We're on the homepage (path is '/' or '/home')
    // 4. User hasn't actively closed the modal in this session
    if (
      showWelcomeModal &&
      isWeb &&
      !hasSession &&
      typeof window !== 'undefined'
    ) {
      const currentPath = window.location.pathname
      const isHomePage = currentPath === '/'
      const hasUserClosedModal =
        sessionStorage.getItem('welcomeModalClosed') === 'true'

      if (isHomePage && !hasUserClosedModal) {
        // Small delay to ensure the page has loaded
        const timer = setTimeout(() => {
          open()
        }, 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [hasSession, showWelcomeModal, open])

  useEffect(() => {
    if (!isWeb) return
    return listenOpenWelcomeModal(() => open())
  }, [open])

  return {isOpen, open, close}
}
