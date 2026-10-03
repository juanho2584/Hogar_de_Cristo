/**
 * @fileoverview Adaptador de servicio para Talleres / Cursos.
 * Conmuta automáticamente entre Supabase y LocalStorage según la configuración.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/talleresService.js';
import supabaseService from './supabase/talleresSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const talleresService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  create: (...args) => getActiveService().create(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
};

export default talleresService;
