/**
 * @fileoverview Usuarios Store — Gestión de usuarios del sistema (solo ADMIN).
 */

import { create } from 'zustand';
import usuariosService from '../services/localStorage/usuariosService.js';

const useUsuariosStore = create((set) => ({
  usuarios: [],
  loading: false,
  error: null,

  fetchUsuarios: async () => {
    set({ loading: true });
    try {
      const data = await usuariosService.getAll();
      set({ usuarios: data, loading: false, error: null });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createUsuario: async (data) => {
    set({ loading: true });
    try {
      const nuevo = await usuariosService.create(data);
      set((state) => ({ usuarios: [...state.usuarios, nuevo], loading: false, error: null }));
      return { ok: true, data: nuevo };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  updateUsuario: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await usuariosService.update(id, data);
      set((state) => ({
        usuarios: state.usuarios.map((u) => (u.id === id ? updated : u)),
        loading: false,
        error: null,
      }));
      return { ok: true, data: updated };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  deleteUsuario: async (id) => {
    set({ loading: true });
    try {
      await usuariosService.delete(id);
      set((state) => ({
        usuarios: state.usuarios.filter((u) => u.id !== id),
        loading: false,
      }));
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },
}));

export default useUsuariosStore;
