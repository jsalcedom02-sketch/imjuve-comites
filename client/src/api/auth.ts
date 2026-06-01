import { apiFetch, setAuthToken } from './client';

export interface LoginResponse {
  token: string;
  user: { id: string; username: string; fullName: string; role: string; assignedStates: string[] };
}

export interface MeResponse {
  user: { id: string; username: string; fullName: string; role: string; assignedStates: string[]; created_at: string };
}

export interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  role: string;
  assignedStates: string[];
  createdAt: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(data.token);
  return data;
}

export async function checkAuth(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me');
}

export function logout(): void {
  setAuthToken(null);
}

// ── Admin user management ──────────────────────────────────

export async function fetchUsers(): Promise<UserRecord[]> {
  const data = await apiFetch<{ users: UserRecord[] }>('/users');
  return data.users;
}

export async function createUser(params: {
  username: string; password: string; role: string; assignedStates: string[]; fullName?: string;
}): Promise<{ message: string; user: UserRecord }> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateUser(id: string, params: Partial<{
  username: string; role: string; assignedStates: string[]; password: string; fullName: string;
}>): Promise<{ message: string }> {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchTemplate(): Promise<void> {
  const res = await fetch('/api/auth/template', {
    headers: { Authorization: `Bearer ${localStorage.getItem('comites-auth-token')}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'plantilla_usuarios.csv'; a.click();
  URL.revokeObjectURL(url);
}

export async function importUsers(rows: any[]): Promise<{ message: string; results: any[] }> {
  return apiFetch('/auth/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
