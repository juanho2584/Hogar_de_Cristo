/**
 * @fileoverview Servicio de Asistencia — Implementación localStorage.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.ASISTENCIA;

/**
 * @typedef {Object} RegistroAsistencia
 * @property {string} id
 * @property {string} internoId
 * @property {string} cursoId
 * @property {string} fecha - ISO date (YYYY-MM-DD)
 * @property {'presente'|'ausente'|'tarde'|'justificado'} estado
 * @property {string} [notas]
 * @property {string} registradoPor - userId
 */

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
      (a) => a.internoId === data.internoId && a.cursoId === data.cursoId && a.fecha === data.fecha
    );
    if (existe) {
      throw new Error('Ya existe un registro de asistencia para este interno en esa fecha.');
    }

    const newItem = { ...data, id: generateId() };
    saveToStorage(KEY, [...items, newItem]);
    return newItem;
  },

  /**
   * Registra o actualiza múltiples asistencias de una vez (planilla diaria).
   * @param {Array} registros - Array de registros sin id
   * @param {string} cursoId
   * @param {string} fecha
   * @returns {Promise<Array>}
   */
  registrarPlanilla: async (registros, cursoId, fecha) => {
    const items = getFromStorage(KEY);

    // Filtrar los existentes para esa fecha/curso
    const sinEsteFecha = items.filter((a) => !(a.cursoId === cursoId && a.fecha === fecha));

    const nuevos = registros.map((r) => ({ ...r, id: generateId() }));
    const updated = [...sinEsteFecha, ...nuevos];
    saveToStorage(KEY, updated);
    return nuevos;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Registro no encontrado.');

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);
    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((a) => a.id !== id));
  },

  /** Obtiene asistencias de un curso en un rango de fechas */
  getByCursoYFecha: async (cursoId, fechaDesde, fechaHasta) => {
    const items = getFromStorage(KEY);
    return items.filter((a) => {
      if (a.cursoId !== cursoId) return false;
      if (fechaDesde && a.fecha < fechaDesde) return false;
      if (fechaHasta && a.fecha > fechaHasta) return false;
      return true;
    });
  },

  /** Obtiene asistencias de un interno en un curso */
  getByInternoYCurso: async (internoId, cursoId) => {
    const items = getFromStorage(KEY);
    return items
      .filter((a) => a.internoId === internoId && a.cursoId === cursoId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  /** Obtiene todos los registros de una fecha específica para un curso */
  getByFechaYCurso: async (cursoId, fecha) => {
    const items = getFromStorage(KEY);
    return items.filter((a) => a.cursoId === cursoId && a.fecha === fecha);
  },
};

export default asistenciaService;
