import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '@/components/analytics/analytics-page'

export const Route = createFileRoute('/app/analytics')({
  component: AnalyticsPage,
})