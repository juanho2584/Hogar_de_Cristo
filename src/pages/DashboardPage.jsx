/**
 * @fileoverview DashboardPage — Panel principal con métricas y alertas.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, ClipboardList, CalendarCheck,
  AlertTriangle, TrendingUp, ChevronRight, Shield
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout.jsx';
import useInternosStore from '../store/internosStore.js';
import useCursosStore from '../store/cursosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useAlertaFaltas from '../hooks/useAlertaFaltas.js';
import { calcularPresentismo, getColorPresentismo } from '../utils/asistenciaUtils.js';
import { hoyISO, esDiaLectivo, formatearFechaCorta } from '../utils/dateUtils.js';

const MetricCard = ({ icon: Icon, titulo, valor, subtitulo, color = '#6366f1', loading }) => (
  <div
    className="rounded-4 p-4 h-100"
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div className="d-flex align-items-start justify-content-between mb-3">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center"
        style={{ width: 44, height: 44, background: `${color}22` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
    </div>
    {loading ? (
      <div className="placeholder-glow">
        <span className="placeholder col-6 bg-secondary rounded" />
      </div>
    ) : (
      <div className="text-white fw-bold mb-1" style={{ fontSize: '2rem', lineHeight: 1 }}>{valor}</div>
    )}
    <div className="text-white fw-semibold mb-1" style={{ fontSize: '0.9rem' }}>{titulo}</div>
    {subtitulo && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{subtitulo}</div>}
  </div>
);

const AlertaCard = ({ alerta }) => (
  <div
    className="rounded-3 p-3 mb-2 d-flex align-items-start gap-3"
    style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
    }}
  >
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
      style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.2)' }}
    >
      <AlertTriangle size={16} style={{ color: '#ef4444' }} />
    </div>
    <div className="flex-grow-1 min-w-0">
      <div className="text-white fw-semibold mb-1" style={{ fontSize: '0.88rem' }}>
        {alerta.nombreInterno}
      </div>
      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
        Materia: <span className="text-warning">{alerta.cursoNombre}</span>
        {' · '} Pabellón {alerta.pabellon} — Celda {alerta.celda}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 2 }}>
        ⚠ {alerta.faltasConsecutivas} faltas consecutivas desde {formatearFechaCorta(alerta.fechaInicioRacha)}
      </div>
    </div>
    <span
      className="badge flex-shrink-0"
      style={{ background: '#ef4444', fontSize: '0.75rem', alignSelf: 'center' }}
    >
      {alerta.faltasConsecutivas} faltas
    </span>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { internos, fetchInternos, loading: loadingI } = useInternosStore();
  const { cursos, fetchCursos, loading: loadingC } = useCursosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { asistencias, fetchAsistencias } = useAsistenciaStore();
  const { alertas, totalAlertas } = useAlertaFaltas();

  useEffect(() => {
    fetchInternos();
    fetchCursos();
    fetchInscripciones();
    fetchAsistencias();
  }, []);

  const hoy = hoyISO();
  const diaLectivo = esDiaLectivo(hoy);

  // Métricas generales
  const totalInternos = internos.filter(i => i.status === 'activo').length;
  const totalCursos = cursos.filter(c => c.status === 'activo').length;
  const totalInscripciones = inscripciones.filter(i => i.status === 'activo').length;

  // Presentismo general
  const { porcentaje: presentismoGeneral } = calcularPresentismo(asistencias);

  // Asistencias de hoy
  const asistenciasHoy = asistencias.filter(a => a.fecha === hoy);
  const presenciaHoy = asistenciasHoy.filter(a => a.estado === 'presente').length;

  const loading = loadingI || loadingC;

  return (
    <MainLayout titulo="Dashboard" subtitulo="Panel de control académico">
      {/* Alertas banner */}
      {totalAlertas > 0 && (
        <div
          className="rounded-4 p-3 mb-4 d-flex align-items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <span className="text-white fw-semibold">
              {totalAlertas} {totalAlertas === 1 ? 'interno requiere atención' : 'internos requieren atención'}
            </span>
            <span className="text-muted ms-2" style={{ fontSize: '0.82rem' }}>
              — Superaron las 5 faltas consecutivas
            </span>
          </div>
        </div>
      )}

      {/* Indicador día lectivo */}
      {diaLectivo && (
        <div
          className="rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between"
          style={{
            background: 'linear-gradient(90deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <CalendarCheck size={18} style={{ color: '#10b981' }} />
            <span className="text-white">Hoy es día lectivo — Asistencias habilitadas</span>
          </div>
          <button
            className="btn btn-sm px-3"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
            onClick={() => navigate('/asistencia')}
          >
            Ir a tomar asistencia <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de métricas */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <MetricCard
            icon={Users}
            titulo="Internos Activos"
            valor={loading ? '...' : totalInternos}
            subtitulo="En el programa educativo"
            color="#6366f1"
            loading={loading}
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            icon={BookOpen}
            titulo="Cursos Activos"
            valor={loading ? '...' : totalCursos}
            subtitulo="Materias en curso"
            color="#8b5cf6"
            loading={loading}
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            icon={ClipboardList}
            titulo="Inscripciones"
            valor={loading ? '...' : totalInscripciones}
            subtitulo="Inscripciones activas"
            color="#06b6d4"
            loading={loading}
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            icon={TrendingUp}
            titulo="Presentismo"
            valor={loading ? '...' : `${presentismoGeneral}%`}
            subtitulo="Promedio general"
            color={presentismoGeneral >= 75 ? '#10b981' : presentismoGeneral >= 50 ? '#f59e0b' : '#ef4444'}
            loading={loading}
          />
        </div>
      </div>

      <div className="row g-3">
        {/* Panel de alertas */}
        <div className="col-12 col-lg-6">
          <div
            className="rounded-4 p-4 h-100"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h6 text-white mb-0 fw-semibold d-flex align-items-center gap-2">
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                Alertas de Inasistencias
              </h3>
              {totalAlertas > 0 && (
                <span className="badge" style={{ background: '#ef4444' }}>{totalAlertas}</span>
              )}
            </div>
            {alertas.length === 0 ? (
              <div className="text-center py-4">
                <Shield size={40} className="text-success mb-2" />
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  Sin alertas activas. ¡Excelente presentismo!
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {alertas.map((alerta, idx) => (
                  <AlertaCard key={idx} alerta={alerta} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asistencia de hoy */}
        <div className="col-12 col-lg-6">
          <div
            className="rounded-4 p-4 h-100"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h6 text-white mb-0 fw-semibold d-flex align-items-center gap-2">
                <CalendarCheck size={16} style={{ color: '#10b981' }} />
                Asistencia de Hoy
              </h3>
            </div>
            {asistenciasHoy.length === 0 ? (
              <div className="text-center py-4">
                <CalendarCheck size={40} className="text-muted mb-2" />
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  {diaLectivo
                    ? 'Aún no se registró asistencia hoy.'
                    : 'Hoy no es día lectivo.'}
                </p>
                {diaLectivo && (
                  <button
                    className="btn btn-sm mt-3"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
                    onClick={() => navigate('/asistencia')}
                  >
                    Tomar asistencia ahora
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="row g-2 mb-3">
                  {[
                    { label: 'Presentes', val: asistenciasHoy.filter(a => a.estado === 'presente').length, color: '#10b981' },
                    { label: 'Ausentes', val: asistenciasHoy.filter(a => a.estado === 'ausente').length, color: '#ef4444' },
                    { label: 'Tardanzas', val: asistenciasHoy.filter(a => a.estado === 'tarde').length, color: '#f59e0b' },
                    { label: 'Justific.', val: asistenciasHoy.filter(a => a.estado === 'justificado').length, color: '#06b6d4' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="col-6">
                      <div
                        className="rounded-3 p-2 text-center"
                        style={{ background: `${color}11`, border: `1px solid ${color}33` }}
                      >
                        <div className="fw-bold" style={{ color, fontSize: '1.4rem' }}>{val}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-muted text-center" style={{ fontSize: '0.8rem' }}>
                  Total registros hoy: {asistenciasHoy.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceso rápido */}
        <div className="col-12">
          <div
            className="rounded-4 p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h3 className="h6 text-white mb-3 fw-semibold">Acceso Rápido</h3>
            <div className="row g-2">
              {[
                { label: 'Nuevo Interno', to: '/internos', color: '#6366f1', icon: Users },
                { label: 'Tomar Asistencia', to: '/asistencia', color: '#10b981', icon: CalendarCheck },
                { label: 'Ver Reportes', to: '/reportes', color: '#8b5cf6', icon: TrendingUp },
                { label: 'Gestionar Cursos', to: '/cursos', color: '#06b6d4', icon: BookOpen },
              ].map(({ label, to, color, icon: Icon }) => (
                <div key={to} className="col-6 col-md-3">
                  <button
                    onClick={() => navigate(to)}
                    className="btn w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-2"
                    style={{
                      background: `${color}11`,
                      border: `1px solid ${color}33`,
                      color,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${color}11`; }}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
