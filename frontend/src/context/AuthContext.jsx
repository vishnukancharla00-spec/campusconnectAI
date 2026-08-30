import { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(API_CONFIG.ENDPOINTS.ME, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setError(null);
      } else {
        throw new Error(`Token validation failed: ${res.status}`);
      }
    } catch (err) {
      console.error('❌ Token validation error:', err);
      localStorage.removeItem('cc_token');
      setToken(null);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      console.log('🔐 Attempting login with:', username);
      console.log('📡 API Endpoint:', API_CONFIG.ENDPOINTS.LOGIN);

      const res = await fetch(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed' }));
        const errorMessage = err.detail || `Login failed: ${res.status} ${res.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await res.json();
      localStorage.setItem('cc_token', data.access_token);
      setToken(data.access_token);
      setUser({ username: data.username, role: data.role, branch: data.branch });
      setError(null);
      console.log('✅ Login successful for:', data.username);
      return data;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired');
      }
      return res;
    } catch (err) {
      console.error('❌ API Fetch error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, authFetch, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
