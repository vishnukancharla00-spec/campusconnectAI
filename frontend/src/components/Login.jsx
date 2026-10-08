import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username.trim(), password);
    } catch (err) {
      const errorMsg = err?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      console.error('❌ Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && username.trim() && password.trim()) {
      handleLogin(e);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const displayError = error || authError;
  const isFormValid = username.trim() && password.trim();

  return (
    <div className="login-page">
      <div className="login-shell">
        {/* Header with Logo */}
        <div className="login-header">
          <div className="login-badge" aria-hidden="true">
            <GraduationCap className="login-badge-icon" strokeWidth={2} />
          </div>
          <h1 className="login-title">CampusConnect</h1>
          <p className="login-subtitle">Analytics Platform • Unified Academic Intelligence</p>
        </div>

        {/* Login Form Card */}
        <div className="login-card">
          <h2 className="login-card-title">Sign In</h2>

          {/* Error Message */}
          {displayError && (
            <div
              className="login-error-message"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="login-error-icon" strokeWidth={2.5} />
              <p>{displayError}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleLogin} noValidate>
            {/* Username Field */}
            <div className="login-field-group">
              <label htmlFor="username" className="login-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="username"
                autoCapitalize="off"
                spellCheck="false"
                required
                aria-required="true"
                aria-describedby={displayError ? 'error-message' : undefined}
              />
            </div>

            {/* Password Field */}
            <div className="login-field-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-describedby={displayError ? 'error-message' : undefined}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={2} />
                  ) : (
                    <Eye size={18} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || !isFormValid}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="login-spinner" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Development Info */}
          {import.meta.env.DEV && (
            <div
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#64748b',
                fontFamily: 'monospace',
              }}
            >
              <p style={{ margin: '0 0 4px' }}>API: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
