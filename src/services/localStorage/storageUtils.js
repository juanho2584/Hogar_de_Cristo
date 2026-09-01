/**
 * @fileoverview Utilidades genéricas para localStorage.
 * Base reutilizable para todos los servicios de la Fase 1.
 */

/**
 * Genera un UUID v4 simple.
 * @returns {string}
 */
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Obtiene y parsea un array desde localStorage.
 * @param {string} key - Clave de localStorage
 * @returns {Array}
 */
export const getFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Guarda un array en localStorage.
 * @param {string} key - Clave de localStorage
 * @param {Array} data - Datos a guardar
 */
export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

/** Claves de localStorage centralizadas */
export const STORAGE_KEYS = {
  INTERNOS: 'hdd_internos',
  CURSOS: 'hdd_cursos',
  INSCRIPCIONES: 'hdd_inscripciones',
  ASISTENCIA: 'hdd_asistencia',
  USUARIOS: 'hdd_usuarios',
  EVALUACIONES: 'hdd_evaluaciones',
  SEED_LOADED: 'hdd_seed_loaded',
  AUDIT_LOG: 'hdd_audit_log',
};

