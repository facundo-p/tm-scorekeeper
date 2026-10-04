import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Frame } from '@/ui/frame'
import { ErrorState, LoadingState } from '@/ui/states'
import { ErrorBoundary } from './ErrorBoundary'
import { Dock, Rail } from './Nav'
import { sectionOf } from './paths'
import { Sky } from './Sky'
import { TopBar } from './TopBar'

/** `?demo=loading|error` muestra el estado en cualquier pantalla; solo en `--mode parity` (comparación). */
function useDemo(): 'loading' | 'error' | null {
  const [params] = useSearchParams()
  if (import.meta.env.MODE !== 'parity') return null
  const demo = params.get('demo')
  return demo === 'loading' || demo === 'error' ? demo : null
}

/** Al cambiar de pantalla, el scroller vuelve arriba. */
function useScrollTop(pathname: string) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    document.querySelector('[data-scroll-root]')?.scrollTo({ top: 0 })
  }, [pathname])
}

function ScreenContent() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const demo = useDemo()
  if (demo === 'loading') return <LoadingState />
  if (demo === 'error') return <ErrorState onRetry={() => navigate(pathname)} />
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<LoadingState />}><Outlet /></Suspense>
    </ErrorBoundary>
  )
}

/** Shell de la app (SHELL-01): cielo, rail, barra superior, pantalla y dock. */
export function AppShell() {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const section = sectionOf(pathname)
  useScrollTop(pathname)
  return (
    <Frame screen={section ?? 'notFound'} sky={<Sky />}
      rail={<Rail section={section} onExit={logout} />} topbar={<TopBar onExit={logout} />} dock={<Dock section={section} />}>
      <ScreenContent />
    </Frame>
  )
}
