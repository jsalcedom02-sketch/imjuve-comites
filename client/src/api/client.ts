const API_BASE = '/api';

let token: string | null = localStorage.getItem('comites-auth-token');

export function setAuthToken(newToken: string | null) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('comites-auth-token', newToken);
  } else {
    localStorage.removeItem('comites-auth-token');
  }
}

export function getAuthToken(): string | null {
  return token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data as T;
}
