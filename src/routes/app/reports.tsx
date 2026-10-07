import { createFileRoute } from '@tanstack/react-router'
import { ReportsPage } from '@/components/reports/reports-page'

export const Route = createFileRoute('/app/reports')({
  component: ReportsPage,
})