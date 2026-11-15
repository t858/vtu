// Central API configuration
// In development: defaults to local server http://localhost:3000
// In production on Vercel: uses relative path '' so browser calls go directly to the same domain (e.g. /api/...)
// Can also be explicitly overridden by setting VITE_API_URL in Vercel environment variables.
export const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : (import.meta.env.PROD ? '' : 'http://localhost:3000');
