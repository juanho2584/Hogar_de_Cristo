/**
 * @fileoverview Servicio de Usuarios — Implementación en Supabase con RLS y gestión de perfiles.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';
import { sanitizeFormData } from '../../utils/sanitize.js';

const TABLE = 'perfiles_usuario';

const usuariosSupabaseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(formatErrorMessage(error));
    return data ? fromDatabase(data) : null;
  },

  create: async (userData) => {
    const clean = sanitizeFormData(userData);

    // Registro seguro a través del endpoint de Auth de Supabase
    const { data, error } = await supabase.auth.signUp({
      email: clean.email.trim(),
      password: clean.password,
      options: {
        data: {
          nombre: clean.nombre.trim(),
          rol: clean.rol || 'user',
        },
      },
    });

    if (error) throw new Error(formatErrorMessage(error));

    // El trigger en Postgres `handle_new_user` insertará automáticamente en `perfiles_usuario`
    return {
      id: data.user.id,
      email: clean.email.trim(),
      nombre: clean.nombre.trim(),
      rol: clean.rol || 'user',
    };
  },

  update: async (id, data) => {
    const clean = sanitizeFormData(data);
    const payload = toDatabase({
      nombre: clean.nombre,
      rol: clean.rol,
    });

    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(updated);
  },

  delete: async (id) => {
    // Eliminación de perfil de usuario en base de datos
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(formatErrorMessage(error));
  },
};

export default usuariosSupabaseService;
