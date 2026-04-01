import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute'
import Login from '@/pages/Login/Login'
import Home from '@/pages/Home/Home'
import Players from '@/pages/Players/Players'
import PlayerProfile from '@/pages/PlayerProfile/PlayerProfile'
import GameForm from '@/pages/GameForm/GameForm'
import GameRecords from '@/pages/GameRecords/GameRecords'
import GamesList from '@/pages/GamesList/GamesList'
import GameDetail from '@/pages/GameDetail/GameDetail'
import Records from '@/pages/Records/Records'
import AchievementCatalog from '@/pages/AchievementCatalog/AchievementCatalog'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <Players />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/:playerId/profile"
            element={
              <ProtectedRoute>
                <PlayerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <GamesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/new"
            element={
              <ProtectedRoute>
                <GameForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <ProtectedRoute>
                <GameDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:gameId/records"
            element={
              <ProtectedRoute>
                <GameRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <Records />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <AchievementCatalog />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
