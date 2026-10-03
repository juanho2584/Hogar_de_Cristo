/**
 * @fileoverview Utilidad de sanitización de inputs y strings con DOMPurify.
 * Previene vulnerabilidades OWASP de Cross-Site Scripting (XSS).
 */

import DOMPurify from 'dompurify';

/**
 * Sanitiza una cadena eliminando cualquier script o tag potencialmente malicioso.
 * @param {string} value - Texto a sanitizar
 * @returns {string} Texto limpio
 */
export const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // Sin HTML permitido para campos estándar
    ALLOWED_ATTR: [],
  }).trim();
};

/**
 * Sanitiza un objeto completo de formulario recursivamente.
 * @param {Object} data - Objeto con valores de formulario
 * @returns {Object} Objeto con strings sanitizados
 */
export const sanitizeFormData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeFormData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
