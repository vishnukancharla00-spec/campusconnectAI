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

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && username.trim() && password.trim()) {
      handleLogin();
    }
  };

  const displayError = error || authError;
  const isFormValid = username.trim() && password.trim();

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-header">
          <div className="login-badge">
            <GraduationCap className="login-badge-icon" />
          </div>
          <h1 className="login-title">CampusConnect</h1>
          <p className="login-subtitle">Analytics Platform • Unified Academic Intelligence</p>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">Sign In</h2>

          {displayError && (
            <div className="login-error-message">
              <AlertCircle className="login-error-icon" />
              <p>{displayError}</p>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (isFormValid) handleLogin();
            }}
          >
            <div className="login-field-group">
              <label htmlFor="username" className="login-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="login-field-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
