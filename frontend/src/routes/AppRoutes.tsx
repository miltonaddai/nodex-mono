import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SignupRedirect } from '@/components/auth/SignupRedirect'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'
import { PricingPage } from '@/pages/PricingPage'
import { PricingSuccessPage } from '@/pages/PricingSuccessPage'
// Billing now lives in the settings page's Subscription section; /billing redirects there.
// import { BillingPage } from '@/pages/BillingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { WalletAnalysisPage } from '@/pages/WalletAnalysisPage'
// TOKENS PAGE DISABLED — page kept in the tree, just not routed. Old links go to the wallets page.
// import { TokensPage } from '@/pages/TokensPage'
import { InsidersPage } from '@/pages/InsidersPage'
import { ScannerPage } from '@/pages/ScannerPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { SELECT_PLAN_PATH } from '@/lib/subscription-routes'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public — no auth. The dashboards further down are public too. */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      {/* Not a guest route: the reset email's link works whether or not this browser is logged in. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Signing up happens in the auth modal, opened when a visitor does something that needs an
          account. Old /signup links open the dashboard with the modal on top. */}
      <Route path="/signup" element={<SignupRedirect />} />

      {/* Checkout for WhaleMo Pro (scanner, Telegram alerts). Only routed while the paywall is on. */}
      {SUBSCRIPTIONS_ENABLED ? (
        <>
          <Route
            path={SELECT_PLAN_PATH}
            element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing/success"
            element={
              <ProtectedRoute>
                <PricingSuccessPage />
              </ProtectedRoute>
            }
          />
        </>
      ) : null}

      {/* Account settings, including the subscription. Needs a login but not a plan, so people
          without one can still subscribe or fix a failed payment from here. */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      {/* Billing moved into settings. Old links and Stripe's portal return here. */}
      <Route path="/billing" element={<Navigate to="/settings?tab=subscription" replace />} />

      {/* Free to browse without an account. Saving anything (watchlist, filters, alerts) opens the
          auth modal; scanning and Telegram also need WhaleMo Pro. */}
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/wallets/:address" element={<WalletAnalysisPage />} />
      {/* TOKENS PAGE DISABLED — un-comment together with the import above to restore it.
      <Route path="/tokens" element={<TokensPage />} />
      */}
      <Route path="/tokens" element={<Navigate to="/wallets" replace />} />
      <Route path="/scanner" element={<ScannerPage />} />
      <Route path="/insiders" element={<InsidersPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
