// API and WebSocket helpers for local and production deployment

let rawApiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

// If rawApiUrl is a hostname without protocol (e.g. "mythos-backend.onrender.com" from Render blueprint)
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://') && !rawApiUrl.startsWith('/')) {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http:' : 'https:';
  rawApiUrl = `${protocol}//${rawApiUrl}`;
}

export const API_BASE_URL = rawApiUrl.startsWith('http')
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : (rawApiUrl.startsWith('/') ? rawApiUrl : `/${rawApiUrl}`);

export function getWebSocketUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  let wsBase = import.meta.env.VITE_WS_BASE_URL;
  if (wsBase) {
    if (!wsBase.startsWith('ws://') && !wsBase.startsWith('wss://')) {
      const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'ws:' : 'wss:';
      wsBase = `${wsProtocol}//${wsBase.replace(/^https?:\/\//, '')}`;
    }
    return `${wsBase.replace(/\/+$/, '')}${cleanPath}`;
  }

  if (API_BASE_URL.startsWith('http')) {
    const derivedWs = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
    return `${derivedWs}${cleanPath}`;
  }

  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
  return `${protocol}//${host}${cleanPath}`;
}
