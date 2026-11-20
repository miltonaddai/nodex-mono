import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { DASHBOARD_HOME_PATH } from '@/lib/subscription-routes'
import { RouteLoading } from './RouteLoading'

/** Redirects authenticated users away from login. */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <RouteLoading />
  if (isAuthenticated) return <Navigate to={DASHBOARD_HOME_PATH} replace />

  return children
}
