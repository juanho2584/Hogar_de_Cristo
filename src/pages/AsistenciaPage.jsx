/**
 * @fileoverview AsistenciaPage — Planilla de asistencia diaria por curso responsiva.
 */

import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Clock,
  FileCheck,
  Download,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useInternosStore from '../store/internosStore.js';
import useCursosStore from '../store/cursosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useAuthStore from '../store/authStore.js';
import usePermisos from '../hooks/usePermisos.js';
import { hoyISO, esDiaLectivo, formatearFechaLarga } from '../utils/dateUtils.js';
import { calcularPresentismo } from '../utils/asistenciaUtils.js';
import { exportToCsv, CSV_CONFIG } from '../services/csv/csvService.js';

const ESTADOS = [
  { value: 'presente', label: 'Presente', short: 'P', icon: Check, color: '#10b981' },
  { value: 'ausente', label: 'Ausente', short: 'A', icon: X, color: '#ef4444' },
  { value: 'tarde', label: 'Tarde', short: 'T', icon: Clock, color: '#f59e0b' },
  { value: 'justificado', label: 'Justif.', short: 'J', icon: FileCheck, color: '#06b6d4' },
];

const AsistenciaPage = () => {
  const { asistencias, fetchAsistencias, registrarPlanilla } = useAsistenciaStore();
  const { internos, fetchInternos } = useInternosStore();
  const { cursos, fetchCursos } = useCursosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { usuario } = useAuthStore();
  const { puedeEditarAsistenciaPasada } = usePermisos();

  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO());
  const [planilla, setPlanilla] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchAsistencias();
    fetchInternos();
    fetchCursos();
    fetchInscripciones();
  }, []);

  // Auto-seleccionar primer curso activo si no hay seleccionado
  useEffect(() => {
    if (!cursoSeleccionado && cursos.length > 0) {
      const activo = cursos.find((c) => c.status === 'activo') || cursos[0];
      if (activo) setCursoSeleccionado(activo.id);
    }
  }, [cursos, cursoSeleccionado]);

  // Cargar registros existentes al cambiar curso o fecha
  useEffect(() => {
    if (!cursoSeleccionado) return;
    const registrosExistentes = asistencias.filter(
      (a) => a.cursoId === cursoSeleccionado && a.fecha === fechaSeleccionada
    );
    const mapa = {};
    registrosExistentes.forEach((r) => {
      mapa[r.internoId] = r.estado;
    });
    setPlanilla(mapa);
  }, [cursoSeleccionado, fechaSeleccionada, asistencias]);

  const esDiaHabilitado = esDiaLectivo(fechaSeleccionada);

  const cambiarDia = (delta) => {
    const d = new Date(fechaSeleccionada + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setFechaSeleccionada(d.toISOString().split('T')[0]);
  };

  const internosCurso = inscripciones
    .filter((i) => i.cursoId === cursoSeleccionado && i.status === 'activo')
    .map((i) => internos.find((int) => int.id === i.internoId))
    .filter(Boolean)
    .sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno));

  const cambiarEstado = (internoId, estado) => {
    setPlanilla((prev) => ({ ...prev, [internoId]: estado }));
  };

  const marcarTodos = (estado) => {
    const nuevo = {};
    internosCurso.forEach((i) => {
      nuevo[i.id] = estado;
    });
    setPlanilla(nuevo);
  };

  const guardarPlanilla = async () => {
    if (!cursoSeleccionado) return toast.error('Seleccioná un curso primero.');
    if (!esDiaHabilitado && !puedeEditarAsistenciaPasada) {
      return toast.error('No es un día lectivo. Solo ADMIN puede registrar asistencia en días no lectivos.');
    }

    setGuardando(true);
    const registros = internosCurso.map((interno) => ({
      internoId: interno.id,
      cursoId: cursoSeleccionado,
      fecha: fechaSeleccionada,
      estado: planilla[interno.id] || 'ausente',
      notas: '',
      registradoPor: usuario?.id || 'sistema',
    }));

    const result = await registrarPlanilla(registros, cursoSeleccionado, fechaSeleccionada);
    setGuardando(false);

    if (result.ok) {
      toast.success(`Asistencia guardada para ${registros.length} internos.`);
    } else {
      toast.error(result.error);
    }
  };

  // Asistencias del curso para calcular presentismo
  const asistenciasCurso = asistencias.filter((a) => a.cursoId === cursoSeleccionado);
  const { porcentaje: presentismoCurso } = calcularPresentismo(asistenciasCurso);

  const conteoHoy = {
    presente: Object.values(planilla).filter((v) => v === 'presente').length,
    ausente: Object.values(planilla).filter((v) => v === 'ausente').length,
    tarde: Object.values(planilla).filter((v) => v === 'tarde').length,
    justificado: Object.values(planilla).filter((v) => v === 'justificado').length,
  };

  const handleExportar = () => {
    const curso = cursos.find((c) => c.id === cursoSeleccionado);
    const dataExport = asistenciasCurso.map((a) => {
      const int = internos.find((i) => i.id === a.internoId);
      return {
        fecha: a.fecha,
        curso: curso?.nombre || a.cursoId,
        interno: int ? `${int.apellidoPaterno} ${int.nombreCompleto}` : a.internoId,
        dni: int?.dni || '',
        estado: a.estado,
      };
    });
    exportToCsv(
      dataExport,
      `asistencia_${curso?.codigo || 'curso'}_${fechaSeleccionada}.csv`,
      CSV_CONFIG.asistencia.fields
    );
    toast.success('CSV exportado.');
  };

  return (
    <MainLayout
      titulo="Control de Asistencia"
      subtitulo="Planilla diaria por materia y registro de presentismo institucional"
    >
      {/* Selector de Curso y Fecha Responsivo */}
      <div className="row g-3 mb-4">
        {/* Selector de curso */}
        <div className="col-12 col-md-6 col-lg-5">
          <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Materia / Curso
          </label>
          <select
            className="form-select"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            <option value="">-- Seleccionar curso --</option>
            {cursos
              .filter((c) => c.status === 'activo')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.codigo})
                </option>
              ))}
          </select>
        </div>

        {/* Selector de fecha con botones previa/siguiente */}
        <div className="col-12 col-md-6 col-lg-4">
          <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Fecha de Cursada
          </label>
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm p-2 rounded-3"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
              }}
              onClick={() => cambiarDia(-1)}
              title="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              className="form-control text-center"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm p-2 rounded-3"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
              }}
              onClick={() => cambiarDia(1)}
              title="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-sm px-2 rounded-3 text-nowrap"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--primary-accent)',
                fontSize: '0.78rem',
              }}
              onClick={() => setFechaSeleccionada(hoyISO())}
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Acciones y Exportar */}
        <div className="col-12 col-lg-3 d-flex align-items-end justify-content-start justify-content-lg-end gap-2">
          {cursoSeleccionado && (
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1 rounded-3 px-3 py-2"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
              }}
              onClick={handleExportar}
            >
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Alerta de día no lectivo */}
      {!esDiaHabilitado && (
        <div
          className="app-card rounded-4 p-3 mb-4 d-flex align-items-center gap-3"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
            <strong>{formatearFechaLarga(fechaSeleccionada)}</strong> no está configurado como día lectivo habitual.
            {!puedeEditarAsistenciaPasada && (
              <span className="text-muted ms-1">Solo administradores pueden asentar asistencia.</span>
            )}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {!cursoSeleccionado ? (
        <div
          className="app-card rounded-4 p-5 text-center text-muted"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <CalendarCheck size={48} className="mb-3 opacity-50" />
          <h2 className="h6 fw-semibold" style={{ color: 'var(--text-heading)' }}>
            Seleccioná un curso para comenzar
          </h2>
          <p className="mb-0" style={{ fontSize: '0.85rem' }}>
            Elegí una materia activa del menú superior para ver y tomar la asistencia.
          </p>
        </div>
      ) : internosCurso.length === 0 ? (
        <div
          className="app-card rounded-4 p-5 text-center text-muted"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <Users size={48} className="mb-3 opacity-50" />
          <h2 className="h6 fw-semibold" style={{ color: 'var(--text-heading)' }}>
            No hay alumnos inscriptos
          </h2>
          <p className="mb-0" style={{ fontSize: '0.85rem' }}>
            Este curso no tiene internos activos inscriptos actualmente.
          </p>
        </div>
      ) : (
        <div>
          {/* Barra de resumen + Botones rápidos */}
          <div
            className="app-card rounded-4 p-3 mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Contadores */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                {conteoHoy.presente} Presentes
              </span>
              <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {conteoHoy.ausente} Ausentes
              </span>
              <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                {conteoHoy.tarde} Tardanzas
              </span>
              <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                {conteoHoy.justificado} Justif.
              </span>
              <span className="text-muted ms-2" style={{ fontSize: '0.78rem' }}>
                Presentismo acumulado: <strong style={{ color: 'var(--text-heading)' }}>{presentismoCurso}%</strong>
              </span>
            </div>

            {/* Marcar todos rápido */}
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="text-muted me-1" style={{ fontSize: '0.75rem' }}>
                Marcar todos:
              </span>
              <button
                type="button"
                className="btn btn-sm px-2 py-1 rounded-2"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem' }}
                onClick={() => marcarTodos('presente')}
              >
                Presentes
              </button>
              <button
                type="button"
                className="btn btn-sm px-2 py-1 rounded-2"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem' }}
                onClick={() => marcarTodos('ausente')}
              >
                Ausentes
              </button>
            </div>
          </div>

          {/* Lista / Planilla de Alumnos */}
          <div
            className="app-card rounded-4 overflow-hidden mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead
                  style={{
                    background: 'var(--bg-input)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <tr>
                    <th className="py-3 ps-4" style={{ color: 'var(--text-muted)' }}>
                      Interno
                    </th>
                    <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                      Ubicación
                    </th>
                    <th className="py-3 text-center pe-4" style={{ color: 'var(--text-muted)' }}>
                      Estado Asistencia
                    </th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.88rem' }}>
                  {internosCurso.map((interno) => {
                    const estadoActual = planilla[interno.id] || 'ausente';

                    return (
                      <tr key={interno.id} style={{ borderColor: 'var(--border-subtle)' }}>
                        {/* Nombre & DNI */}
                        <td className="py-3 ps-4">
                          <div className="fw-semibold" style={{ color: 'var(--text-heading)' }}>
                            {interno.apellidoPaterno} {interno.apellidoMaterno}, {interno.nombreCompleto}
                          </div>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                            DNI: {interno.dni} · Ficha: {interno.fichaCriminologica}
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className="py-3">
                          <span
                            className="badge"
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                            }}
                          >
                            Pab. {interno.pabellon} - C. {interno.celda}
                          </span>
                        </td>

                        {/* Selector de Estado */}
                        <td className="py-3 text-center pe-4">
                          <div className="btn-group rounded-3 p-1" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                            {ESTADOS.map(({ value, label, short, icon: Icon, color }) => {
                              const seleccionado = estadoActual === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  className={`btn btn-sm rounded-2 px-2 px-sm-3 py-1 d-flex align-items-center gap-1 ${
                                    seleccionado ? 'fw-bold' : ''
                                  }`}
                                  style={{
                                    background: seleccionado ? color : 'transparent',
                                    color: seleccionado ? '#ffffff' : 'var(--text-muted)',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onClick={() => cambiarEstado(interno.id, value)}
                                  title={label}
                                >
                                  <Icon size={13} />
                                  <span className="d-none d-sm-inline">{label}</span>
                                  <span className="d-inline d-sm-none">{short}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón Guardar Flotante / Inferior */}
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn fw-semibold px-4 py-2 rounded-3 shadow-lg d-flex align-items-center gap-2"
              style={{
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 16px var(--primary-glow)',
              }}
              onClick={guardarPlanilla}
              disabled={guardando}
            >
              {guardando ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <Check size={18} />
              )}
              Guardar Planilla de Asistencia
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AsistenciaPage;
