/**
 * @fileoverview Servicio de Inscripciones — Implementación localStorage.
 * Aplica la regla de negocio: un interno solo puede tener 1 inscripción activa.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.INSCRIPCIONES;

/**
 * @typedef {Object} Inscripcion
 * @property {string} id
 * @property {string} internoId
 * @property {string} cursoId
 * @property {string} fechaInscripcion
 * @property {'activo'|'completado'|'baja'} status
 */

const inscripcionesService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.id === id) || null;
  },

  /**
   * Crea una inscripción validando que el interno no tenga otra activa.
   * @throws {Error} Si el interno ya tiene una inscripción activa.
   */
  create: async (data) => {
    const items = getFromStorage(KEY);

    // ✅ Regla de negocio: inscripción única simultánea
    const inscripcionActiva = items.find(
      (i) => i.internoId === data.internoId && i.status === 'activo'
    );

    if (inscripcionActiva) {
      throw new Error(
        'Este interno ya tiene una inscripción activa. Debe darse de baja antes de inscribirse en otro curso.'
      );
    }

    const newItem = {
      ...data,
      id: generateId(),
      fechaInscripcion: data.fechaInscripcion || new Date().toISOString().split('T')[0],
      status: 'activo',
    };

    saveToStorage(KEY, [...items, newItem]);
    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inscripción no encontrada.');

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);
    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((i) => i.id !== id));
  },

  /** Obtiene la inscripción activa de un interno */
  getActivaByInterno: async (internoId) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.internoId === internoId && i.status === 'activo') || null;
  },

  /** Obtiene todas las inscripciones de un curso */
  getByCurso: async (cursoId) => {
    const items = getFromStorage(KEY);
    return items.filter((i) => i.cursoId === cursoId && i.status === 'activo');
  },
};

export default inscripcionesService;
