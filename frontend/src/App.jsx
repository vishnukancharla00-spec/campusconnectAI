import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import DashboardLayout from './components/DashboardLayout'

// lazy-loaded dashboards
const FacultyDashboard = lazy(() => import('./components/FacultyDashboard'))
const HODDashboard = lazy(() => import('./components/HODDashboard'))
const PrincipalDashboard = lazy(() => import('./components/PrincipalDashboard'))

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading CampusConnect...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
        {user.role === 'FACULTY' && <FacultyDashboard />}
        {user.role === 'HOD' && <HODDashboard />}
        {user.role === 'PRINCIPAL' && <PrincipalDashboard />}
      </Suspense>
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
