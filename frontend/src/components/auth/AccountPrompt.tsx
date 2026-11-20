import type { LucideIcon } from 'lucide-react'
import { openAuthModal } from '@/stores/authModalStore'

/** Shown to guests where a page's content belongs to an account (watchlist, alerts). */
export function AccountPrompt({
  icon: Icon,
  title,
  description,
  reason,
}: {
  icon: LucideIcon
  title: string
  description: string
  /** The modal's subtitle once it opens. */
  reason: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-whalemo-line px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-whalemo-teal" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-whalemo-muted">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => openAuthModal('signup', reason)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-whalemo-accent px-5 text-sm font-semibold text-whalemo-on-accent transition-all hover:brightness-110"
        >
          Sign up free
        </button>
        <button
          type="button"
          onClick={() => openAuthModal('login', reason)}
          className="inline-flex h-10 items-center justify-center rounded-md border border-whalemo-line px-5 text-sm font-semibold transition-colors hover:border-whalemo-teal/50"
        >
          Log in
        </button>
      </div>
    </div>
  )
}
