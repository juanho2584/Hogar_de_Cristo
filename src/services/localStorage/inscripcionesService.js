/**
 * @fileoverview Servicio de Inscripciones — Implementación localStorage con auditoría.
 * Aplica la regla de negocio: un interno solo puede tener 1 inscripción activa.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';

const KEY = STORAGE_KEYS.INSCRIPCIONES;

const inscripcionesService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    // Regla de negocio: inscripción única simultánea
    const inscripcionActiva = items.find(
      (i) => i.internoId === data.internoId && i.status === 'activo'
    );

    if (inscripcionActiva) {
      throw new Error(
        'Este interno ya tiene una inscripción activa. Debe darse de baja o completar el curso antes de inscribirse en otro.'
      );
    }

    const newItem = {
      ...data,
      id: generateId(),
      fechaInscripcion: data.fechaInscripcion || new Date().toISOString().split('T')[0],
      status: 'activo',
    };

    saveToStorage(KEY, [...items, newItem]);

    await auditService.registrar({
      accion: 'CREAR',
      entidad: 'Inscripciones',
      detalle: `Inscripción registrada para interno ID [${newItem.internoId}] en curso ID [${newItem.cursoId}]`,
      metadata: { inscripcionId: newItem.id, internoId: newItem.internoId, cursoId: newItem.cursoId },
    });

    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inscripción no encontrada.');

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: 'EDITAR',
      entidad: 'Inscripciones',
      detalle: `Inscripción modificada (Estado: ${updated.status})`,
      metadata: { inscripcionId: id, status: updated.status },
    });

    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    const item = items.find((i) => i.id === id);
    if (!item) return;

    saveToStorage(KEY, items.filter((i) => i.id !== id));

    await auditService.registrar({
      accion: 'ELIMINAR',
      entidad: 'Inscripciones',
      detalle: `Inscripción cancelada/eliminada ID [${id}]`,
      metadata: { inscripcionId: id },
    });
  },

  getActivaByInterno: async (internoId) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.internoId === internoId && i.status === 'activo') || null;
  },

  getByCurso: async (cursoId) => {
    const items = getFromStorage(KEY);
    return items.filter((i) => i.cursoId === cursoId && i.status === 'activo');
  },
};

export default inscripcionesService;
