/**
 * @fileoverview Servicio de Talleres — Implementación en Supabase con RLS y sanitización.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';
import { sanitizeFormData } from '../../utils/sanitize.js';

const TABLE = 'talleres';

const talleresSupabaseService = {
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
};

export default talleresSupabaseService;
