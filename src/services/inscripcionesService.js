/**
 * @fileoverview Adaptador de servicio para Inscripciones.
 * Conmuta automáticamente entre Supabase y LocalStorage.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/inscripcionesService.js';
import supabaseService from './supabase/inscripcionesSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const inscripcionesService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  getByInternoId: (...args) => getActiveService().getByInternoId(...args),
  getByTallerId: (...args) => getActiveService().getByTallerId(...args),
  create: (...args) => getActiveService().create(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
};

export default inscripcionesService;
