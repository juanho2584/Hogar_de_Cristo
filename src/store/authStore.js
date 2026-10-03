/**
 * @fileoverview Auth Store — Gestión centralizada de autenticación y RBAC.
 * Soporta Supabase Auth con PKCE, roles verificados en servidor, y fallback para desarrollo local.
 * Implementa protección de rate limiting frontend contra fuerza bruta.
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import { formatErrorMessage } from '../lib/baas/errorHandler.js';
import usuariosService from '../services/localStorage/usuariosService.js';
import logger from '../lib/logger/logger.js';

const SESSION_KEY = 'hdd_session';

// Estado de Rate Limiting en memoria para Login
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCK_TIME_MS: 60 * 1000, // 60 segundos de bloqueo
};

let failedAttempts = 0;
let lockUntil = null;

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
  lockoutRemaining: 0,

  /**
   * Inicializa listener de autenticación de Supabase si está disponible.
   */
  initAuthListener: () => {
    if (!isSupabaseConfigured() || !supabase) return;

    supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Supabase Auth Event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        // Consultar el perfil y rol en la tabla perfiles_usuario
        const { data: perfil } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const rol = perfil?.rol || session.user.app_metadata?.rol || session.user.user_metadata?.rol || 'user';
        const usuarioData = {
          id: session.user.id,
          email: session.user.email,
          nombre: perfil?.nombre || session.user.user_metadata?.nombre || session.user.email.split('@')[0],
          rol,
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuarioData));
        set({ usuario: usuarioData, loading: false, error: null });
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(SESSION_KEY);
        set({ usuario: null, loading: false });
      }
    });
  },

  /**
   * Inicia sesión con verificación de rate-limiting defensivo.
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const now = Date.now();

    // Verificación de bloqueo por intentos excesivos (Rate Limiting)
    if (lockUntil && now < lockUntil) {
      const remainingSeconds = Math.ceil((lockUntil - now) / 1000);
      set({
        error: `Demasiados intentos fallidos. Por seguridad, espera ${remainingSeconds} segundos.`,
        lockoutRemaining: remainingSeconds,
      });
      return false;
    }

    set({ loading: true, error: null });

    try {
      // 1. Si Supabase está configurado, autenticar vía Supabase Auth
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          failedAttempts += 1;
          if (failedAttempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
            lockUntil = Date.now() + RATE_LIMIT_CONFIG.LOCK_TIME_MS;
          }
          const msg = formatErrorMessage(error);
          set({ error: msg, loading: false });
          return false;
        }

        // Obtener rol desde base de datos
        const { data: perfil } = await supabase
          .from('perfiles_usuario')
          .select('rol, nombre')
          .eq('id', data.user.id)
          .single();

        const rol = perfil?.rol || data.user.app_metadata?.rol || 'user';
        const usuarioData = {
          id: data.user.id,
          email: data.user.email,
          nombre: perfil?.nombre || data.user.user_metadata?.nombre || data.user.email.split('@')[0],
          rol,
        };

        // Reset de intentos fallidos al tener éxito
        failedAttempts = 0;
        lockUntil = null;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuarioData));
        set({ usuario: usuarioData, loading: false, error: null, lockoutRemaining: 0 });
        return true;
      }

      // 2. Fallback de desarrollo local si Supabase no está conectado
      const user = await usuariosService.authenticate(email, password);
      if (!user) {
        failedAttempts += 1;
        if (failedAttempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
          lockUntil = Date.now() + RATE_LIMIT_CONFIG.LOCK_TIME_MS;
        }
        set({ error: 'Email o contraseña incorrectos.', loading: false });
        return false;
      }

      failedAttempts = 0;
      lockUntil = null;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ usuario: user, loading: false, error: null, lockoutRemaining: 0 });
      return true;
    } catch (err) {
      set({ error: formatErrorMessage(err), loading: false });
      return false;
    }
  },

  /**
   * Cierra sesión
   */
  logout: async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      logger.error('Logout', err);
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
      set({ usuario: null, error: null });
    }
  },

  /**
   * Envía correo de recuperación de contraseña
   * @param {string} email
   */
  recuperarPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = formatErrorMessage(err);
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  /** Verifica si el usuario tiene rol admin */
  esAdmin: () => get().usuario?.rol === 'admin',

  /** Verifica si el usuario está autenticado */
  estaAutenticado: () => !!get().usuario,
}));

export default useAuthStore;
