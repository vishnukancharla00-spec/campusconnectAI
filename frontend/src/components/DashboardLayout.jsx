import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, LayoutDashboard, Users, BarChart3, Shield, BookOpen, Eye } from 'lucide-react';

const ROLE_CONFIG = {
  FACULTY: { label: 'Faculty', icon: BookOpen, color: 'from-blue-500 to-cyan-400' },
  HOD: { label: 'Head of Department', icon: Eye, color: 'from-violet-500 to-purple-400' },
  PRINCIPAL: { label: 'Principal', icon: Shield, color: 'from-rose-500 to-pink-400' },
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.FACULTY;
  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">CampusConnect</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">Analytics Platform</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleConfig.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.username}</p>
                <p className="text-[11px] text-slate-400">
                  {roleConfig.label}{user?.branch ? ` • ${user.branch}` : ' • All Branches'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-600 border-t border-white/[0.04]">
        CampusConnect Analytics © 2026 • Built with FastAPI & React
      </footer>
    </div>
  );
}
