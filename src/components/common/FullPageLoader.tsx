import { Spinner } from '@/components/ui/spinner'

export default function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-app-bg">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}
