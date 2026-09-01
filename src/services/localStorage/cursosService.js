/**
 * @fileoverview Servicio de Cursos — Implementación localStorage con auditoría.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';

const KEY = STORAGE_KEYS.CURSOS;

const cursosService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((c) => c.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    if (items.some((c) => c.codigo.toLowerCase() === data.codigo.toLowerCase())) {
      throw new Error('Ya existe un curso con ese código.');
    }

    const newItem = {
      ...data,
      id: generateId(),
      status: data.status || 'activo',
    };

    saveToStorage(KEY, [...items, newItem]);

    await auditService.registrar({
      accion: 'CREAR',
      entidad: 'Cursos',
      detalle: `Curso creado: ${newItem.nombre} (${newItem.codigo})`,
      metadata: { cursoId: newItem.id, codigo: newItem.codigo },
    });

    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Curso no encontrado.');

    if (data.codigo && items.some((c) => c.codigo.toLowerCase() === data.codigo.toLowerCase() && c.id !== id)) {
      throw new Error('Ya existe un curso con ese código.');
    }

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: 'EDITAR',
      entidad: 'Cursos',
      detalle: `Curso modificado: ${updated.nombre} (${updated.codigo})`,
      metadata: { cursoId: id, campos: Object.keys(data) },
    });

    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    const curso = items.find((c) => c.id === id);
    if (!curso) return;

    saveToStorage(KEY, items.filter((c) => c.id !== id));

    await auditService.registrar({
      accion: 'ELIMINAR',
      entidad: 'Cursos',
      detalle: `Curso eliminado: ${curso.nombre} (${curso.codigo})`,
      metadata: { cursoId: id, codigo: curso.codigo },
    });
  },

  getActivos: async () => {
    const items = getFromStorage(KEY);
    return items.filter((c) => c.status === 'activo');
  },
};

export default cursosService;
