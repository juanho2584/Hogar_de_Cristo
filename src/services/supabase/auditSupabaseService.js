/**
 * @fileoverview Servicio de Auditoría — Implementación en Supabase con RLS.
 */

import { supabase } from '../../lib/baas/supabaseClient.js';
import { toDatabase, fromDatabase } from '../../lib/baas/caseMapper.js';
import { formatErrorMessage } from '../../lib/baas/errorHandler.js';
import logger from '../../lib/logger/logger.js';

const TABLE = 'audit_log';

const auditSupabaseService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('fecha', { ascending: false })
      .limit(1000);

    if (error) throw new Error(formatErrorMessage(error));
    return fromDatabase(data || []);
  },

  registrar: async ({ accion, entidad, detalle, usuario, metadata = {} }) => {
    try {
      const payload = toDatabase({
        accion: accion || 'MODIFICACION',
        entidad: entidad || 'General',
        detalle: detalle || '',
        usuarioId: usuario?.id || null,
        metadata: JSON.stringify(metadata),
      });

      const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
      if (error) throw error;
      return fromDatabase(data);
    } catch (err) {
      logger.warn('Error al registrar auditoría en Supabase:', err.message);
      return null;
    }
  },

  filtrar: async (filtros = {}) => {
    let query = supabase.from(TABLE).select('*').order('fecha', { ascending: false }).limit(1000);

    if (filtros.entidad && filtros.entidad !== 'todas') {
      query = query.eq('entidad', filtros.entidad);
    }
    if (filtros.accion && filtros.accion !== 'todas') {
      query = query.eq('accion', filtros.accion);
    }
    if (filtros.fechaDesde) {
      query = query.gte('fecha', `${filtros.fechaDesde}T00:00:00Z`);
    }
    if (filtros.fechaHasta) {
      query = query.lte('fecha', `${filtros.fechaHasta}T23:59:59Z`);
    }

    const { data, error } = await query;
    if (error) throw new Error(formatErrorMessage(error));
    const items = fromDatabase(data || []);

    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      return items.filter((log) =>
        `${log.detalle} ${log.entidad} ${log.accion}`.toLowerCase().includes(q)
      );
    }

    return items;
  },

  limpiar: async () => {
    const { error } = await supabase.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(formatErrorMessage(error));
  },
};

export default auditSupabaseService;
