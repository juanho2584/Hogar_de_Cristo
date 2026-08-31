/**
 * @fileoverview AsistenciaPage — Planilla de asistencia diaria por curso.
 */

import { useEffect, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, AlertTriangle, Check, X, Clock, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useInternosStore from '../store/internosStore.js';
import useCursosStore from '../store/cursosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useAuthStore from '../store/authStore.js';
import usePermisos from '../hooks/usePermisos.js';
import { hoyISO, esDiaLectivo, formatearFechaLarga, getFechasLectivas } from '../utils/dateUtils.js';
import { calcularPresentismo, getColorPresentismo } from '../utils/asistenciaUtils.js';
import { exportToCsv, CSV_CONFIG } from '../services/csv/csvService.js';
import { Download } from 'lucide-react';

const ESTADOS = [
  { value: 'presente', label: 'Presente', icon: Check, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  { value: 'ausente', label: 'Ausente', icon: X, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  { value: 'tarde', label: 'Tarde', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  { value: 'justificado', label: 'Justif.', icon: FileCheck, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
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
  const [planilla, setPlanilla] = useState({}); // { internoId: estado }
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchAsistencias();
    fetchInternos();
    fetchCursos();
    fetchInscripciones();
  }, []);

  // Cuando cambia el curso o la fecha, cargar datos existentes
  useEffect(() => {
    if (!cursoSeleccionado) return;
    const registrosExistentes = asistencias.filter(
      a => a.cursoId === cursoSeleccionado && a.fecha === fechaSeleccionada
    );
    const mapa = {};
    registrosExistentes.forEach(r => { mapa[r.internoId] = r.estado; });
    setPlanilla(mapa);
  }, [cursoSeleccionado, fechaSeleccionada, asistencias]);

  const esDiaHabilitado = esDiaLectivo(fechaSeleccionada);
  const esHoy = fechaSeleccionada === hoyISO();

  // Internos del curso seleccionado
  const internosCurso = inscripciones
    .filter(i => i.cursoId === cursoSeleccionado && i.status === 'activo')
    .map(i => internos.find(int => int.id === i.internoId))
    .filter(Boolean)
    .sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno));

  const cambiarEstado = (internoId, estado) => {
    setPlanilla(prev => ({ ...prev, [internoId]: estado }));
  };

  const marcarTodos = (estado) => {
    const nuevo = {};
    internosCurso.forEach(i => { nuevo[i.id] = estado; });
    setPlanilla(nuevo);
  };

  const guardarPlanilla = async () => {
    if (!cursoSeleccionado) return toast.error('Seleccioná un curso primero.');
    if (!esDiaHabilitado && !puedeEditarAsistenciaPasada) {
      return toast.error('No es un día lectivo. Solo ADMIN puede registrar asistencia en días no lectivos.');
    }

    setGuardando(true);
    const registros = internosCurso.map(interno => ({
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

  // Cambiar fecha (solo días lectivos o si es admin)
  const cambiarFecha = (delta) => {
    const d = new Date(fechaSeleccionada + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const nueva = d.toISOString().split('T')[0];
    if (nueva > hoyISO() && !puedeEditarAsistenciaPasada) return;
    setFechaSeleccionada(nueva);
  };

  // Presentismo del curso (últimas fechas lectivas)
  const getResumenPresentismo = () => {
    if (!cursoSeleccionado) return null;
    const reg = asistencias.filter(a => a.cursoId === cursoSeleccionado);
    return calcularPresentismo(reg);
  };

  const resumen = getResumenPresentismo();
  const totalPlanilla = internosCurso.length;
  const registradosHoy = internosCurso.filter(i => planilla[i.id]).length;

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' };

  return (
    <MainLayout titulo="Asistencia" subtitulo="Planilla de asistencia diaria">
      <div className="row g-3">
        {/* Panel de selección */}
        <div className="col-12 col-lg-3">
          <div className="rounded-4 p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="h6 text-white mb-3 fw-semibold">Configurar Planilla</h3>

            {/* Curso */}
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: '0.78rem' }}>Curso / Materia</label>
              <select
                className="form-select"
                style={inputStyle}
                value={cursoSeleccionado}
                onChange={e => setCursoSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {cursos.filter(c => c.status === 'activo').map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: '0.78rem' }}>Fecha</label>
              <div className="d-flex align-items-center gap-1">
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px' }}
                  onClick={() => cambiarFecha(-1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <input
                  type="date"
                  className="form-control form-control-sm text-center"
                  style={inputStyle}
                  value={fechaSeleccionada}
                  max={hoyISO()}
                  onChange={e => setFechaSeleccionada(e.target.value)}
                />
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px' }}
                  onClick={() => cambiarFecha(1)}
                  disabled={fechaSeleccionada >= hoyISO()}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Indicador día lectivo */}
            <div
              className="rounded-3 p-2 mb-3 text-center"
              style={{
                background: esDiaHabilitado ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${esDiaHabilitado ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                fontSize: '0.78rem',
                color: esDiaHabilitado ? '#10b981' : '#f59e0b',
              }}
            >
              {esDiaHabilitado ? (
                <><CalendarCheck size={13} className="me-1" /> Día lectivo habilitado</>
              ) : (
                <><AlertTriangle size={13} className="me-1" /> Día no lectivo</>
              )}
            </div>

            {/* Resumen presentismo del curso */}
            {resumen && cursoSeleccionado && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-muted mb-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presentismo del Curso</div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total clases</span>
                  <span className="text-white" style={{ fontSize: '0.8rem' }}>{resumen.total}</span>
                </div>
                <div className="progress mb-2" style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className={`progress-bar bg-${getColorPresentismo(resumen.porcentaje)}`}
                    style={{ width: `${resumen.porcentaje}%` }}
                  />
                </div>
                <div className={`text-center fw-bold text-${getColorPresentismo(resumen.porcentaje)}`} style={{ fontSize: '1.2rem' }}>
                  {resumen.porcentaje}%
                </div>
              </div>
            )}

            {/* Exportar */}
            <button
              className="btn btn-sm w-100 mt-3 d-flex align-items-center justify-content-center gap-1"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem' }}
              onClick={() => { exportToCsv(asistencias, CSV_CONFIG.asistencia.filename, CSV_CONFIG.asistencia.fields); toast.success('CSV exportado.'); }}
            >
              <Download size={13} /> Exportar Asistencias
            </button>
          </div>
        </div>

        {/* Planilla principal */}
        <div className="col-12 col-lg-9">
          <div className="rounded-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header planilla */}
            <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="text-white fw-semibold">{formatearFechaLarga(fechaSeleccionada)}</div>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {cursoSeleccionado
                    ? `${cursos.find(c => c.id === cursoSeleccionado)?.nombre} · ${internosCurso.length} internos · ${registradosHoy} registrados`
                    : 'Seleccioná un curso para comenzar'}
                </div>
              </div>
              {cursoSeleccionado && internosCurso.length > 0 && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.78rem' }}
                    onClick={() => marcarTodos('presente')}
                  >
                    ✓ Marcar todos presentes
                  </button>
                  <button
                    className="btn btn-sm fw-semibold"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', fontSize: '0.78rem' }}
                    onClick={guardarPlanilla}
                    disabled={guardando}
                  >
                    {guardando ? <span className="spinner-border spinner-border-sm me-1" /> : <CalendarCheck size={13} className="me-1" />}
                    Guardar Planilla
                  </button>
                </div>
              )}
            </div>

            {/* Lista de internos */}
            {!cursoSeleccionado ? (
              <div className="text-center py-5 text-muted">
                <CalendarCheck size={48} className="mb-3 opacity-40" />
                <p>Seleccioná un curso y una fecha para comenzar.</p>
              </div>
            ) : internosCurso.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p>No hay internos inscriptos en este curso.</p>
              </div>
            ) : (
              <div>
                {internosCurso.map((interno, idx) => {
                  const estadoActual = planilla[interno.id];
                  return (
                    <div
                      key={interno.id}
                      className="d-flex align-items-center gap-3 px-3 py-3"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      {/* Número */}
                      <div className="text-muted text-center" style={{ width: 28, fontSize: '0.78rem', flexShrink: 0 }}>
                        {idx + 1}
                      </div>

                      {/* Info interno */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="text-white fw-semibold" style={{ fontSize: '0.88rem' }}>
                          {interno.apellidoPaterno} {interno.apellidoMaterno}, {interno.nombreCompleto}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          DNI: {interno.dni} · Pab. {interno.pabellon} Celda {interno.celda}
                        </div>
                      </div>

                      {/* Botones de estado */}
                      <div className="d-flex gap-1 flex-shrink-0">
                        {ESTADOS.map(({ value, label, icon: Icon, color, bg, border }) => (
                          <button
                            key={value}
                            onClick={() => cambiarEstado(interno.id, value)}
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{
                              background: estadoActual === value ? bg : 'rgba(255,255,255,0.04)',
                              color: estadoActual === value ? color : '#64748b',
                              border: estadoActual === value ? `1px solid ${border}` : '1px solid rgba(255,255,255,0.08)',
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              fontWeight: estadoActual === value ? 600 : 400,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Icon size={12} />
                            <span className="d-none d-md-inline">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Guardar (footer) */}
                <div className="d-flex align-items-center justify-content-between p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {registradosHoy}/{totalPlanilla} internos con estado asignado
                  </span>
                  <button
                    className="btn btn-sm fw-semibold px-4"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
                    onClick={guardarPlanilla}
                    disabled={guardando}
                  >
                    {guardando ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    Guardar Planilla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AsistenciaPage;
