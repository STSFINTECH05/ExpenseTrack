/**
 * Centralized API & Authentication Scoping Utility for STS FINTECH PRIVATE LIMITED
 * Ensures all API calls strictly inject the authenticated user's JWT token
 * in the 'Authorization: Bearer <token>' header along with user identification.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Retrieve the current authenticated user's JWT token from localStorage
 */
export function getAuthToken() {
  try {
    const token = localStorage.getItem('sts_token');
    if (token) return token;

    const userStr = localStorage.getItem('sts_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.token) return user.token;
    }
  } catch (e) {
    console.warn('Error reading auth token:', e);
  }
  return null;
}

/**
 * Retrieve the current logged-in user object from localStorage
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('sts_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {}
  return null;
}

/**
 * Generate standard headers with Authorization Bearer token and user-scoping identifiers
 */
export function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const user = getCurrentUser();

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (user?.id || user?.email) {
    headers['x-user-id'] = String(user.id || user.email);
    headers['x-user-email'] = String(user.email || user.id);
  }

  return headers;
}

/**
 * Perform a fetch request pre-configured with user Authorization Bearer token headers
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = getAuthHeaders(options.headers || {});

  return fetch(url, {
    ...options,
    headers,
  });
}
