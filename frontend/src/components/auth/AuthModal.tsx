import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Mail, X } from 'lucide-react'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { SIGNUPS_CLOSED_MESSAGE, SIGNUPS_ENABLED } from '@/lib/signups-enabled'
import { useAuthModalStore } from '@/stores/authModalStore'
import { reloadAccountStores } from '@/stores/reset-dashboard-stores'
import { toast } from '@/stores/toastStore'

/**
 * Sign up or log in without leaving the page. Opened by requireAccount when a visitor does
 * something that needs an account, and by the navbar's buttons. Mounted once, in App.
 */
export function AuthModal() {
  const { open, mode, reason, setMode, close, succeed } = useAuthModalStore()
  const { login, signup, isDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const isSignup = mode === 'signup'

  // Fresh form each time it opens or switches between sign up and log in.
  useEffect(() => {
    if (!open) return
    setError('')
    setInfo('')
    setPassword('')
    const focus = window.setTimeout(() => emailRef.current?.focus(), 50)
    return () => window.clearTimeout(focus)
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const result = isSignup ? await signup(email, password) : await login(email, password)
      if (result.type === 'confirm_email') {
        setInfo(result.message)
        return
      }
      await reloadAccountStores()
      toast({ title: isSignup ? 'Welcome to WhaleMo' : 'Logged in', tone: 'success' })
      setEmail('')
      succeed()
    } catch (err) {
      setError(err instanceof Error ? err.message : isSignup ? 'Signup failed' : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const switchTo = (next: 'signup' | 'login') => {
    if (next === 'signup' && !SIGNUPS_ENABLED) {
      toast(SIGNUPS_CLOSED_MESSAGE)
      return
    }
    setMode(next)
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="auth-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-whalemo-bg/70 px-4 py-8 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-md border border-whalemo-line bg-whalemo-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)]"
          >
            <div className="relative bg-gradient-to-br from-whalemo-accent via-[#33606a] to-whalemo-blue px-6 py-5 text-[#ffffff]">
              <BrandLogo className="h-6" />
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute top-3 right-3 rounded-sm p-1.5 text-[#ffffff]/80 transition-colors hover:bg-[#ffffff]/10 hover:text-[#ffffff]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 sm:p-7">
              <h2 id="auth-modal-title" className="text-2xl font-bold">
                {isSignup ? 'Create your free account' : 'Welcome back'}
              </h2>
              <p className="mt-1.5 text-sm text-whalemo-muted">
                {isDemo
                  ? 'Demo mode: use any email and password.'
                  : reason ?? (isSignup ? 'Save wallets, tokens, filters and alerts to your account.' : 'Log in to your WhaleMo account.')}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <Label htmlFor="auth-modal-email">Email</Label>
                  <IconInput
                    ref={emailRef}
                    id="auth-modal-email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor="auth-modal-password" className="mb-0">Password</Label>
                    {!isSignup && !isDemo ? (
                      <Link to="/forgot-password" onClick={close} className="text-xs font-medium text-whalemo-teal hover:underline">
                        Forgot password?
                      </Link>
                    ) : null}
                  </div>
                  <IconInput
                    id="auth-modal-password"
                    icon={Lock}
                    type="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={isSignup ? 6 : undefined}
                    required
                  />
                </div>
                {info ? <p className="text-center text-sm text-whalemo-teal">{info}</p> : null}
                {error ? <p className="text-center text-sm text-whalemo-red">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : isSignup ? 'Sign up free' : 'Log in'}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-whalemo-muted">
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => switchTo(isSignup ? 'login' : 'signup')}
                  className="font-medium text-whalemo-teal hover:underline"
                >
                  {isSignup ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
