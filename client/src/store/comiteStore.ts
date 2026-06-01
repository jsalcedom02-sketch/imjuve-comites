import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComiteRecord, EstadoEstadisticas } from '../types/comiteSchema';
import * as comitesApi from '../api/comites';
import * as estadisticasApi from '../api/estadisticas';
import { normalizeEstado } from '../data/municipios';

type Tab = 'registro' | 'historial' | 'consulta' | 'dashboard' | 'estadisticas' | 'importar' | 'admin';

interface ComiteStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  records: ComiteRecord[];
  setRecords: (records: ComiteRecord[]) => void;
  addRecord: (record: ComiteRecord) => void;
  updateRecord: (id: string, data: Partial<ComiteRecord>) => void;
  deleteRecord: (id: string) => void;

  folioCounters: Record<string, number>;
  getNextFolioNumber: (estado: string) => number;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  estadoEstadisticas: EstadoEstadisticas[];
  updateEstadoEstadisticas: (data: EstadoEstadisticas) => void;
  removeEstadoEstadisticas: (estado: string) => void;

  syncFromServer: () => Promise<void>;
  syncEstadisticasFromServer: () => Promise<void>;
}

export const useComiteStore = create<ComiteStore>()(
  persist(
    (set, get) => ({
      activeTab: 'registro',
      setActiveTab: (tab) => set({ activeTab: tab }),

      records: [],
      setRecords: (records) => set({ records }),
      addRecord: (record) =>
        set((state) => ({ records: [record, ...state.records] })),
      updateRecord: (id, data) => {
        set((state) => ({ records: state.records.map((r) => r.id === id ? { ...r, ...data } : r) }));
        comitesApi.updateComite(id, data).catch(console.error);
      },
      deleteRecord: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
        comitesApi.deleteComite(id).catch(console.error);
      },

      folioCounters: {},
      getNextFolioNumber: (estado: string) => {
        const key = estado.toUpperCase();
        const current = get().folioCounters[key] || 0;
        const next = current + 1;
        set((state) => ({ folioCounters: { ...state.folioCounters, [key]: next } }));
        return next;
      },

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      estadoEstadisticas: [],
      updateEstadoEstadisticas: (data) => {
        set((state) => ({
          estadoEstadisticas: [
            ...state.estadoEstadisticas.filter((e) => e.estado !== data.estado),
            data,
          ],
        }));
        estadisticasApi.saveEstadistica(data.estado, data).catch(console.error);
      },
      removeEstadoEstadisticas: (estado) => {
        set((state) => ({
          estadoEstadisticas: state.estadoEstadisticas.filter((e) => e.estado !== estado),
        }));
        estadisticasApi.deleteEstadistica(estado).catch(console.error);
      },

      syncFromServer: async () => {
        try {
          const records = await comitesApi.fetchComites();
          set({ records: records.map((r) => ({ ...r, estado: normalizeEstado(r.estado) })) });
        } catch (err) {
          console.error('Error syncing comites:', err);
        }
      },

      syncEstadisticasFromServer: async () => {
        try {
          const stats = await estadisticasApi.fetchEstadisticas();
          set({ estadoEstadisticas: stats });
        } catch (err) {
          console.error('Error syncing estadisticas:', err);
        }
      },
    }),
    {
      name: 'comites-jxt-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        records: state.records,
        folioCounters: state.folioCounters,
        estadoEstadisticas: state.estadoEstadisticas,
      }),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { records?: ComiteRecord[]; folioCounters?: Record<string, number>; estadoEstadisticas?: unknown[] };
        if (version === 0 && state.records) {
          state.records = state.records.map((r) => ({
            ...r,
            integrantes: r.integrantes.map((i) => ({
              ...i,
              cargo: i.cargo === 'ENLACE' ? 'INTEGRANTE' : i.cargo,
            })),
          }));
        }
        return {
          activeTab: 'registro',
          records: state.records ?? [],
          folioCounters: state.folioCounters ?? {},
          estadoEstadisticas: (state.estadoEstadisticas ?? []) as EstadoEstadisticas[],
        };
      },
    }
  )
);
