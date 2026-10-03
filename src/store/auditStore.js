/**
 * @fileoverview Audit Store — Zustand store para consulta y gestión del historial de auditoría.
 */

import { create } from 'zustand';
import auditService from '../services/auditService.js';

export const useAuditStore = create((set, get) => ({
  logs: [],
  loading: false,
  error: null,
  filtros: {
    busqueda: '',
    entidad: 'todas',
    accion: 'todas',
    fechaDesde: '',
    fechaHasta: '',
  },

  fetchLogs: async () => {
    set({ loading: true });
    try {
      const { filtros } = get();
      const data = await auditService.filtrar(filtros);
      set({ logs: data, loading: false, error: null });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  setFiltros: (nuevosFiltros) => {
    set((state) => ({ filtros: { ...state.filtros, ...nuevosFiltros } }));
    get().fetchLogs();
  },

  resetFiltros: () => {
    set({
      filtros: {
        busqueda: '',
        entidad: 'todas',
        accion: 'todas',
        fechaDesde: '',
        fechaHasta: '',
      },
    });
    get().fetchLogs();
  },

  registrarEvento: async (params) => {
    const res = await auditService.registrar(params);
    // Refrescar lista si ya está cargada
    if (get().logs.length > 0) {
      get().fetchLogs();
    }
    return res;
  },

  limpiarLogs: async () => {
    set({ loading: true });
    try {
      await auditService.limpiar();
      await get().fetchLogs();
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },
}));

export default useAuditStore;
