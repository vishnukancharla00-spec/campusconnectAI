import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, Sparkles, Shield, Eye, BookOpen, AlertCircle } from 'lucide-react';

const PRESETS = [
  { username: 'faculty_cse', password: 'password123', label: 'Faculty (CSE)', icon: BookOpen, color: 'from-blue-500 to-cyan-400' },
  { username: 'hod_cse', password: 'password123', label: 'HOD (CSE)', icon: Eye, color: 'from-violet-500 to-purple-400' },
  { username: 'faculty_ece', password: 'password123', label: 'Faculty (ECE)', icon: BookOpen, color: 'from-emerald-500 to-teal-400' },
  { username: 'hod_ece', password: 'password123', label: 'HOD (ECE)', icon: Eye, color: 'from-amber-500 to-orange-400' },
  { username: 'principal', password: 'password123', label: 'Principal', icon: Shield, color: 'from-rose-500 to-pink-400' },
];

export default function Login() {
  const { login, error: authError } = useAuth();
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
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 mb-4 shadow-xl shadow-brand-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CampusConnect</h1>
          <p className="text-slate-400 text-sm">Analytics Platform • Unified Academic Intelligence</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 mb-6 bg-slate-900/50 border border-slate-700/50 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Sign In</h2>
          </div>

          {displayError && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                disabled={isLoading}
              />
            </div>
            <button
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleLogin()}
              disabled={isLoading || !username || !password}
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
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl backdrop-blur-xl p-6">
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
                  className="group relative flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleLogin(preset.username, preset.password)}
                  disabled={isLoading}
                  title={`Login as ${preset.label}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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

        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-slate-400">
            <p className="font-mono">API Base: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
