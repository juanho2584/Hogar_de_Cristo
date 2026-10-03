/**
 * @fileoverview Adaptador de servicio para Auditoría.
 * Conmuta automáticamente entre Supabase y LocalStorage.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/auditService.js';
import supabaseService from './supabase/auditSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const auditService = {
  getAll: (...args) => getActiveService().getAll(...args),
  registrar: (...args) => getActiveService().registrar(...args),
  filtrar: (...args) => getActiveService().filtrar(...args),
  limpiar: (...args) => getActiveService().limpiar(...args),
};

export default auditService;
