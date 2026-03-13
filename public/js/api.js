const API_BASE = '/api';

export function getToken() {
  return window.localStorage.getItem('vital_token');
}

export function setToken(token) {
  window.localStorage.setItem('vital_token', token);
}

export function clearToken() {
  window.localStorage.removeItem('vital_token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/index.html';
    return Promise.reject(new Error('Unauthorized'));
  }

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

