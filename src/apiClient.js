/**
 * STS FINTECH - Centralized API Client
 * Manages base URL, session credentials, CSRF token handling, and unauthorized session redirects.
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

let csrfToken = null;
let unauthorizedHandler = null;

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function getCsrfToken() {
  return csrfToken;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

/**
 * Fetch a fresh CSRF token from backend
 */
export async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.csrfToken) {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    }
  } catch (err) {
    console.warn('[STS FINTECH] Unable to fetch CSRF token:', err.message);
  }
  return null;
}

/**
 * Core authenticated fetch wrapper
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // Mutating requests require CSRF token
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isMutating && !headers.has('X-CSRF-Token')) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Handle JSON body
  let body = options.body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  const fetchOptions = {
    ...options,
    method,
    headers,
    credentials: 'include', // Ensure session cookies are always included
    body,
  };

  const response = await fetch(url, fetchOptions);

  // Check for session invalidation (401 Unauthorized)
  if (response.status === 401) {
    const isAuthRoute =
      endpoint.includes('/api/auth/login') ||
      endpoint.includes('/api/auth/register');

    if (!isAuthRoute) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sts_unauthorized'));
      }
    }
  }

  return response;
}

export const apiClient = {
  get: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint, body, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'PUT', body }),

  patch: (endpoint, body, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'PATCH', body }),

  delete: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),

  setCsrfToken,
  getCsrfToken,
  fetchCsrfToken,
  setUnauthorizedHandler,
  API_BASE_URL,
};

export default apiClient;
