import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/common'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { session, loading } = useAuth()

  if (loading) {
    return <FullPageLoader />
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
