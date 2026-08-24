import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, Sparkles, Shield, Eye, BookOpen } from 'lucide-react';

const PRESETS = [
  { username: 'faculty_cse', password: 'password123', label: 'Faculty (CSE)', icon: BookOpen, color: 'from-blue-500 to-cyan-400' },
  { username: 'hod_cse', password: 'password123', label: 'HOD (CSE)', icon: Eye, color: 'from-violet-500 to-purple-400' },
  { username: 'faculty_ece', password: 'password123', label: 'Faculty (ECE)', icon: BookOpen, color: 'from-emerald-500 to-teal-400' },
  { username: 'hod_ece', password: 'password123', label: 'HOD (ECE)', icon: Eye, color: 'from-amber-500 to-orange-400' },
  { username: 'principal', password: 'password123', label: 'Principal', icon: Shield, color: 'from-rose-500 to-pink-400' },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (u, p) => {
    setIsLoading(true);
    setError('');
    try {
      await login(u || username, p || password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 mb-4 shadow-xl shadow-brand-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">CampusConnect</h1>
          <p className="text-slate-400 text-sm">Analytics Platform • Unified Academic Intelligence</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => handleLogin()}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Login Presets */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-medium text-slate-300">Quick Login Presets</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.username}
                  className="group relative flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.06] 
                             bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] 
                             transition-all duration-300 text-left"
                  onClick={() => handleLogin(preset.username, preset.password)}
                  disabled={isLoading}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center 
                                   shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
