/**
 * @fileoverview Servicio de Internos — Implementación localStorage con auditoría.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';

const KEY = STORAGE_KEYS.INTERNOS;

const internosService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    // Validar DNI único
    if (items.some((i) => i.dni === data.dni)) {
      throw new Error('Ya existe un interno con ese DNI.');
    }

    // Validar ficha única
    if (items.some((i) => i.fichaCriminologica === data.fichaCriminologica)) {
      throw new Error('Ya existe un interno con esa Ficha Criminológica.');
    }

    const newItem = {
      ...data,
      id: generateId(),
      fechaIngreso: data.fechaIngreso || new Date().toISOString().split('T')[0],
      status: data.status || 'activo',
    };

    saveToStorage(KEY, [...items, newItem]);

    await auditService.registrar({
      accion: 'CREAR',
      entidad: 'Internos',
      detalle: `Alta de interno: ${newItem.apellidoPaterno} ${newItem.nombreCompleto} (DNI: ${newItem.dni}, Ficha: ${newItem.fichaCriminologica})`,
      metadata: { internoId: newItem.id, dni: newItem.dni },
    });

    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Interno no encontrado.');

    if (data.dni && items.some((i) => i.dni === data.dni && i.id !== id)) {
      throw new Error('Ya existe un interno con ese DNI.');
    }

    if (data.fichaCriminologica && items.some((i) => i.fichaCriminologica === data.fichaCriminologica && i.id !== id)) {
      throw new Error('Ya existe un interno con esa Ficha Criminológica.');
    }

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: 'EDITAR',
      entidad: 'Internos',
      detalle: `Actualización de interno: ${updated.apellidoPaterno} ${updated.nombreCompleto} (DNI: ${updated.dni})`,
      metadata: { internoId: id, campos: Object.keys(data) },
    });

    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    const interno = items.find((i) => i.id === id);
    if (!interno) return;

    saveToStorage(KEY, items.filter((i) => i.id !== id));

    await auditService.registrar({
      accion: 'ELIMINAR',
      entidad: 'Internos',
      detalle: `Baja de interno: ${interno.apellidoPaterno} ${interno.nombreCompleto} (DNI: ${interno.dni})`,
      metadata: { internoId: id, dni: interno.dni },
    });
  },

  search: async (query) => {
    const items = getFromStorage(KEY);
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.dni?.toLowerCase().includes(q) ||
        i.fichaCriminologica?.toLowerCase().includes(q) ||
        i.nombreCompleto?.toLowerCase().includes(q) ||
        i.apellidoPaterno?.toLowerCase().includes(q) ||
        i.apellidoMaterno?.toLowerCase().includes(q)
    );
  },
};

export default internosService;
