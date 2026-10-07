import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { useAuth } from '@/lib/supabase/auth'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function isDemo(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('flux_demo') === '1'
}

function AppLayout() {
  const auth = useAuth()
  const [demo, setDemo] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDemo(isDemo())
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#08090d] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-300" />
      </div>
    )
  }
  if (auth.status.kind === 'signed_in') return <Outlet />
  if (demo) return <Outlet />
  return <LandingPage />
}