/**
 * @fileoverview Internos Store — CRUD de internos con Zustand.
 */

import { create } from 'zustand';
import internosService from '../services/localStorage/internosService.js';

const useInternosStore = create((set, get) => ({
  /** @type {Array} */
  internos: [],
  loading: false,
  error: null,

  fetchInternos: async () => {
    set({ loading: true });
    try {
      const data = await internosService.getAll();
      set({ internos: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createInterno: async (data) => {
    set({ loading: true });
    try {
      const nuevo = await internosService.create(data);
      set((state) => ({ internos: [...state.internos, nuevo], loading: false, error: null }));
      return { ok: true, data: nuevo };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateInterno: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await internosService.update(id, data);
      set((state) => ({
        internos: state.internos.map((i) => (i.id === id ? updated : i)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteInterno: async (id) => {
    set({ loading: true });
    try {
      await internosService.delete(id);
      set((state) => ({
        internos: state.internos.filter((i) => i.id !== id),
        loading: false,
        error: null,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  getInternoById: (id) => get().internos.find((i) => i.id === id) || null,
}));

export default useInternosStore;
