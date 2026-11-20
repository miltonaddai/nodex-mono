import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'

/**
 * Only for a failed payment: the dashboards are free, and the paid features (scanner, Telegram
 * alerts) stop until the card is fixed. Users who never subscribed see nothing.
 */
export function SubscriptionBanner() {
  const { user } = useAuth()

  if (!SUBSCRIPTIONS_ENABLED || user?.subscription.status !== 'past_due') {
    return null
  }

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-md border border-whalemo-teal/20 bg-whalemo-teal/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm text-white/70">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-whalemo-teal" />
        <p>Your last payment failed, so the scanner and Telegram alerts are paused. Update your payment method to restore them.</p>
      </div>
      <Button asChild size="sm" className="shrink-0 normal-case tracking-normal">
        <Link to="/settings?tab=subscription">Update payment</Link>
      </Button>
    </div>
  )
}
