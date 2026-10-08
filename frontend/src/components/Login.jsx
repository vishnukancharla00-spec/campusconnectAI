import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      const errorMsg = err?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen bg-[#020d1b] px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-[#071b2d] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5c76a] via-[#f59e0b] to-[#f97316] shadow-[0_8px_18px_rgba(245,158,11,0.35)]">
            <GraduationCap className="h-8 w-8 text-[#0a1525]" />
          </div>
        </div>

        <h1 className="mt-5 text-center text-4xl font-bold tracking-tight text-white">CampusConnect</h1>
        <p className="mt-2 text-center text-sm text-slate-300">Analytics Platform • Unified Academic Intelligence</p>

        <div className="mt-8">
          <h2 className="mb-5 text-3xl font-semibold text-white">Sign In</h2>

          {displayError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <span>{displayError}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-200">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                placeholder="Enter username"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-600 bg-[#0f2b3d] px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none transition duration-200 focus:border-[#5aa9ff] focus:ring-2 focus:ring-[#5aa9ff]/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                  placeholder="********"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-600 bg-[#0f2b3d] px-4 py-3 pr-12 text-base text-white placeholder:text-slate-400 outline-none transition duration-200 focus:border-[#5aa9ff] focus:ring-2 focus:ring-[#5aa9ff]/30"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-300 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading || !username || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c8df5] to-[#7b7ae8] px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_22px_rgba(123,122,232,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
