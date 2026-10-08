import { useAuth } from '../context/AuthContext';
import { BarChart3, BookOpen, GraduationCap, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';

const ROLE_CONFIG = {
  FACULTY: { label: 'Faculty', workspace: 'Academic workspace', summary: 'Classes · Attendance · Marks', icon: BookOpen },
  HOD: { label: 'Head of Department', workspace: 'Department analytics', summary: 'Department · Subjects · Risk', icon: BarChart3 },
  PRINCIPAL: { label: 'Principal', workspace: 'Institutional analytics', summary: 'College · Departments · Trends', icon: ShieldCheck },
};

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CC';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.FACULTY;
  const Icon = roleConfig.icon;
  const branch = user?.branch;

  return (
    <div className="cc-app">
      <aside className="cc-sidebar" aria-label="CampusConnect navigation">
        <div className="cc-brand">
          <div className="cc-brand-mark" aria-hidden="true"><GraduationCap size={21} strokeWidth={2.1} /></div>
          <div>
            <p className="cc-brand-name">CampusConnect</p>
            <p className="cc-brand-caption">Analytics platform</p>
          </div>
        </div>

        <div className="cc-workspace">
          <p className="cc-eyebrow">Workspace</p>
          <p className="cc-workspace-title">{roleConfig.workspace}</p>
          <p className="cc-workspace-meta">{branch ? `${branch} department` : 'All departments'}</p>
        </div>

        <nav className="cc-nav" aria-label="Dashboard sections">
          <a href="#dashboard-content" aria-current="page"><LayoutDashboard size={16} /> Overview</a>
          <a href="#student-explorer"><Users size={16} /> Student analytics</a>
        </nav>

        <div className="cc-sidebar-spacer" />
        <div className="cc-profile">
          <div className="cc-avatar" aria-hidden="true">{initials(user?.username)}</div>
          <div className="cc-profile-copy">
            <p className="cc-profile-name">{user?.username || 'Campus user'}</p>
            <p className="cc-profile-role">{roleConfig.label}{branch ? ` · ${branch}` : ''}</p>
          </div>
          <button className="cc-logout" onClick={logout} title="Log out" aria-label="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="cc-content">
        <header className="cc-topbar">
          <p className="cc-topbar-label">{roleConfig.summary}</p>
          <div className="cc-topbar-context"><span className="cc-status-dot" aria-hidden="true" /> Live academic data</div>
        </header>
        <main className="cc-main" id="dashboard-content">
          {children}
        </main>
        <footer className="cc-footer">CampusConnect Analytics · Academic insight for better decisions</footer>
      </div>
    </div>
  );
}

