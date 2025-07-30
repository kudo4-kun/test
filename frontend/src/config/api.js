const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  STATUS: `${API_BASE_URL}/api/auth/status`,

  // Contacts endpoints
  CONTACTS: `${API_BASE_URL}/api/contacts`,
  SEARCH_USERS: `${API_BASE_URL}/api/contacts/search`,

  // Calls endpoints
  CALLS: `${API_BASE_URL}/api/calls`,
  CALL_HISTORY: `${API_BASE_URL}/api/calls/history`,
  ACTIVE_CALLS: `${API_BASE_URL}/api/calls/active`,
  CALL_STATS: `${API_BASE_URL}/api/calls/stats`,
};

export { SOCKET_URL };
export default API_BASE_URL;