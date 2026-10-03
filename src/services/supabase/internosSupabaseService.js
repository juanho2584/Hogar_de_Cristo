/**
 * @fileoverview Servicio de Internos — Implementación en Supabase con RLS y sanitización.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';
import { sanitizeFormData } from '../../utils/sanitize.js';

const TABLE = 'internos';

const internosSupabaseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('apellido_paterno', { ascending: true });

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

  create: async (data) => {
    const cleanData = sanitizeFormData(data);
    const dbPayload = toDatabase(cleanData);

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(inserted);
  },

  update: async (id, data) => {
    const cleanData = sanitizeFormData(data);
    const dbPayload = toDatabase(cleanData);

    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(updated);
  },

  delete: async (id) => {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw new Error(formatErrorMessage(error));
  },

  search: async (query) => {
    const q = query.trim();
    if (!q) return internosSupabaseService.getAll();

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or(
        `dni.ilike.%${q}%,ficha_criminologica.ilike.%${q}%,nombre_completo.ilike.%${q}%,apellido_paterno.ilike.%${q}%`
      );

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },
};

export default internosSupabaseService;
