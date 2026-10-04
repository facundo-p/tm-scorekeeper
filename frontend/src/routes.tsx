// Rutas de la app (F26, SHELL-02, D-02): en castellano, como el mockup; las viejas redirigen.
// Las pantallas que todavía no se portaron muestran la página anterior dentro del shell (D-69).
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { PlanetProvider } from '@/fx/planet'
import { ErrorBoundary } from '@/shell/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute'
import { AppShell } from '@/shell/AppShell'
import { Legacy } from '@/shell/Legacy'
import { PATHS } from '@/shell/paths'

const Login = lazy(() => import('@/screens/Login/Login'))
const NotFound = lazy(() => import('@/screens/NotFound/NotFound'))
const Home = lazy(() => import('@/screens/Home/Home'))
const Games = lazy(() => import('@/screens/Games/Games'))
const GameReport = lazy(() => import('@/screens/GameReport/GameReport'))
const Register = lazy(() => import('@/screens/Register/Register'))
const Ceremony = lazy(() => import('@/screens/Ceremony/Ceremony'))
const Ranking = lazy(() => import('@/screens/Ranking/Ranking'))
const Profile = lazy(() => import('@/screens/Profile/Profile'))
const OldRecords = lazy(() => import('@/pages/Records/Records'))
const OldAchievements = lazy(() => import('@/pages/AchievementCatalog/AchievementCatalog'))

// La galería de comparación solo existe en `vite --mode parity` (D-45); en producción
// la condición es falsa en tiempo de build y el módulo no se empaqueta.
const Gallery = import.meta.env.MODE === 'parity' ? lazy(() => import('@/pages/Gallery/Gallery')) : null

const legacy = (Page: LazyExoticComponent<ComponentType>) => <Legacy><Page /></Legacy>

/** Redirige una ruta vieja (`/games/:gameId` → `/partidas/:gameId`) conservando `?…` y `#…`. */
function RedirectWith({ to }: { to: string | ((params: Record<string, string>) => string) }) {
  const params = useParams() as Record<string, string>
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: typeof to === 'string' ? to : to(params), search, hash }} replace />
}

const OLD_ROUTES: [string, string][] = [
  ['/login', PATHS.login], ['/home', PATHS.home], ['/games', PATHS.games], ['/games/new', PATHS.register],
  ['/players', '/jugadores'], ['/achievements', PATHS.achievements],
]

export function AppRoutes() {
  return (
    <Routes>
      <Route path={PATHS.login} element={<Login />} />
      {Gallery && <Route path="/__galeria" element={<Gallery />} />}
      {OLD_ROUTES.map(([from, to]) => <Route key={from} path={from} element={<RedirectWith to={to} />} />)}
      <Route path="/games/:gameId" element={<RedirectWith to={(p) => PATHS.game(p.gameId)} />} />
      <Route path="/games/:gameId/records" element={<RedirectWith to={(p) => PATHS.game(p.gameId)} />} />
      <Route path="/players/:playerId/profile" element={<RedirectWith to={(p) => PATHS.profile(p.playerId)} />} />
      <Route path="/partidas/:gameId/ceremonia" element={<ProtectedRoute><Ceremony /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="partidas" element={<Games />} />
        <Route path="partidas/:gameId" element={<GameReport />} />
        <Route path="partidas/:gameId/records" element={<RedirectWith to={(p) => PATHS.game(p.gameId)} />} />
        <Route path="partidas/:gameId/editar" element={<Register />} />
        <Route path="registrar" element={<Register />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="jugadores" element={<RedirectWith to={PATHS.ranking} />} />
        <Route path="jugadores/:playerId" element={<Profile />} />
        <Route path="records" element={legacy(OldRecords)} />
        <Route path="logros" element={legacy(OldAchievements)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

/** El boundary de afuera cubre lo que queda fuera del shell (acceso, galería, redirecciones). */
export function AppRouter() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
      <PlanetProvider>
        <Suspense fallback={null}><AppRoutes /></Suspense>
      </PlanetProvider>
    </ErrorBoundary>
  )
}
