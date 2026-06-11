import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
}

export default function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold tracking-[5px] text-floral-white">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
