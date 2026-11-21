// API and WebSocket helpers for local and production deployment

const isRenderDeployment = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

let rawApiUrl = import.meta.env.VITE_API_BASE_URL;

// If on Render production and no explicit external API URL was baked in, default to the live backend URL
if (!rawApiUrl || rawApiUrl === '/api') {
  rawApiUrl = isRenderDeployment 
    ? 'https://mythos-backend-m6k6.onrender.com/api' 
    : '/api';
}

// If rawApiUrl is a Render internal hostname without domain (e.g. "mythos-backend-m6k6"), append ".onrender.com"
if (rawApiUrl && !rawApiUrl.includes('.') && !rawApiUrl.startsWith('/')) {
  rawApiUrl = `${rawApiUrl}.onrender.com`;
}

// If rawApiUrl is a hostname without protocol (e.g. "mythos-backend-m6k6.onrender.com")
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
  if (!wsBase && isRenderDeployment) {
    wsBase = 'wss://mythos-backend-m6k6.onrender.com/ws';
  }

  if (wsBase) {
    if (!wsBase.includes('.') && !wsBase.startsWith('/')) {
      wsBase = `${wsBase}.onrender.com`;
    }
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
