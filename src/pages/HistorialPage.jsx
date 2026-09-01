/**
 * @fileoverview HistorialPage — Vista de auditoría y registro de actividad de usuarios en el sistema.
 */

import { useEffect, useState } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  Filter,
  Clock,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useAuditStore from '../store/auditStore.js';
import useAuthStore from '../store/authStore.js';
import { exportToCsv } from '../services/csv/csvService.js';

const ACCION_BADGES = {
  CREAR: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Alta / Crear' },
  EDITAR: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'Modificación' },
  ELIMINAR: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Eliminación' },
  ASISTENCIA: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Asistencia' },
  LOGIN: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', label: 'Inicio Sesión' },
  EVALUACION: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', label: 'Evaluación' },
  EXPORTAR: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', label: 'Exportación' },
};

const HistorialPage = () => {
  const { logs, fetchLogs, filtros, setFiltros, resetFiltros, limpiarLogs, loading } = useAuditStore();
  const { esAdmin } = useAuthStore();

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda || '');

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFiltros({ busqueda: busquedaLocal });
  };

  const handleLimpiarFiltros = () => {
    setBusquedaLocal('');
    resetFiltros();
  };

  const handleExportarLogs = () => {
    if (logs.length === 0) {
      toast.error('No hay registros de auditoría para exportar.');
      return;
    }
    const exportData = logs.map((l) => ({
      Fecha: new Date(l.fecha).toLocaleString(),
      Usuario: l.usuarioNombre,
      Email: l.usuarioEmail,
      Rol: l.usuarioRol,
      Accion: l.accion,
      Entidad: l.entidad,
      Detalle: l.detalle,
    }));
    exportToCsv(exportData, `auditoria_hogar_de_dios_${new Date().toISOString().split('T')[0]}.csv`, [
      'Fecha',
      'Usuario',
      'Email',
      'Rol',
      'Accion',
      'Entidad',
      'Detalle',
    ]);
    toast.success('Historial de auditoría exportado en CSV.');
  };

  const handleVaciarHistorial = async () => {
    if (!esAdmin()) {
      toast.error('Solo los administradores pueden vaciar el registro de auditoría.');
      return;
    }
    if (
      window.confirm(
        '¿Estás seguro de que deseas vaciar el historial de auditoría? Esta acción dejará constancia del vaciado.'
      )
    ) {
      const res = await limpiarLogs();
      if (res.ok) {
        toast.success('Historial vaciado correctamente.');
      } else {
        toast.error(res.error);
      }
    }
  };

  const formatearFechaHora = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <MainLayout
      titulo="Historial de Auditoría"
      subtitulo="Trazabilidad completa de operaciones y modificaciones por usuario"
    >
      {/* Resumen & Toolbar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-8 col-xl-9">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span
              className="badge px-3 py-2 d-inline-flex align-items-center gap-2"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              <Activity size={15} style={{ color: 'var(--primary-accent)' }} />
              Total eventos registrados: <strong>{logs.length}</strong>
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4 col-xl-3 d-flex justify-content-start justify-content-md-end gap-2">
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
            }}
            onClick={handleExportarLogs}
          >
            <Download size={15} /> Exportar CSV
          </button>

          {esAdmin() && (
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger-color)',
              }}
              onClick={handleVaciarHistorial}
              title="Vaciar historial (solo admin)"
            >
              <Trash2 size={15} /> Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Tarjeta de Filtros */}
      <div
        className="app-card p-3 p-md-4 mb-4 rounded-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-3">
            {/* Buscador de texto libre */}
            <div className="col-12 col-md-4">
              <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Buscar en auditoría
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Usuario, acción, interno, DNI..."
                  value={busquedaLocal}
                  onChange={(e) => setBusquedaLocal(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por Entidad */}
            <div className="col-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Módulo / Entidad
              </label>
              <select
                className="form-select"
                value={filtros.entidad}
                onChange={(e) => setFiltros({ entidad: e.target.value })}
              >
                <option value="todas">Todas las entidades</option>
                <option value="Internos">Internos</option>
                <option value="Cursos">Cursos</option>
                <option value="Inscripciones">Inscripciones</option>
                <option value="Asistencia">Asistencia</option>
                <option value="Usuarios">Usuarios</option>
                <option value="Evaluaciones">Evaluaciones</option>
                <option value="Sistema">Sistema</option>
              </select>
            </div>

            {/* Filtro por Acción */}
            <div className="col-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tipo de Acción
              </label>
              <select
                className="form-select"
                value={filtros.accion}
                onChange={(e) => setFiltros({ accion: e.target.value })}
              >
                <option value="todas">Todas las acciones</option>
                <option value="CREAR">Alta / Crear</option>
                <option value="EDITAR">Modificación</option>
                <option value="ELIMINAR">Eliminación</option>
                <option value="ASISTENCIA">Asistencia</option>
                <option value="LOGIN">Inicio de Sesión</option>
                <option value="EVALUACION">Evaluación</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div className="col-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Fecha Desde
              </label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde || ''}
                onChange={(e) => setFiltros({ fechaDesde: e.target.value })}
              />
            </div>

            {/* Fecha Hasta */}
            <div className="col-6 col-md-2">
              <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Fecha Hasta
              </label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta || ''}
                onChange={(e) => setFiltros({ fechaHasta: e.target.value })}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="btn btn-sm"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Limpiar Filtros
            </button>
            <button
              type="submit"
              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold px-3"
              style={{
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Filter size={14} /> Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Logs de Auditoría */}
      <div
        className="app-card rounded-4 overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary-accent)' }} />
            <p className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
              Cargando historial de auditoría...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <History size={48} className="mb-3 opacity-50" />
            <h3 className="h6 text-white mb-1">Sin registros de auditoría</h3>
            <p style={{ fontSize: '0.85rem' }}>
              No se encontraron acciones registradas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead
                style={{
                  background: 'var(--bg-input)',
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <tr>
                  <th className="py-3 ps-4" style={{ color: 'var(--text-muted)' }}>
                    Fecha y Hora
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Usuario Responsable
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Operación
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Módulo
                  </th>
                  <th className="py-3 pe-4" style={{ color: 'var(--text-muted)' }}>
                    Detalle del Cambio
                  </th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.86rem' }}>
                {logs.map((log) => {
                  const badgeInfo = ACCION_BADGES[log.accion] || {
                    bg: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    label: log.accion,
                  };
                  return (
                    <tr key={log.id} style={{ borderColor: 'var(--border-subtle)' }}>
                      {/* Fecha */}
                      <td className="py-3 ps-4 text-nowrap">
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span className="font-monospace" style={{ fontSize: '0.82rem' }}>
                            {formatearFechaHora(log.fecha)}
                          </span>
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: 28,
                              height: 28,
                              background: 'var(--primary-gradient)',
                              color: 'white',
                              fontSize: '0.72rem',
                              flexShrink: 0,
                            }}
                          >
                            {log.usuarioNombre?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="fw-semibold text-truncate" style={{ maxWidth: 180 }}>
                              {log.usuarioNombre}
                            </div>
                            <div
                              className="text-muted font-monospace"
                              style={{ fontSize: '0.72rem' }}
                            >
                              {log.usuarioEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Acción */}
                      <td className="py-3">
                        <span
                          className="badge"
                          style={{
                            background: badgeInfo.bg,
                            color: badgeInfo.color,
                            border: `1px solid ${badgeInfo.color}40`,
                            fontSize: '0.75rem',
                          }}
                        >
                          {badgeInfo.label}
                        </span>
                      </td>

                      {/* Entidad */}
                      <td className="py-3">
                        <span
                          className="badge"
                          style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {log.entidad}
                        </span>
                      </td>

                      {/* Detalle */}
                      <td className="py-3 pe-4">
                        <div style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>
                          {log.detalle}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HistorialPage;
