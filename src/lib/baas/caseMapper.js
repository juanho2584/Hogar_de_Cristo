/**
 * @fileoverview Conversor bidireccional entre camelCase (React/JS) y snake_case (Postgres/Supabase).
 */

const toSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const toCamelCase = (str) =>
  str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());

/**
 * Convierte las claves de un objeto de camelCase a snake_case para enviar a Postgres.
 * @param {Object} obj
 * @returns {Object}
 */
export const toDatabase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    transformed[toSnakeCase(key)] = value;
  }
  return transformed;
};

/**
 * Convierte las claves de un objeto de snake_case a camelCase para consumir en React.
 * @param {Object} obj
 * @returns {Object}
 */
export const fromDatabase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(fromDatabase);
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    transformed[toCamelCase(key)] = value;
  }
  return transformed;
};
