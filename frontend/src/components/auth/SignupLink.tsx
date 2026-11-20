import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { openAuthModal } from '@/stores/authModalStore'

type SignupLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }

/**
 * Opens the sign-up modal in place. (While signups are closed the modal opens on log in and
 * explains why.) `to` stays as the link's href for crawlers and new-tab clicks.
 */
export const SignupLink = forwardRef<HTMLAnchorElement, SignupLinkProps>(
  ({ to = '/signup', onClick, ...props }, ref) => (
    <a
      ref={ref}
      href={to}
      onClick={(event) => {
        onClick?.(event)
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        openAuthModal('signup')
      }}
      {...props}
    />
  )
)
SignupLink.displayName = 'SignupLink'
