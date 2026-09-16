/**
 * @fileoverview Servicio de talleres — Implementación localStorage con auditoría.
 */

import {
  generateId,
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "./storageUtils.js";
import auditService from "./auditService.js";

const KEY = STORAGE_KEYS.TALLERES;

const talleresService = {
  getAll: async () => getFromStorage(KEY),

  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((c) => c.id === id) || null;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    if (
      items.some((c) => c.codigo.toLowerCase() === data.codigo.toLowerCase())
    ) {
      throw new Error("Ya existe un taller con ese código.");
    }

    const newItem = {
      ...data,
      id: generateId(),
      status: data.status || "activo",
    };

    saveToStorage(KEY, [...items, newItem]);

    await auditService.registrar({
      accion: "CREAR",
      entidad: "Talleres",
      detalle: `Taller creado: ${newItem.nombre} (${newItem.codigo})`,
      metadata: { tallerId: newItem.id, codigo: newItem.codigo },
    });

    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Taller no encontrado.");

    if (
      data.codigo &&
      items.some(
        (c) =>
          c.codigo.toLowerCase() === data.codigo.toLowerCase() && c.id !== id,
      )
    ) {
      throw new Error("Ya existe un taller con ese código.");
    }

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);

    await auditService.registrar({
      accion: "EDITAR",
      entidad: "Talleres",
      detalle: `Taller modificado: ${updated.nombre} (${updated.codigo})`,
      metadata: { tallerId: id, campos: Object.keys(data) },
    });

    return updated;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    const curso = items.find((c) => c.id === id);
    if (!curso) return;

    saveToStorage(
      KEY,
      items.filter((c) => c.id !== id),
    );

    await auditService.registrar({
      accion: "ELIMINAR",
      entidad: "Talleres",
      detalle: `Taller eliminado: ${curso.nombre} (${curso.codigo})`,
      metadata: { tallerId: id, codigo: curso.codigo },
    });
  },

  getActivos: async () => {
    const items = getFromStorage(KEY);
    return items.filter((c) => c.status === "activo");
  },
};

export default talleresService;
