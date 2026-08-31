/**
 * @fileoverview Asistencia Store — Registro y consulta de asistencias.
 */

import { create } from 'zustand';
import asistenciaService from '../services/localStorage/asistenciaService.js';

const useAsistenciaStore = create((set, get) => ({
  asistencias: [],
  loading: false,
  error: null,

  fetchAsistencias: async () => {
    set({ loading: true });
    try {
      const data = await asistenciaService.getAll();
      set({ asistencias: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  registrarPlanilla: async (registros, cursoId, fecha) => {
    set({ loading: true });
    try {
      const nuevos = await asistenciaService.registrarPlanilla(registros, cursoId, fecha);
      // Recargar todas las asistencias para mantener consistencia
      const all = await asistenciaService.getAll();
      set({ asistencias: all, loading: false, error: null });
      return { ok: true, data: nuevos };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateAsistencia: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await asistenciaService.update(id, data);
      set((state) => ({
        asistencias: state.asistencias.map((a) => (a.id === id ? updated : a)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteAsistencia: async (id) => {
    set({ loading: true });
    try {
      await asistenciaService.delete(id);
      set((state) => ({
        asistencias: state.asistencias.filter((a) => a.id !== id),
        loading: false,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  getAsistenciasByCurso: (cursoId) =>
    get().asistencias.filter((a) => a.cursoId === cursoId),

  getAsistenciasByInternoYCurso: (internoId, cursoId) =>
    get()
      .asistencias.filter((a) => a.internoId === internoId && a.cursoId === cursoId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),

  getAsistenciasByFechaYCurso: (cursoId, fecha) =>
    get().asistencias.filter((a) => a.cursoId === cursoId && a.fecha === fecha),
}));

export default useAsistenciaStore;
