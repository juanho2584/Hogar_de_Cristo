/**
 * @fileoverview ReportesPage — Generación y exportación de reportes académicos detallados por materia responsivo.
 * Incluye lista de internos cursando, % de presentismo y concepto cualitativo del docente.
 */

import { useEffect, useState } from 'react';
import {
  Download,
  BookOpen,
  User,
  Edit3,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useCursosStore from '../store/cursosStore.js';
import useInternosStore from '../store/internosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useAuthStore from '../store/authStore.js';
import usePermisos from '../hooks/usePermisos.js';
import evaluacionesService from '../services/localStorage/evaluacionesService.js';
import { calcularPresentismo, detectarFaltasConsecutivas } from '../utils/asistenciaUtils.js';
import { exportToCsv } from '../services/csv/csvService.js';

const ReportesPage = () => {
  const { cursos, fetchCursos } = useCursosStore();
  const { internos, fetchInternos } = useInternosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { asistencias, fetchAsistencias } = useAsistenciaStore();
  const { usuario } = useAuthStore();
  const { puedeExportarReportes } = usePermisos();

  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [editandoConcepto, setEditandoConcepto] = useState(null); // { internoId, concepto, calificacion, periodo }

  useEffect(() => {
    fetchCursos();
    fetchInternos();
    fetchInscripciones();
    fetchAsistencias();
  }, []);

  // Seleccionar por defecto el primer curso activo
  useEffect(() => {
    if (!cursoSeleccionadoId && cursos.length > 0) {
      const primerActivo = cursos.find((c) => c.status === 'activo') || cursos[0];
      if (primerActivo) setCursoSeleccionadoId(primerActivo.id);
    }
  }, [cursos, cursoSeleccionadoId]);

  // Cargar evaluaciones del curso seleccionado
  useEffect(() => {
    if (!cursoSeleccionadoId) return;
    const loadEvals = async () => {
      try {
        const evs = await evaluacionesService.getByCurso(cursoSeleccionadoId);
        setEvaluaciones(evs);
      } catch (err) {
        console.error('Error al cargar evaluaciones:', err);
      }
    };
    loadEvals();
  }, [cursoSeleccionadoId]);

  const cursoActual = cursos.find((c) => c.id === cursoSeleccionadoId);

  // Internos inscritos en este curso
  const inscripcionesCurso = inscripciones.filter(
    (i) => i.cursoId === cursoSeleccionadoId && i.status === 'activo'
  );

  const listaInternosData = inscripcionesCurso
    .map((ins) => {
      const interno = internos.find((i) => i.id === ins.internoId);
      if (!interno) return null;

      const regAsistencia = asistencias
        .filter((a) => a.internoId === interno.id && a.cursoId === cursoSeleccionadoId)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      const stats = calcularPresentismo(regAsistencia);
      const alerta = detectarFaltasConsecutivas(regAsistencia);
      const evaluacion = evaluaciones.find((e) => e.internoId === interno.id) || null;

      return {
        interno,
        stats,
        alerta,
        evaluacion,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.interno.apellidoPaterno.localeCompare(b.interno.apellidoPaterno));

  const handleGuardarConcepto = async (internoId) => {
    if (!editandoConcepto || !editandoConcepto.concepto?.trim()) {
      toast.error('El concepto evaluativo no puede estar vacío.');
      return;
    }

    try {
      const evalExistente = evaluaciones.find(
        (e) => e.internoId === internoId && e.cursoId === cursoSeleccionadoId
      );

      const payload = {
        internoId,
        cursoId: cursoSeleccionadoId,
        concepto: editandoConcepto.concepto.trim(),
        calificacion: editandoConcepto.calificacion ? Number(editandoConcepto.calificacion) : null,
        periodo: editandoConcepto.periodo || 'Ciclo 2025',
        creadoPor: usuario?.id || 'sistema',
      };

      if (evalExistente) {
        const updated = await evaluacionesService.update(evalExistente.id, payload);
        setEvaluaciones((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const nuevo = await evaluacionesService.create(payload);
        setEvaluaciones((prev) => [...prev, nuevo]);
      }

      toast.success('Concepto docente guardado.');
      setEditandoConcepto(null);
    } catch {
      toast.error('Error al guardar la evaluación.');
    }
  };

  const handleExportarReporte = () => {
    if (!cursoActual || listaInternosData.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const dataExport = listaInternosData.map(({ interno, stats, alerta, evaluacion }) => ({
      Curso: cursoActual.nombre,
      CodigoCurso: cursoActual.codigo,
      ApellidoPaterno: interno.apellidoPaterno,
      ApellidoMaterno: interno.apellidoMaterno,
      Nombres: interno.nombreCompleto,
      DNI: interno.dni,
      Ficha: interno.fichaCriminologica,
      Pabellon: interno.pabellon,
      Celda: interno.celda,
      PresentismoPorcentaje: `${stats.porcentaje}%`,
      ClasesPresente: stats.presente,
      ClasesAusente: stats.ausente,
      Tardanzas: stats.tarde,
      Justificadas: stats.justificado,
      TotalClases: stats.total,
      AlertaFaltas: alerta.tieneAlerta ? `SI (${alerta.faltasConsecutivas} consecutivas)` : 'NO',
      ConceptoDocente: evaluacion?.concepto || 'Sin asentar',
      Calificacion: evaluacion?.calificacion ?? 'N/A',
      Periodo: evaluacion?.periodo || 'N/A',
    }));

    exportToCsv(
      dataExport,
      `reporte_academico_${cursoActual.codigo}_${new Date().toISOString().split('T')[0]}.csv`,
      [
        'Curso',
        'CodigoCurso',
        'ApellidoPaterno',
        'ApellidoMaterno',
        'Nombres',
        'DNI',
        'Ficha',
        'Pabellon',
        'Celda',
        'PresentismoPorcentaje',
        'ClasesPresente',
        'ClasesAusente',
        'Tardanzas',
        'Justificadas',
        'TotalClases',
        'AlertaFaltas',
        'ConceptoDocente',
        'Calificacion',
        'Periodo',
      ]
    );

    toast.success('Reporte exportado correctamente en CSV.');
  };

  // Promedio de presentismo del curso
  const presentismoGeneralCurso =
    listaInternosData.length > 0
      ? Math.round(
          listaInternosData.reduce((acc, curr) => acc + curr.stats.porcentaje, 0) /
            listaInternosData.length
        )
      : 0;

  return (
    <MainLayout
      titulo="Reportes Académicos"
      subtitulo="Rendimiento por materia, asistencia acumulada y conceptos evaluativos"
    >
      {/* Selector de Materia y Exportar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 440 }}>
          <select
            className="form-select"
            value={cursoSeleccionadoId}
            onChange={(e) => {
              setCursoSeleccionadoId(e.target.value);
              setEditandoConcepto(null);
            }}
          >
            <option value="">-- Seleccionar curso / materia --</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo}) — {c.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2">
          {puedeExportarReportes && (
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1 rounded-3 px-3 py-2"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
              }}
              onClick={handleExportarReporte}
              disabled={!cursoActual || listaInternosData.length === 0}
            >
              <Download size={14} /> Exportar Planilla CSV
            </button>
          )}
        </div>
      </div>

      {!cursoActual ? (
        <div
          className="app-card rounded-4 p-5 text-center text-muted"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <BookOpen size={48} className="mb-3 opacity-50" />
          <h2 className="h6 fw-semibold" style={{ color: 'var(--text-heading)' }}>
            Seleccioná un curso para generar el reporte
          </h2>
        </div>
      ) : (
        <div>
          {/* Header de Resumen del Curso */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-4">
              <div
                className="app-card rounded-4 p-3 h-100"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Total Inscriptos
                </div>
                <div
                  className="fw-bold"
                  style={{ fontSize: '1.6rem', color: 'var(--text-heading)' }}
                >
                  {listaInternosData.length} alumnos
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  En cursada activa
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <div
                className="app-card rounded-4 p-3 h-100"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Presentismo General
                </div>
                <div
                  className="fw-bold"
                  style={{
                    fontSize: '1.6rem',
                    color:
                      presentismoGeneralCurso >= 75
                        ? 'var(--success-color)'
                        : presentismoGeneralCurso >= 50
                        ? 'var(--warning-color)'
                        : 'var(--danger-color)',
                  }}
                >
                  {presentismoGeneralCurso}%
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Promedio de asistencia de la materia
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div
                className="app-card rounded-4 p-3 h-100"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Evaluaciones Asentadas
                </div>
                <div
                  className="fw-bold"
                  style={{ fontSize: '1.6rem', color: 'var(--primary-accent)' }}
                >
                  {evaluaciones.length} / {listaInternosData.length}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Conceptos docentes registrados
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Detallada por Interno */}
          {listaInternosData.length === 0 ? (
            <div
              className="app-card rounded-4 p-5 text-center text-muted"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <User size={48} className="mb-3 opacity-50" />
              <h2 className="h6 fw-semibold" style={{ color: 'var(--text-heading)' }}>
                No hay internos inscriptos en este curso
              </h2>
            </div>
          ) : (
            <div
              className="app-card rounded-4 overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
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
                        Interno / DNI
                      </th>
                      <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                        Ubicación
                      </th>
                      <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                        Presentismo
                      </th>
                      <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                        Desglose Asistencia
                      </th>
                      <th className="py-3 pe-4" style={{ color: 'var(--text-muted)', minWidth: 280 }}>
                        Concepto Evaluativo Docente
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.86rem' }}>
                    {listaInternosData.map(({ interno, stats, alerta, evaluacion }) => {
                      const estaEditando = editandoConcepto?.internoId === interno.id;

                      return (
                        <tr key={interno.id} style={{ borderColor: 'var(--border-subtle)' }}>
                          {/* Interno */}
                          <td className="py-3 ps-4">
                            <div className="fw-semibold" style={{ color: 'var(--text-heading)' }}>
                              {interno.apellidoPaterno} {interno.apellidoMaterno}, {interno.nombreCompleto}
                            </div>
                            <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                              DNI: {interno.dni} · Ficha: {interno.fichaCriminologica}
                            </div>
                            {alerta.tieneAlerta && (
                              <div
                                className="badge mt-1 d-inline-flex align-items-center gap-1"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--danger-color)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  fontSize: '0.7rem',
                                }}
                              >
                                <AlertTriangle size={11} /> {alerta.faltasConsecutivas} inasistencias seguidas
                              </div>
                            )}
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

                          {/* Presentismo */}
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="fw-bold"
                                style={{
                                  fontSize: '1rem',
                                  color:
                                    stats.porcentaje >= 75
                                      ? 'var(--success-color)'
                                      : stats.porcentaje >= 50
                                      ? 'var(--warning-color)'
                                      : 'var(--danger-color)',
                                }}
                              >
                                {stats.porcentaje}%
                              </span>
                              <div
                                className="progress flex-grow-1"
                                style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)' }}
                              >
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${stats.porcentaje}%`,
                                    background:
                                      stats.porcentaje >= 75
                                        ? 'var(--success-color)'
                                        : stats.porcentaje >= 50
                                        ? 'var(--warning-color)'
                                        : 'var(--danger-color)',
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Desglose */}
                          <td className="py-3">
                            <div className="d-flex gap-1" style={{ fontSize: '0.75rem' }}>
                              <span className="text-success">{stats.presente}P</span>
                              <span className="text-muted">/</span>
                              <span className="text-danger">{stats.ausente}A</span>
                              <span className="text-muted">/</span>
                              <span className="text-warning">{stats.tarde}T</span>
                              <span className="text-muted">/</span>
                              <span className="text-info">{stats.justificado}J</span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {stats.total} clases totales
                            </div>
                          </td>

                          {/* Concepto Evaluativo */}
                          <td className="py-3 pe-4">
                            {estaEditando ? (
                              <div className="d-flex flex-column gap-2 p-2 rounded-3" style={{ background: 'var(--bg-input)' }}>
                                <textarea
                                  className="form-control form-control-sm"
                                  rows={2}
                                  value={editandoConcepto.concepto}
                                  placeholder="Escribí el concepto docente (participación, conducta, avances)..."
                                  onChange={(e) =>
                                    setEditandoConcepto((prev) => ({
                                      ...prev,
                                      concepto: e.target.value,
                                    }))
                                  }
                                />
                                <div className="d-flex gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="form-control form-control-sm"
                                    style={{ width: 70 }}
                                    placeholder="Nota"
                                    value={editandoConcepto.calificacion ?? ''}
                                    onChange={(e) =>
                                      setEditandoConcepto((prev) => ({
                                        ...prev,
                                        calificacion: e.target.value,
                                      }))
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Período (ej: 1er Cuatr. 2025)"
                                    value={editandoConcepto.periodo}
                                    onChange={(e) =>
                                      setEditandoConcepto((prev) => ({
                                        ...prev,
                                        periodo: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success p-1 px-2"
                                    onClick={() => handleGuardarConcepto(interno.id)}
                                    title="Guardar concepto"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary p-1 px-2"
                                    onClick={() => setEditandoConcepto(null)}
                                    title="Cancelar"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex align-items-start justify-content-between gap-2">
                                <div className="flex-grow-1">
                                  {evaluacion ? (
                                    <div>
                                      <p className="mb-1" style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                                        "{evaluacion.concepto}"
                                      </p>
                                      <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.72rem' }}>
                                        {evaluacion.calificacion && (
                                          <span
                                            className="badge"
                                            style={{
                                              background: 'rgba(16, 185, 129, 0.2)',
                                              color: 'var(--success-color)',
                                            }}
                                          >
                                            Nota: {evaluacion.calificacion}/10
                                          </span>
                                        )}
                                        <span className="text-muted">({evaluacion.periodo})</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted fst-italic" style={{ fontSize: '0.8rem' }}>
                                      Sin concepto docente asentado
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm p-1 px-2 rounded-2"
                                  style={{
                                    background: 'var(--bg-input)',
                                    color: 'var(--primary-accent)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '0.75rem',
                                  }}
                                  onClick={() =>
                                    setEditandoConcepto({
                                      internoId: interno.id,
                                      concepto: evaluacion?.concepto || '',
                                      calificacion: evaluacion?.calificacion ?? '',
                                      periodo: evaluacion?.periodo || '1er Cuatrimestre 2025',
                                    })
                                  }
                                >
                                  <Edit3 size={13} className="me-1" />
                                  {evaluacion ? 'Editar' : 'Evaluar'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default ReportesPage;
