/**
 * @fileoverview Logger centralizado de la aplicación.
 * Filtra logs de debug en producción y estandariza salidas de errores sin exponer datos sensibles.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  error: (context, error) => {
    const errorDetails = error?.message || error || 'Error no especificado';
    console.error(`[ERROR][${context}]`, errorDetails);
    
    // Aquí se puede integrar con un servicio de observabilidad externo (ej. Sentry / Datadog)
  },
};

export default logger;
