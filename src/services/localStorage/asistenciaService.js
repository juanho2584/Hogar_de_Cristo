/**
 * @fileoverview Servicio de Asistencia — Implementación localStorage con auditoría.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';

const KEY = STORAGE_KEYS.ASISTENCIA;

const asistenciaService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((a) => a.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    // Evitar duplicado para mismo interno/curso/fecha
    const existe = items.find(
      (a) => a.internoId === data.internoId && a.tallerId === data.tallerId && a.fecha === data.fecha
    );
    if (existe) {
      throw new Error('Ya existe un registro de asistencia para este interno en esa fecha.');
    }

    const newItem = { ...data, id: generateId() };
    saveToStorage(KEY, [...items, newItem]);

    await auditService.registrar({
      accion: 'ASISTENCIA',
      entidad: 'Asistencia',
      detalle: `Asistencia individual guardada: Interno ID [${data.internoId}] - Estado [${data.estado.toUpperCase()}] - Fecha ${data.fecha}`,
      metadata: { asistenciaId: newItem.id, tallerId: data.tallerId, fecha: data.fecha },
    });

    return newItem;
  },

  /**
   * Registra o actualiza múltiples asistencias de una vez (planilla diaria).
   * @param {Array} registros - Array de registros sin id
   * @param {string} tallerId
   * @param {string} fecha
   * @returns {Promise<Array>}
   */
  registrarPlanilla: async (registros, tallerId, fecha) => {
    const items = getFromStorage(KEY);

    // Filtrar los existentes para esa fecha/curso
    const sinEsteFecha = items.filter((a) => !(a.tallerId === tallerId && a.fecha === fecha));

    const nuevos = registros.map((r) => ({ ...r, id: generateId() }));
    const updated = [...sinEsteFecha, ...nuevos];
    saveToStorage(KEY, updated);

    await auditService.registrar({
      accion: 'ASISTENCIA',
      entidad: 'Asistencia',
      detalle: `Planilla de asistencia guardada: ${nuevos.length} registros para Curso ID [${tallerId}] en fecha ${fecha}`,
      metadata: { tallerId, fecha, cantidad: nuevos.length },
    });

    return nuevos;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Registro no encontrado.');

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: 'ASISTENCIA',
      entidad: 'Asistencia',
      detalle: `Registro de asistencia modificado a [${updated.estado.toUpperCase()}] para fecha ${updated.fecha}`,
      metadata: { asistenciaId: id, estado: updated.estado },
    });

    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((a) => a.id !== id));
  },

  getByCursoYFecha: async (tallerId, fechaDesde, fechaHasta) => {
    const items = getFromStorage(KEY);
    return items.filter((a) => {
      if (a.tallerId !== tallerId) return false;
      if (fechaDesde && a.fecha < fechaDesde) return false;
      if (fechaHasta && a.fecha > fechaHasta) return false;
      return true;
    });
  },

  getByInternoYCurso: async (internoId, tallerId) => {
    const items = getFromStorage(KEY);
    return items
      .filter((a) => a.internoId === internoId && a.tallerId === tallerId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  getByFechaYCurso: async (tallerId, fecha) => {
    const items = getFromStorage(KEY);
    return items.filter((a) => a.tallerId === tallerId && a.fecha === fecha);
  },
};

export default asistenciaService;
