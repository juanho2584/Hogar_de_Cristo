/**
 * @fileoverview Inscripciones Store — CRUD con validación de unicidad.
 */

import { create } from 'zustand';
import inscripcionesService from '../services/localStorage/inscripcionesService.js';

const useInscripcionesStore = create((set, get) => ({
  inscripciones: [],
  loading: false,
  error: null,

  fetchInscripciones: async () => {
    set({ loading: true });
    try {
      const data = await inscripcionesService.getAll();
      set({ inscripciones: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createInscripcion: async (data) => {
    set({ loading: true });
    try {
      const nueva = await inscripcionesService.create(data);
      set((state) => ({ inscripciones: [...state.inscripciones, nueva], loading: false, error: null }));
      return { ok: true, data: nueva };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateInscripcion: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await inscripcionesService.update(id, data);
      set((state) => ({
        inscripciones: state.inscripciones.map((i) => (i.id === id ? updated : i)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteInscripcion: async (id) => {
    set({ loading: true });
    try {
      await inscripcionesService.delete(id);
      set((state) => ({
        inscripciones: state.inscripciones.filter((i) => i.id !== id),
        loading: false,
        error: null,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  getInscripcionesByCurso: (cursoId) =>
    get().inscripciones.filter((i) => i.cursoId === cursoId && i.status === 'activo'),

  getInscripcionActivaByInterno: (internoId) =>
    get().inscripciones.find((i) => i.internoId === internoId && i.status === 'activo') || null,
}));

export default useInscripcionesStore;
