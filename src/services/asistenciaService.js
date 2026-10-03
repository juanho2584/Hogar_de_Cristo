/**
 * @fileoverview Adaptador de servicio para Asistencia.
 * Conmuta automáticamente entre Supabase y LocalStorage.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/asistenciaService.js';
import supabaseService from './supabase/asistenciaSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const asistenciaService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  create: (...args) => getActiveService().create(...args),
  registrarPlanilla: (...args) => getActiveService().registrarPlanilla(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
  getByCursoYFecha: (...args) => getActiveService().getByCursoYFecha(...args),
  getByInternoYCurso: (...args) => getActiveService().getByInternoYCurso(...args),
  getByFechaYCurso: (...args) => getActiveService().getByFechaYCurso(...args),
};

export default asistenciaService;
