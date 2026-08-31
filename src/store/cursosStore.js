/**
 * @fileoverview Cursos Store — CRUD de cursos con Zustand.
 */

import { create } from 'zustand';
import cursosService from '../services/localStorage/cursosService.js';

const useCursosStore = create((set, get) => ({
  cursos: [],
  loading: false,
  error: null,

  fetchCursos: async () => {
    set({ loading: true });
    try {
      const data = await cursosService.getAll();
      set({ cursos: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createCurso: async (data) => {
    set({ loading: true });
    try {
      const nuevo = await cursosService.create(data);
      set((state) => ({ cursos: [...state.cursos, nuevo], loading: false, error: null }));
      return { ok: true, data: nuevo };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateCurso: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await cursosService.update(id, data);
      set((state) => ({
        cursos: state.cursos.map((c) => (c.id === id ? updated : c)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteCurso: async (id) => {
    set({ loading: true });
    try {
      await cursosService.delete(id);
      set((state) => ({
        cursos: state.cursos.filter((c) => c.id !== id),
        loading: false,
        error: null,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  getCursoById: (id) => get().cursos.find((c) => c.id === id) || null,
  getCursosActivos: () => get().cursos.filter((c) => c.status === 'activo'),
}));

export default useCursosStore;
