/**
 * @fileoverview Adaptador de servicio para Usuarios.
 * Conmuta automáticamente entre Supabase y LocalStorage.
 */

import { isSupabaseConfigured } from '../lib/baas/supabaseClient.js';
import localService from './localStorage/usuariosService.js';
import supabaseService from './supabase/usuariosSupabaseService.js';

const getActiveService = () => (isSupabaseConfigured() ? supabaseService : localService);

const usuariosService = {
  getAll: (...args) => getActiveService().getAll(...args),
  getById: (...args) => getActiveService().getById(...args),
  create: (...args) => getActiveService().create(...args),
  update: (...args) => getActiveService().update(...args),
  delete: (...args) => getActiveService().delete(...args),
  authenticate: (...args) => localService.authenticate(...args),
};

export default usuariosService;
