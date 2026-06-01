import { apiFetch } from './client';
import type { ComiteRecord } from '../types/comiteSchema';

export interface ComitesListResponse {
  records: ComiteRecord[];
}

export interface ComiteResponse {
  record: ComiteRecord;
}

export async function fetchComites(): Promise<ComiteRecord[]> {
  const data = await apiFetch<ComitesListResponse>('/comites');
  return data.records;
}

export async function fetchComite(id: string): Promise<ComiteRecord> {
  const data = await apiFetch<ComiteResponse>(`/comites/${id}`);
  return data.record;
}

export async function createComite(record: Partial<ComiteRecord>): Promise<ComiteRecord> {
  const data = await apiFetch<ComiteResponse>('/comites', {
    method: 'POST',
    body: JSON.stringify(record),
  });
  return data.record;
}

export async function updateComite(id: string, data: Partial<ComiteRecord>): Promise<ComiteRecord> {
  const res = await apiFetch<ComiteResponse>(`/comites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.record;
}

export async function deleteComite(id: string): Promise<void> {
  await apiFetch(`/comites/${id}`, { method: 'DELETE' });
}

export async function deleteAllComites(): Promise<{ message: string }> {
  return apiFetch('/comites/all', { method: 'DELETE' });
}
