import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { openAuthModal } from '@/stores/authModalStore'
import { DASHBOARD_HOME_PATH } from '@/lib/subscription-routes'

/**
 * Stands in for the old /signup page: signing up happens in the modal now, so old links open the
 * dashboard (free to browse) with the modal on top. While signups are closed the modal opens on
 * log in instead.
 */
export function SignupRedirect() {
  useEffect(() => {
    openAuthModal('signup')
  }, [])
  return <Navigate to={DASHBOARD_HOME_PATH} replace />
}
