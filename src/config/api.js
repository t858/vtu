// Central API configuration
// In development, defaults to local server http://localhost:3000
// In production on Vercel, can be set via VITE_API_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : 'http://localhost:3000';
