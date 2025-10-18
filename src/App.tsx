import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProviderDetailPage from './pages/ProviderDetailPage'
import DashboardPage from './pages/DashboardPage'
import ProviderFormPage from './pages/ProviderFormPage'
import MasterDataPage from './pages/MasterDataPage'
import GuideProfilePage from './pages/GuideProfilePage'
import GuidesListPage from './pages/GuidesListPage'
import GuideDetailPage from './pages/GuideDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:id" element={<ProviderDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/guides" element={<GuidesListPage />} />
          <Route path="/guides/:id" element={<GuideDetailPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/my-guide-profile"
            element={
              <ProtectedRoute>
                <GuideProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/new"
            element={
              <ProtectedRoute>
                <ProviderFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/edit/:id"
            element={
              <ProtectedRoute>
                <ProviderFormPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/admin/master-data"
            element={
              <ProtectedRoute requireAdmin>
                <MasterDataPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
