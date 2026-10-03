/**
 * @fileoverview Servicio de Inscripciones — Implementación en Supabase con RLS.
 * Aplica la regla institucional de una única inscripción activa por interno.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';

const TABLE = 'inscripciones';

const inscripcionesSupabaseService = {
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

  getByInternoId: async (internoId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('interno_id', internoId);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  getByTallerId: async (tallerId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('taller_id', tallerId);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  create: async (data) => {
    // Validación de negocio: Verificar si ya tiene una inscripción activa
    const { data: activas, error: checkError } = await supabase
      .from(TABLE)
      .select('id')
      .eq('interno_id', data.internoId)
      .eq('status', 'activo');

    if (checkError) throw new Error(formatErrorMessage(checkError));
    if (activas && activas.length > 0) {
      throw new Error('El interno ya cuenta con una inscripción activa en otro taller.');
    }

    const payload = toDatabase({
      ...data,
      status: data.status || 'activo',
      fechaInscripcion: data.fechaInscripcion || new Date().toISOString().split('T')[0],
    });

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(inserted);
  },

  update: async (id, data) => {
    const payload = toDatabase(data);

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
};

export default inscripcionesSupabaseService;
