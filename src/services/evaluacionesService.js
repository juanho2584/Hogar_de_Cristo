/**
 * @fileoverview Adaptador de servicio para Evaluaciones.
 * Conmuta automáticamente entre Supabase y LocalStorage.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/evaluacionesService.js';
import supabaseService from './supabase/evaluacionesSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const evaluacionesService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  create: (...args) => getActiveService().create(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
  getByInternoYCurso: (...args) => getActiveService().getByInternoYCurso(...args),
  getByCurso: (...args) => getActiveService().getByCurso(...args),
};

export default evaluacionesService;
