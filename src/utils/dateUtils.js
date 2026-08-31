/**
 * @fileoverview Utilidades de fechas y calendario académico.
 */

import { DIAS_INDEX, ACADEMIC_CONFIG } from '../config/academicConfig.js';

/**
 * Verifica si una fecha es un día lectivo según la configuración.
 * @param {Date|string} fecha
 * @returns {boolean}
 */
export const esDiaLectivo = (fecha) => {
  const d = typeof fecha === 'string' ? new Date(fecha + 'T12:00:00') : fecha;
  const diaSemana = d.getDay(); // 0=Dom, 1=Lun, ...

  const diasHabilitados = ACADEMIC_CONFIG.diasLectivos.map((dia) => DIAS_INDEX[dia]);
  return diasHabilitados.includes(diaSemana);
};

/**
 * Formatea una fecha ISO a formato legible en español.
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @returns {string} - 'Lunes, 30 de agosto de 2025'
 */
export const formatearFechaLarga = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formatea fecha ISO a formato corto dd/mm/aaaa.
 * @param {string} isoDate
 * @returns {string}
 */
export const formatearFechaCorta = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Devuelve la fecha de hoy en formato ISO YYYY-MM-DD.
 * @returns {string}
 */
export const hoyISO = () => new Date().toISOString().split('T')[0];

/**
 * Genera un array de fechas lectivas entre dos fechas.
 * @param {string} desde - ISO date
 * @param {string} hasta - ISO date
 * @returns {string[]} Array de ISO dates
 */
export const getFechasLectivas = (desde, hasta) => {
  const fechas = [];
  const current = new Date(desde + 'T12:00:00');
  const end = new Date(hasta + 'T12:00:00');

  while (current <= end) {
    const iso = current.toISOString().split('T')[0];
    if (esDiaLectivo(iso)) {
      fechas.push(iso);
    }
    current.setDate(current.getDate() + 1);
  }

  return fechas;
};

/**
 * Retorna el nombre del día de la semana en español para una fecha ISO.
 * @param {string} isoDate
 * @returns {string}
 */
export const getNombreDia = (isoDate) => {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long' });
};

/**
 * Devuelve los últimos N días lectivos desde hoy.
 * @param {number} n
 * @returns {string[]}
 */
export const getUltimosDiasLectivos = (n = 30) => {
  const hoy = new Date();
  const fechas = [];
  const current = new Date(hoy);

  while (fechas.length < n) {
    const iso = current.toISOString().split('T')[0];
    if (esDiaLectivo(iso)) {
      fechas.unshift(iso);
    }
    current.setDate(current.getDate() - 1);
  }

  return fechas;
};
