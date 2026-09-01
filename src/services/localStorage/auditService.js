/**
 * @fileoverview Servicio de Auditoría y Registro de Actividad (Historial de Cambios).
 * Registra qué usuario realiza cada cambio en el sistema para trazabilidad y seguridad.
 */

import { generateId, getFromStorage, saveToStorage, STORAGE_KEYS } from './storageUtils.js';

const KEY = STORAGE_KEYS.AUDIT_LOG;
const MAX_LOGS = 1000; // Mantener hasta 1000 registros históricos

/**
 * Obtiene el usuario en sesión actual desde sessionStorage si existe.
 * @returns {{ id: string, nombre: string, rol: string, email: string }}
 */
const getUsuarioActual = () => {
  try {
    const raw = sessionStorage.getItem('hdd_session');
    if (raw) {
      const u = JSON.parse(raw);
      return {
        id: u.id || 'sistema',
        nombre: u.nombre || 'Usuario del Sistema',
        rol: u.rol || 'docente',
        email: u.email || '',
      };
    }
  } catch {
    // fallback
  }
  return {
    id: 'sistema',
    nombre: 'Sistema / Invitado',
    rol: 'sistema',
    email: 'sistema@hogar.edu',
  };
};

const auditService = {
  /**
   * Obtiene todos los logs ordenados por fecha descendente.
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const logs = getFromStorage(KEY);
    return logs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  /**
   * Registra un nuevo evento de cambio o actividad.
   * @param {{
   *   accion: 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'ASISTENCIA' | 'LOGIN' | 'EXPORTAR' | 'IMPORTAR' | 'EVALUACION',
   *   entidad: 'Internos' | 'Cursos' | 'Inscripciones' | 'Asistencia' | 'Usuarios' | 'Evaluaciones' | 'Sistema',
   *   detalle: string,
   *   usuario?: { id: string, nombre: string, rol: string, email: string },
   *   metadata?: Object
   * }} params
   * @returns {Promise<Object>}
   */
  registrar: async ({ accion, entidad, detalle, usuario, metadata = {} }) => {
    try {
      const logs = getFromStorage(KEY);
      const user = usuario || getUsuarioActual();

      const newLog = {
        id: generateId(),
        fecha: new Date().toISOString(),
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        usuarioRol: user.rol,
        usuarioEmail: user.email,
        accion: accion || 'MODIFICACION',
        entidad: entidad || 'General',
        detalle: detalle || 'Acción efectuada',
        metadata,
      };

      // Limitar a MAX_LOGS más recientes
      const updated = [newLog, ...logs].slice(0, MAX_LOGS);
      saveToStorage(KEY, updated);
      return newLog;
    } catch (err) {
      console.warn('Error al registrar auditoría:', err);
      return null;
    }
  },

  /**
   * Filtra registros según criterios
   * @param {{ busqueda?: string, entidad?: string, accion?: string, fechaDesde?: string, fechaHasta?: string }} filtros
   */
  filtrar: async (filtros = {}) => {
    const logs = await auditService.getAll();
    return logs.filter((log) => {
      if (filtros.entidad && filtros.entidad !== 'todas' && log.entidad !== filtros.entidad) {
        return false;
      }
      if (filtros.accion && filtros.accion !== 'todas' && log.accion !== filtros.accion) {
        return false;
      }
      if (filtros.fechaDesde && log.fecha.split('T')[0] < filtros.fechaDesde) {
        return false;
      }
      if (filtros.fechaHasta && log.fecha.split('T')[0] > filtros.fechaHasta) {
        return false;
      }
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        const texto = `${log.usuarioNombre} ${log.usuarioEmail} ${log.detalle} ${log.entidad} ${log.accion}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  },

  /**
   * Limpia el registro de auditoría (solo accesible a administradores)
   */
  limpiar: async () => {
    saveToStorage(KEY, []);
    await auditService.registrar({
      accion: 'ELIMINAR',
      entidad: 'Sistema',
      detalle: 'El historial de auditoría fue vaciado por un administrador.',
    });
  },
};

export default auditService;
