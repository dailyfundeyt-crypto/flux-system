import { createFileRoute } from '@tanstack/react-router'
import { MultiposterPage } from '@/components/multiposter/multiposter-page'

export const Route = createFileRoute('/app/multiposter')({
  component: MultiposterPage,
})