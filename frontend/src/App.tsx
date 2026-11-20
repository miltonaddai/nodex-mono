import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppRoutes } from '@/routes/AppRoutes'
import { Toaster } from '@/components/ui/toaster'
import { AlertWatcher } from '@/components/dashboard/AlertWatcher'
import { AuthModal } from '@/components/auth/AuthModal'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
          <AlertWatcher />
          <AuthModal />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
