/**
 * @fileoverview Utilidades de cálculo de asistencia y detección de alertas.
 */

import { ACADEMIC_CONFIG } from '../config/academicConfig.js';

/**
 * Calcula el porcentaje de presentismo de un interno en un curso.
 * @param {Array} registros - Array de RegistroAsistencia
 * @returns {Object} { total, presentes, ausentes, tarde, justificado, porcentaje }
 */
export const calcularPresentismo = (registros) => {
  const total = registros.length;
  if (total === 0) return { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificado: 0, porcentaje: 0 };

  const presentes = registros.filter((r) => r.estado === 'presente').length;
  const ausentes = registros.filter((r) => r.estado === 'ausente').length;
  const tarde = registros.filter((r) => r.estado === 'tarde').length;
  const justificado = registros.filter((r) => r.estado === 'justificado').length;

  // Presentes + tardanzas cuentan como asistencia efectiva
  const efectivos = presentes + tarde;
  const porcentaje = Math.round((efectivos / total) * 100);

  return { total, presentes, ausentes, tarde, justificado, porcentaje };
};

/**
 * Detecta si un array de registros contiene una racha de N faltas consecutivas.
 * Los registros deben estar ordenados por fecha ascendente.
 * 
 * @param {Array} registros - Ordenados por fecha ASC
 * @param {number} [umbral] - Cantidad de faltas para activar alerta
 * @returns {{ tieneAlerta: boolean, rachaInicio: string|null, rachaCount: number }}
 */
export const detectarFaltasConsecutivas = (registros, umbral = ACADEMIC_CONFIG.maxFaltasConsecutivas) => {
  let rachaActual = 0;
  let rachaInicio = null;
  let maxRacha = 0;
  let maxRachaInicio = null;

  for (const registro of registros) {
    if (registro.estado === 'ausente') {
      rachaActual++;
      if (rachaActual === 1) rachaInicio = registro.fecha;
      if (rachaActual > maxRacha) {
        maxRacha = rachaActual;
        maxRachaInicio = rachaInicio;
      }
    } else {
      // Cualquier estado que no sea ausente corta la racha
      rachaActual = 0;
      rachaInicio = null;
    }
  }

  // Solo alertamos si la racha ACTUAL (al final de los registros) llega al umbral
  return {
    tieneAlerta: rachaActual >= umbral,
    rachaActual,
    rachaInicio,
    maxRacha,
    maxRachaInicio,
  };
};

/**
 * Genera las alertas de 5 faltas para todos los internos de un curso.
 * 
 * @param {Object} params
 * @param {Array} params.internos - Lista de internos del curso
 * @param {Array} params.asistencias - Todos los registros del curso
 * @param {string} params.cursoId
 * @param {string} params.cursoNombre
 * @returns {Array} Alertas activas
 */
export const generarAlertas = ({ internos, asistencias, cursoId, cursoNombre }) => {
  const alertas = [];

  for (const interno of internos) {
    const registrosInterno = asistencias
      .filter((a) => a.internoId === interno.id && a.cursoId === cursoId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const { tieneAlerta, rachaActual, rachaInicio } = detectarFaltasConsecutivas(registrosInterno);

    if (tieneAlerta) {
      alertas.push({
        internoId: interno.id,
        nombreInterno: `${interno.apellidoPaterno} ${interno.apellidoMaterno}, ${interno.nombreCompleto}`,
        pabellon: interno.pabellon,
        celda: interno.celda,
        cursoId,
        cursoNombre,
        faltasConsecutivas: rachaActual,
        fechaInicioRacha: rachaInicio,
      });
    }
  }

  return alertas;
};

/**
 * Retorna el color de Bootstrap según el porcentaje de presentismo.
 * @param {number} porcentaje
 * @returns {string} clase CSS de Bootstrap
 */
export const getColorPresentismo = (porcentaje) => {
  if (porcentaje >= 75) return 'success';
  if (porcentaje >= 50) return 'warning';
  return 'danger';
};
