/**
 * @fileoverview Servicio de Asistencia — Implementación en Supabase con RLS y upsert atómico.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';

const TABLE = 'asistencia';

const asistenciaSupabaseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('fecha', { ascending: false });

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
    const payload = toDatabase(data);

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(inserted);
  },

  registrarPlanilla: async (registros, tallerId, fecha) => {
    if (!registros || registros.length === 0) return [];

    const payloads = registros.map((r) =>
      toDatabase({
        ...r,
        tallerId,
        fecha,
      })
    );

    // Upsert atómico basado en la clave única (interno_id, taller_id, fecha)
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payloads, { onConflict: 'interno_id,taller_id,fecha' })
      .select();

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
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

  getByCursoYFecha: async (tallerId, fechaDesde, fechaHasta) => {
    let query = supabase.from(TABLE).select('*').eq('taller_id', tallerId);

    if (fechaDesde) query = query.gte('fecha', fechaDesde);
    if (fechaHasta) query = query.lte('fecha', fechaHasta);

    const { data, error } = await query.order('fecha', { ascending: true });
    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  getByInternoYCurso: async (internoId, tallerId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('interno_id', internoId)
      .eq('taller_id', tallerId)
      .order('fecha', { ascending: true });

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  getByFechaYCurso: async (tallerId, fecha) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('taller_id', tallerId)
      .eq('fecha', fecha);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },
};

export default asistenciaSupabaseService;
