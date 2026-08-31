/**
 * @fileoverview Auth Store — Maneja sesión de usuario con persistencia en sessionStorage.
 */

import { create } from 'zustand';
import usuariosService from '../services/localStorage/usuariosService.js';

const SESSION_KEY = 'hdd_session';

const useAuthStore = create((set, get) => ({
  /** @type {Object|null} */
  usuario: (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  loading: false,
  error: null,

  /**
   * Inicia sesión del usuario.
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await usuariosService.authenticate(email, password);
      if (!user) {
        set({ error: 'Email o contraseña incorrectos.', loading: false });
        return false;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ usuario: user, loading: false, error: null });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  /** Cierra la sesión */
  logout: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ usuario: null, error: null });
  },

  /** Verifica si el usuario tiene rol admin */
  esAdmin: () => get().usuario?.rol === 'admin',

  /** Verifica si el usuario está autenticado */
  estaAutenticado: () => !!get().usuario,
}));

export default useAuthStore;
