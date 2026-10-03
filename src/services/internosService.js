/**
 * @fileoverview Adaptador de servicio para Internos.
 * Conmuta automáticamente entre Supabase y LocalStorage según la configuración de variables de entorno.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/internosService.js';
import supabaseService from './supabase/internosSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const internosService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  create: (...args) => getActiveService().create(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
  search: (...args) => getActiveService().search(...args),
};

export default internosService;
