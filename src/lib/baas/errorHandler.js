/**
 * @fileoverview Wrapper de errores para Supabase / PostgreSQL / GoTrue.
 * Traduce excepciones técnicas a mensajes semánticos y seguros para el usuario.
 */

import logger from '../logger/logger.js';

/**
 * Mapea códigos de error conocidos de Postgres/Supabase a mensajes en español.
 * @param {Object} error - Error retornado por Supabase
 * @param {string} fallbackMessage - Mensaje por defecto
 * @returns {string} Mensaje traducido y sanitizado
 */
export const formatErrorMessage = (error, fallbackMessage = 'Ocurrió un error inesperado.') => {
  if (!error) return fallbackMessage;

  const code = error.code || error.status;
  const rawMessage = (error.message || '').toLowerCase();

  // Errores de Autenticación (GoTrue)
  if (rawMessage.includes('invalid login credentials') || rawMessage.includes('invalid_grant')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (rawMessage.includes('user not found')) {
    return 'No existe una cuenta registrada con este correo.';
  }
  if (rawMessage.includes('user already registered') || rawMessage.includes('already exists')) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }
  if (rawMessage.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (rawMessage.includes('email rate limit exceeded')) {
    return 'Límite de solicitudes de correo excedido. Intentá nuevamente en unos minutos.';
  }

  // Errores de Postgres / RLS
  switch (code) {
    case '23505': // Unique violation
      if (rawMessage.includes('unique_active_enrollment_per_intern')) {
        return 'El interno ya cuenta con una inscripción activa en otro taller simultáneo.';
      }
      if (rawMessage.includes('unique_daily_attendance')) {
        return 'Ya se registró la asistencia para este interno en la fecha seleccionada.';
      }
      if (rawMessage.includes('dni')) {
        return 'Ya existe un interno registrado con este número de DNI.';
      }
      if (rawMessage.includes('ficha_criminologica')) {
        return 'Ya existe un interno con este número de ficha criminológica.';
      }
      if (rawMessage.includes('codigo')) {
        return 'Ya existe un taller con este código identificador.';
      }
      return 'Ya existe un registro con estos datos únicos.';

    case '23503': // Foreign key violation
      return 'No se puede completar la operación porque el registro está vinculado a otros datos.';

    case '42501': // Insufficient privilege / RLS policy violation
      return 'No tenés permisos suficientes para realizar esta acción (Seguridad RLS).';

    case 'PGRST116': // Row not found
      return 'El registro solicitado no fue encontrado.';

    default:
      return error.message || fallbackMessage;
  }
};

/**
 * Wrapper de ejecución asincrónica para llamadas a la API/BaaS con captura segura de errores.
 * @template T
 * @param {() => Promise<{ data: T, error: any }>} asyncAction
 * @param {string} contextName
 * @returns {Promise<{ data: T|null, error: string|null, success: boolean }>}
 */
export const executeBaaS = async (asyncAction, contextName = 'Operación BaaS') => {
  try {
    const { data, error } = await asyncAction();
    if (error) {
      logger.error(contextName, error);
      return {
        data: null,
        error: formatErrorMessage(error),
        success: false,
      };
    }
    return {
      data,
      error: null,
      success: true,
    };
  } catch (err) {
    logger.error(contextName, err);
    return {
      data: null,
      error: formatErrorMessage(err, 'Error de conexión con el servidor.'),
      success: false,
    };
  }
};
