import type { UserProfile } from '@/lib/api'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'

/**
 * One flat plan, WhaleMo Pro, for the token scanner and Telegram alerts. The dashboards are free
 * to browse, and watchlists, filters and in-browser alerts are free with an account. It uses the 'starter' id
 * (and STRIPE_PRICE_STARTER) so existing subscription rows, checkout and the Stripe webhook keep
 * working. 'pro' survives only on older subscriptions.
 */
export const PLANS = [
  {
    id: 'starter' as const,
    name: 'WhaleMo Pro',
    shortName: 'Pro',
    price: 25,
    description: 'The token scanner and your alerts on Telegram.',
    features: [
      'Token scanner: rug checks and a buy-or-avoid verdict on any contract',
      'Launch bundle and insider analysis',
      'Early signals and your own alerts sent to Telegram',
      'Solana, Robinhood Chain and BNB Chain',
      'Cancel anytime',
    ],
    cta: 'Subscribe',
    variant: 'default' as const,
    popular: false,
  },
] as const

export type PlanId = (typeof PLANS)[number]['id']

export function parsePlanId(value: string | null): PlanId | null {
  // Old links may still carry ?plan=pro; both now mean the single plan.
  return value === 'starter' || value === 'pro' ? 'starter' : null
}

export function isActiveSubscription(profile: UserProfile | null) {
  if (!profile) return false
  // Entitlement to the paid features (token scanner, Telegram alerts). With the paywall switched off everyone
  // signed in is entitled. Authentication is unaffected: a null profile still means "not entitled".
  if (!SUBSCRIPTIONS_ENABLED) return true
  const { status } = profile.subscription
  return status === 'active' || status === 'trialing'
}

/** True when the user must purchase a plan before accessing the app. */
export function requiresPlanSelection(profile: UserProfile | null) {
  return Boolean(profile) && !isActiveSubscription(profile)
}

export function planButtonLabel(
  planId: PlanId,
  profile: UserProfile | null,
  isActive: boolean
): string {
  if (profile && profile.subscription.plan === planId && isActive) {
    return 'Current plan'
  }

  // Older subscriptions on the retired Pro plan can move to the flat plan.
  if (profile && isActive) return `Switch to $${PLANS[0].price}/month`

  const plan = PLANS.find((entry) => entry.id === planId)
  return plan?.cta ?? 'Subscribe'
}

export function formatRenewalDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
}
