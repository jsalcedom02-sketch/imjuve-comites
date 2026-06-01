import { apiFetch } from './client';

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
}

export async function fetchAuditLogs(params?: {
  limit?: number; offset?: number; action?: string; entity?: string; username?: string;
}): Promise<AuditResponse> {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  if (params?.action) search.set('action', params.action);
  if (params?.entity) search.set('entity', params.entity);
  if (params?.username) search.set('username', params.username);
  return apiFetch(`/audit?${search.toString()}`);
}

export async function exportAuditLog(): Promise<void> {
  const token = localStorage.getItem('comites-auth-token');
  const res = await fetch('/api/audit/export', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'audit_log.csv'; a.click();
  URL.revokeObjectURL(url);
}
