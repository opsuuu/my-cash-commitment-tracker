import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh bg-app-bg p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-floral-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{user?.email}</span>
            <Button
              variant="outline"
              size="lg"
              onClick={signOut}
              className="rounded-xl bg-transparent px-4 text-lavender hover:text-lavender"
            >
              登出
            </Button>
          </div>
        </div>

        <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
          <CardContent className="text-center">
            <p className="text-text-muted">Dashboard 建置中...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
