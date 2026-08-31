/**
 * @fileoverview Servicio de Cursos — Implementación localStorage (Fase 1).
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.CURSOS;

/**
 * @typedef {Object} Curso
 * @property {string} id
 * @property {string} nombre
 * @property {string} codigo
 * @property {string} [descripcion]
 * @property {string} docenteId
 * @property {string[]} diasCursada
 * @property {string} fechaInicio
 * @property {string} fechaFin
 * @property {'activo'|'finalizado'|'cancelado'} status
 */

const cursosService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((c) => c.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    if (items.some((c) => c.codigo === data.codigo)) {
      throw new Error('Ya existe un curso con ese código.');
    }

    const newItem = {
      ...data,
      id: generateId(),
      status: data.status || 'activo',
    };

    saveToStorage(KEY, [...items, newItem]);
    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Curso no encontrado.');

    if (data.codigo && items.some((c) => c.codigo === data.codigo && c.id !== id)) {
      throw new Error('Ya existe un curso con ese código.');
    }

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);
    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((c) => c.id !== id));
  },

  getActivos: async () => {
    const items = getFromStorage(KEY);
    return items.filter((c) => c.status === 'activo');
  },
};

export default cursosService;
