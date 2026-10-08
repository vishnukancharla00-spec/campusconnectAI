import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
    if (e.key === 'Enter' && !isLoading && username && password) {
      handleLogin();
    }
  };

  const displayError = error || authError;
  const isFormValid = username.trim() && password.trim();

  return (
    <div className="login-container">
      {/* Subtle background gradient */}
      <div className="login-bg-gradient" />

      <div className="login-wrapper">
        {/* Header Section */}
        <div className="login-header">
          <div className="login-logo">
            <GraduationCap className="login-logo-icon" />
          </div>
          <h1 className="login-title">CampusConnect</h1>
          <p className="login-subtitle">Analytics Platform • Unified Academic Intelligence</p>
        </div>

        {/* Form Section */}
        <div className="login-form-section">
          <div className="login-form-header">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-description">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="login-error-message">
              <AlertCircle className="login-error-icon" />
              <p>{displayError}</p>
            </div>
          )}

          {/* Form Fields */}
          <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="login-form-group">
              <label htmlFor="username" className="login-label">
                Username or Email
              </label>
              <div className={`login-input-wrapper ${focusedField === 'username' ? 'focused' : ''}`}>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  autoComplete="username"
                  className="login-input"
                  aria-label="Username or Email"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className={`login-input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="login-input"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="login-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={isLoading ? -1 : 0}
                >
                  {showPassword ? (
                    <EyeOff className="login-password-icon" />
                  ) : (
                    <Eye className="login-password-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleLogin}
              disabled={isLoading || !isFormValid}
              className="login-submit-btn"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="login-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="login-submit-icon" />
                </>
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="login-footer-text">
            Demo credentials are available in the quick login section below
          </p>
        </div>
      </div>
    </div>
  );
}
