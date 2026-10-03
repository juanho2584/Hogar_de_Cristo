/**
 * @fileoverview Servicio de Evaluaciones — Implementación en Supabase con RLS y sanitización.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';
import { sanitizeFormData } from '../../utils/sanitize.js';

const TABLE = 'evaluaciones';

const evaluacionesSupabaseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

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
    const payload = toDatabase(cleanData);

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(inserted);
  },

  update: async (id, data) => {
    const cleanData = sanitizeFormData(data);
    const payload = toDatabase(cleanData);

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
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw new Error(formatErrorMessage(error));
  },

  getByInternoYCurso: async (internoId, tallerId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('interno_id', internoId)
      .eq('taller_id', tallerId);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  getByCurso: async (tallerId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('taller_id', tallerId);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },
};

export default evaluacionesSupabaseService;
