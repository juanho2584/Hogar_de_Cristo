/**
 * @fileoverview Cliente singleton de Supabase.
 * Configuración con flujo PKCE, refresco automático de token y almacenamiento seguro de sesión.
 */

import { createClient } from '@supabase/supabase-js';
import logger from '../logger/logger.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('tu-proyecto') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('tu-clave')
  );
};

// Singleton Client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

if (isSupabaseConfigured()) {
  logger.info('Cliente Supabase inicializado correctamente con PKCE.');
} else {
  logger.warn('Credenciales de Supabase no configuradas o con placeholders. Modo de persistencia local activo.');
}

export default supabase;
