/**
 * @fileoverview Servicio de Usuarios del sistema — Implementación localStorage con auditoría.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';
import auditService from './auditService.js';
import { STRONG_PASSWORD_REGEX } from '../../utils/validators.js';

const KEY = STORAGE_KEYS.USUARIOS;

/**
 * Hash SHA-256 para passwords.
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
    return items.map(({ passwordHash: _, ...u }) => u);
  },

  getById: async (id) => {
    const items = getFromStorage(KEY);
    const user = items.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  },

  create: async (data) => {
    const items = getFromStorage(KEY);

    // Validar email único (case-insensitive)
    const emailNorm = data.email.trim().toLowerCase();
    if (items.some((u) => u.email.toLowerCase() === emailNorm)) {
      throw new Error('Ya existe un usuario registrado con ese correo electrónico.');
    }

    // Validar fuerza de contraseña si se crea nuevo
    if (!data.password || !STRONG_PASSWORD_REGEX.test(data.password)) {
      throw new Error('La contraseña no cumple con los requisitos de seguridad: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial.');
    }

    const passwordHash = await hashPassword(data.password);
    const newUser = {
      id: generateId(),
      email: emailNorm,
      nombre: data.nombre.trim(),
      rol: data.rol || 'user',
      status: 'activo',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    saveToStorage(KEY, [...items, newUser]);
    const { passwordHash: _, ...safeUser } = newUser;

    // Registrar en auditoría
    await auditService.registrar({
      accion: 'CREAR',
      entidad: 'Usuarios',
      detalle: `Usuario creado: ${newUser.nombre} (${newUser.email}) con rol [${newUser.rol.toUpperCase()}].`,
      metadata: { userId: newUser.id, email: newUser.email, rol: newUser.rol },
    });

    return safeUser;
  },

  update: async (id, data) => {
    const items = getFromStorage(KEY);
    const index = items.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado.');

    const currentUser = items[index];

    // Si intenta cambiar email, verificar que no esté ocupado
    if (data.email) {
      const emailNorm = data.email.trim().toLowerCase();
      if (items.some((u) => u.email.toLowerCase() === emailNorm && u.id !== id)) {
        throw new Error('Ya existe otro usuario con ese correo electrónico.');
      }
      data.email = emailNorm;
    }

    // Si es el único admin, evitar que se cambie a 'user' o desactive
    if (currentUser.rol === 'admin' && data.rol === 'user') {
      const otrosAdmins = items.filter((u) => u.rol === 'admin' && u.id !== id && u.status === 'activo');
      if (otrosAdmins.length === 0) {
        throw new Error('No podés quitar los privilegios al único administrador activo del sistema.');
      }
    }

    const updated = { ...currentUser, ...data };

    if (data.password) {
      if (!STRONG_PASSWORD_REGEX.test(data.password)) {
        throw new Error('La nueva contraseña debe cumplir con los requisitos de seguridad (8+ caracteres, mayúscula, minúscula, número y símbolo).');
      }
      updated.passwordHash = await hashPassword(data.password);
      delete updated.password;
    }

    items[index] = updated;
    saveToStorage(KEY, items);
    const { passwordHash: _, ...safeUser } = updated;

    // Registrar en auditoría
    await auditService.registrar({
      accion: 'EDITAR',
      entidad: 'Usuarios',
      detalle: `Usuario modificado: ${updated.nombre} (${updated.email}).`,
      metadata: { userId: id, cambios: Object.keys(data) },
    });

    return safeUser;
  },

  delete: async (id) => {
    const items = getFromStorage(KEY);
    const userToDelete = items.find((u) => u.id === id);
    if (!userToDelete) return;

    if (userToDelete.rol === 'admin') {
      const otrosAdmins = items.filter((u) => u.rol === 'admin' && u.id !== id && u.status === 'activo');
      if (otrosAdmins.length === 0) {
        throw new Error('No es posible eliminar al único administrador activo del sistema.');
      }
    }

    saveToStorage(KEY, items.filter((u) => u.id !== id));

    // Registrar en auditoría
    await auditService.registrar({
      accion: 'ELIMINAR',
      entidad: 'Usuarios',
      detalle: `Usuario eliminado: ${userToDelete.nombre} (${userToDelete.email}).`,
      metadata: { userId: id, email: userToDelete.email },
    });
  },

  /**
   * Autentica un usuario por email y contraseña.
   * @returns {Promise<Object|null>}
   */
  authenticate: async (email, password) => {
    const items = getFromStorage(KEY);
    const emailNorm = email.trim().toLowerCase();
    const user = items.find((u) => u.email.toLowerCase() === emailNorm && u.status === 'activo');
    if (!user) return null;

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return null;

    const { passwordHash: _, ...safeUser } = user;

    // Registrar inicio de sesión en auditoría
    await auditService.registrar({
      accion: 'LOGIN',
      entidad: 'Sistema',
      detalle: `Inicio de sesión exitoso: ${safeUser.nombre} (${safeUser.email})`,
      usuario: safeUser,
    });

    return safeUser;
  },
};

export default usuariosService;
