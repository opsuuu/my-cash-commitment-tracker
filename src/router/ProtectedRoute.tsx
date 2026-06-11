import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/common'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth()

  if (loading) {
    return <FullPageLoader />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
