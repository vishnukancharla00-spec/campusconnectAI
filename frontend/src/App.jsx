import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import FacultyDashboard from './components/FacultyDashboard';
import HODDashboard from './components/HODDashboard';
import PrincipalDashboard from './components/PrincipalDashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading CampusConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <DashboardLayout>
      {user.role === 'FACULTY' && <FacultyDashboard />}
      {user.role === 'HOD' && <HODDashboard />}
      {user.role === 'PRINCIPAL' && <PrincipalDashboard />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
