/**
 * Global API Configuration for Vathilai Motors
 * Handles local development, Vercel production, and Render backend URLs.
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PROD
    ? 'https://vathilai-motors-api.onrender.com'
    : '')
).replace(/\/+$/, '');

/**
 * Builds the fully qualified API URL.
 * In development, returns relative path (or VITE_API_URL if set).
 * In production, prefixes with API_BASE_URL (https://vathilai-motors-api.onrender.com)
 * unless path is already an absolute URL.
 */
export function buildApiUrl(path) {
  if (!path) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Convenience fetch wrapper that resolves the URL and defaults to credentials: 'include'.
 */
export function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  return fetch(url, {
    credentials: 'include',
    ...options,
  });
}
