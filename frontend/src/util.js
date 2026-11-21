// API and WebSocket helpers for local and production deployment

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.startsWith('http') ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`) : rawApiUrl)
  : '/api';

export function getWebSocketUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.VITE_WS_BASE_URL) {
    const wsBase = import.meta.env.VITE_WS_BASE_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
    return `${wsBase}${cleanPath}`;
  }

  if (rawApiUrl && rawApiUrl.startsWith('http')) {
    const wsBase = rawApiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
    return `${wsBase}${cleanPath}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${cleanPath}`;
}
