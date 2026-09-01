/**
 * @fileoverview Servicio de Evaluaciones docentes — Implementación localStorage con auditoría.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';

const KEY = STORAGE_KEYS.EVALUACIONES;

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

    await auditService.registrar({
      accion: 'EVALUACION',
      entidad: 'Evaluaciones',
      detalle: `Evaluación registrada para Interno ID [${newItem.internoId}] en Período ${newItem.periodo}`,
      metadata: { evaluacionId: newItem.id, internoId: newItem.internoId, cursoId: newItem.cursoId },
    });

    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Evaluación no encontrada.');

    const updated = { ...items[index], ...data, actualizadoEn: new Date().toISOString() };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: 'EDITAR',
      entidad: 'Evaluaciones',
      detalle: `Evaluación actualizada para Interno ID [${updated.internoId}]`,
      metadata: { evaluacionId: id },
    });

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
