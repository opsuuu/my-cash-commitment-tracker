import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-floral-white">Dashboard</h1>

      <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
        <CardContent className="text-center">
          <p className="text-text-muted">Dashboard 建置中...</p>
        </CardContent>
      </Card>
    </div>
  )
}
