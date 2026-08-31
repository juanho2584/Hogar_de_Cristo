/**
 * @fileoverview Servicio de Internos — Implementación localStorage (Fase 1).
 * Implementa IDataService<Interno>.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.INTERNOS;

/**
 * @typedef {Object} Interno
 * @property {string} id
 * @property {string} apellidoPaterno
 * @property {string} apellidoMaterno
 * @property {string} nombreCompleto
 * @property {string} dni
 * @property {string} fichaCriminologica
 * @property {string} pabellon
 * @property {string} celda
 * @property {'activo'|'inactivo'|'suspendido'} status
 * @property {string} fechaIngreso - ISO date string
 * @property {string} [notas]
 */

const internosService = {
  /** @returns {Promise<Interno[]>} */
  getAll: async () => getFromStorage(KEY),

  /** @returns {Promise<Interno|null>} */
  getById: async (id) => {
    const items = getFromStorage(KEY);
    return items.find((i) => i.id === id) || null;
  },

  /** @returns {Promise<Interno>} */
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
    return newItem;
  },

  /** @returns {Promise<Interno>} */
  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Interno no encontrado.');

    // Validar DNI único (excluyendo el actual)
    if (data.dni && items.some((i) => i.dni === data.dni && i.id !== id)) {
      throw new Error('Ya existe un interno con ese DNI.');
    }

    const updated = { ...items[index], ...data };
    items[index] = updated;
    saveToStorage(KEY, items);
    return updated;
  },

  /** @returns {Promise<void>} */
  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((i) => i.id !== id));
  },

  /** Buscar por DNI o ficha
   * @param {string} query
   * @returns {Promise<Interno[]>}
   */
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
