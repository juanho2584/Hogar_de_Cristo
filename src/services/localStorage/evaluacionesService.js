/**
 * @fileoverview Servicio de Evaluaciones docentes — Implementación localStorage.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.EVALUACIONES;

/**
 * @typedef {Object} EvaluacionDocente
 * @property {string} id
 * @property {string} internoId
 * @property {string} cursoId
 * @property {string} concepto - Texto libre del docente
 * @property {number} [calificacion] - 1-10
 * @property {string} periodo - Ej: '1er Cuatrimestre 2025'
 * @property {string} creadoPor - userId
 * @property {string} actualizadoEn - ISO timestamp
 */

const evaluacionesService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((e) => e.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);
    const newItem = {
      ...data,
      id: generateId(),
      actualizadoEn: new Date().toISOString(),
    };
    saveToStorage(KEY, [...items, newItem]);
    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Evaluación no encontrada.');

    const updated = { ...items[index], ...data, actualizadoEn: new Date().toISOString() };
    items[index] = updated;
    saveToStorage(KEY, items);
    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((e) => e.id !== id));
  },

  getByInternoYCurso: async (internoId, cursoId) => {
    const items = getFromStorage(KEY);
    return items.filter((e) => e.internoId === internoId && e.cursoId === cursoId);
  },

  getByCurso: async (cursoId) => {
    const items = getFromStorage(KEY);
    return items.filter((e) => e.cursoId === cursoId);
  },
};

export default evaluacionesService;
