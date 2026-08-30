// API Configuration
// Update this to match your backend URL

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    ME: `${API_BASE_URL}/api/auth/me`,
    FACULTY_ANALYTICS: `${API_BASE_URL}/api/analytics/faculty`,
    HOD_ANALYTICS: `${API_BASE_URL}/api/analytics/hod`,
    PRINCIPAL_ANALYTICS: `${API_BASE_URL}/api/analytics/principal`,
    FILTER: `${API_BASE_URL}/api/analytics/filter`,
    RISK_DISTRIBUTION: `${API_BASE_URL}/api/analytics/risk-distribution`,
    SUBJECT_ANALYTICS: `${API_BASE_URL}/api/analytics/subject`,
    FEE_PENDING: `${API_BASE_URL}/api/analytics/fee-pending`,
    EXPLORE: `${API_BASE_URL}/api/analytics/explore`,
  }
};

console.log('🔧 API Configuration:', {
  BASE_URL: API_BASE_URL,
  ENVIRONMENT: import.meta.env.MODE
});
