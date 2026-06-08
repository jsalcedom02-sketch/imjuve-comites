import { apiFetch } from './client';
import type { EstadoEstadisticas } from '../types/comiteSchema';

export interface EstadisticasResponse {
  estadoEstadisticas: EstadoEstadisticas[];
}

export async function fetchEstadisticas(): Promise<EstadoEstadisticas[]> {
  const data = await apiFetch<EstadisticasResponse>('/estadisticas');
  return data.estadoEstadisticas;
}

export async function saveEstadistica(estado: string, data: EstadoEstadisticas): Promise<void> {
  await apiFetch(`/estadisticas/${encodeURIComponent(estado)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEstadistica(estado: string): Promise<void> {
  await apiFetch(`/estadisticas/${encodeURIComponent(estado)}`, {
    method: 'DELETE',
  });
}

export interface ResumenEstado {
  estado: string;
  poblacionJoven: number;
  metaComites: number;
  comitesActuales: number;
  integrantesActuales: number;
}

export async function fetchResumen(): Promise<ResumenEstado[]> {
  const data = await apiFetch<{ resumen: ResumenEstado[] }>('/estadisticas/resumen');
  return data.resumen;
}
