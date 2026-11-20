import { create } from 'zustand'
import { isActiveSubscription } from '@/lib/plans'
import { SIGNUPS_ENABLED } from '@/lib/signups-enabled'
import { useAuthStore } from '@/stores/authStore'

/**
 * The sign-up / log-in modal. Browsing WhaleMo needs no account; the modal only opens when the
 * visitor does something that needs an account (a watchlist add, a saved filter, an alert, or a
 * paid feature: a scan, Telegram). `requireAccount` opens it and resolves once the visitor is signed in, so the
 * action that asked carries on by itself.
 */
export type AuthModalMode = 'signup' | 'login'

interface AuthModalState {
  open: boolean
  mode: AuthModalMode
  /** Why the modal opened, e.g. "Sign up to save wallets to your watchlist." */
  reason: string | null
  setMode: (mode: AuthModalMode) => void
  /** Dismissed without signing in. The waiting action is dropped. */
  close: () => void
  /** Signed in from the modal. The waiting action carries on. */
  succeed: () => void
}

let pending: ((signedIn: boolean) => void) | null = null

function settle(signedIn: boolean) {
  const resolve = pending
  pending = null
  resolve?.(signedIn)
}

const defaultMode = (): AuthModalMode => (SIGNUPS_ENABLED ? 'signup' : 'login')

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  mode: defaultMode(),
  reason: null,
  setMode: (mode) => set({ mode }),
  close: () => {
    set({ open: false })
    settle(false)
  },
  succeed: () => {
    set({ open: false })
    settle(true)
  },
}))

/** Opens the modal with nothing waiting on it (the navbar's Sign up and Login buttons). */
export function openAuthModal(mode: AuthModalMode = defaultMode(), reason: string | null = null) {
  settle(false)
  useAuthModalStore.setState({ open: true, mode: mode === 'signup' && !SIGNUPS_ENABLED ? 'login' : mode, reason })
}

/**
 * True at once when signed in. Otherwise opens the modal and resolves true once the visitor signs
 * up or logs in there, or false if they close it.
 */
export function requireAccount(reason: string): Promise<boolean> {
  if (useAuthStore.getState().user) return Promise.resolve(true)
  openAuthModal(defaultMode(), reason)
  return new Promise((resolve) => {
    pending = resolve
  })
}

/**
 * For the paid features (token scanner, Telegram alerts). True when signed in with an active plan
 * (or while the paywall is off). Otherwise asks a guest to sign up first, then, still without a
 * plan, calls `toPricing` and resolves false.
 */
export async function requirePlan(reason: string, toPricing: () => void): Promise<boolean> {
  if (!(await requireAccount(reason))) return false
  if (isActiveSubscription(useAuthStore.getState().user)) return true
  toPricing()
  return false
}
