/**
 * @fileoverview Talleres Store — CRUD de talleres con Zustand.
 */

import { create } from "zustand";
import talleresService from "../services/localStorage/talleresService.js";

const useTalleresStore = create((set, get) => ({
  talleres: [],
  loading: false,
  error: null,

  fetchTalleres: async () => {
    set({ loading: true });
    try {
      const data = await talleresService.getAll();
      set({ talleres: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createTaller: async (data) => {
    set({ loading: true });
    try {
      const nuevo = await talleresService.create(data);
      set((state) => ({
        talleres: [...state.talleres, nuevo],
        loading: false,
        error: null,
      }));
      return { ok: true, data: nuevo };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateTaller: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await talleresService.update(id, data);
      set((state) => ({
        talleres: state.talleres.map((c) => (c.id === id ? updated : c)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteTaller: async (id) => {
    set({ loading: true });
    try {
      await talleresService.delete(id);
      set((state) => ({
        talleres: state.talleres.filter((c) => c.id !== id),
        loading: false,
        error: null,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  getTallerById: (id) => get().talleres.find((c) => c.id === id) || null,
  getTalleresActivos: () => get().talleres.filter((c) => c.status === "activo"),
}));

export default useTalleresStore;
