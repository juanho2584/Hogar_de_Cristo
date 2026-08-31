/**
 * @fileoverview Servicio de Usuarios del sistema — Implementación localStorage.
 * Nota: En Fase 2 reemplazar por supabase.auth
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.USUARIOS;

/**
 * Hash SHA-256 simple para passwords (solo Fase 1 / demo).
 * En producción usar Supabase Auth o similar.
 * @param {string} str
 * @returns {Promise<string>}
 */
export const hashPassword = async (str) => {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const usuariosService = {
  getAll: async () => {
    const items = getFromStorage(KEY);
    // Nunca devolver el hash de contraseña en listados
    return items.map(({ passwordHash, ...u }) => u);
  },

  getById: async (id) => {
    const items = getFromStorage(KEY);
    const user = items.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    if (items.some((u) => u.email === data.email)) {
      throw new Error('Ya existe un usuario con ese email.');
    }

    const passwordHash = await hashPassword(data.password);
    const newUser = {
      id: generateId(),
      email: data.email,
      nombre: data.nombre,
      rol: data.rol || 'user',
      status: 'activo',
      passwordHash,
    };

    saveToStorage(KEY, [...items, newUser]);
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado.');

    const updated = { ...items[index], ...data };
    if (data.password) {
      updated.passwordHash = await hashPassword(data.password);
      delete updated.password;
    }

    items[index] = updated;
    saveToStorage(KEY, items);
    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    saveToStorage(KEY, items.filter((u) => u.id !== id));
  },

  /**
   * Autentica un usuario por email y contraseña.
   * @returns {Promise<Object|null>} Usuario autenticado o null
   */
  authenticate: async (email, password) => {
    const items = getFromStorage(KEY);
    const user = items.find((u) => u.email === email && u.status === 'activo');
    if (!user) return null;

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return null;

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
};

export default usuariosService;
