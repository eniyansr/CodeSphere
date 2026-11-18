/**
 * CodeSphere Pro — Unified API Client
 * 
 * Communicates with Cloudflare Workers API.
 * Automatically injects authorization tokens and handles offline/local development.
 */

// Central API Base URL: auto-detects current host or falls back to worker
export const API_BASE = window.location.origin.includes('pages.dev') || window.location.origin.includes('localhost')
  ? '' // Relative path when running on pages with worker routes or proxy
  : 'https://codesphere-api.eniyansr31.workers.dev';

let authToken = localStorage.getItem('codesphere_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('codesphere_token', token);
  } else {
    localStorage.removeItem('codesphere_token');
  }
}

export function getAuthToken() {
  return authToken;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = (data && (data.error || data.message)) || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.warn(`[API Client] Error on ${endpoint}:`, error.message);
    throw error;
  }
}
