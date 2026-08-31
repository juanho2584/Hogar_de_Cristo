/**
 * @fileoverview ReportesPage — Generación y exportación de reportes académicos detallados por materia.
 * Incluye lista de internos cursando, % de presentismo y concepto cualitativo del docente.
 */

import { useEffect, useState } from 'react';
import { Download, BookOpen, User, Award, Edit3, Check, X, FileText, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useCursosStore from '../store/cursosStore.js';
import useInternosStore from '../store/internosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useAuthStore from '../store/authStore.js';
import usePermisos from '../hooks/usePermisos.js';
import evaluacionesService from '../services/localStorage/evaluacionesService.js';
import { calcularPresentismo, getColorPresentismo, detectarFaltasConsecutivas } from '../utils/asistenciaUtils.js';
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
  const [loadingEval, setLoadingEval] = useState(false);

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
      setLoadingEval(true);
      try {
        const evs = await evaluacionesService.getByCurso(cursoSeleccionadoId);
        setEvaluaciones(evs);
      } catch (err) {
        console.error('Error al cargar evaluaciones:', err);
      } finally {
        setLoadingEval(false);
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
      const existing = evaluaciones.find((e) => e.internoId === internoId);
      if (existing) {
        await evaluacionesService.update(existing.id, {
          concepto: editandoConcepto.concepto,
          calificacion: editandoConcepto.calificacion ? Number(editandoConcepto.calificacion) : null,
          periodo: editandoConcepto.periodo || '1er Cuatrimestre',
        });
      } else {
        await evaluacionesService.create({
          internoId,
          cursoId: cursoSeleccionadoId,
          concepto: editandoConcepto.concepto,
          calificacion: editandoConcepto.calificacion ? Number(editandoConcepto.calificacion) : null,
          periodo: editandoConcepto.periodo || '1er Cuatrimestre',
          creadoPor: usuario?.id || 'sistema',
        });
      }

      // Refrescar evaluaciones locales
      const evs = await evaluacionesService.getByCurso(cursoSeleccionadoId);
      setEvaluaciones(evs);
      setEditandoConcepto(null);
      toast.success('Concepto docente guardado correctamente.');
    } catch (err) {
      toast.error('Error al guardar la evaluación: ' + err.message);
    }
  };

  const handleExportarReporte = () => {
    if (!cursoActual) return;
    if (listaInternosData.length === 0) {
      toast.error('No hay datos para exportar en este curso.');
      return;
    }

    const dataExport = listaInternosData.map(({ interno, stats, evaluacion, alerta }) => ({
      Materia: cursoActual.nombre,
      CodigoMateria: cursoActual.codigo,
      ApellidoPaterno: interno.apellidoPaterno,
      ApellidoMaterno: interno.apellidoMaterno,
      NombreCompleto: interno.nombreCompleto,
      DNI: interno.dni,
      FichaCriminologica: interno.fichaCriminologica,
      Pabellon: interno.pabellon,
      Celda: interno.celda,
      ClasesTotales: stats.total,
      Presentes: stats.presentes,
      Ausentes: stats.ausentes,
      Tardes: stats.tarde,
      Justificados: stats.justificado,
      PorcentajePresentismo: `${stats.porcentaje}%`,
      AlertaFaltasConsecutivas: alerta.tieneAlerta ? `SI (${alerta.rachaActual} consecutivas)` : 'NO',
      ConceptoDocente: evaluacion?.concepto || 'Sin evaluar',
      Calificacion: evaluacion?.calificacion ?? 'N/A',
      Periodo: evaluacion?.periodo || 'N/A',
    }));

    exportToCsv(dataExport, `Reporte_Academico_${cursoActual.codigo}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte exportado exitosamente a CSV.');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
  };

  return (
    <MainLayout titulo="Reportes Académicos" subtitulo="Rendimiento, presentismo y conceptos docentes por materia">
      {/* Selector de Materia y Acciones */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <label className="text-muted fw-semibold mb-0" style={{ fontSize: '0.88rem' }}>
            Materia / Curso:
          </label>
          <select
            className="form-select"
            style={{ ...inputStyle, minWidth: 260 }}
            value={cursoSeleccionadoId}
            onChange={(e) => {
              setCursoSeleccionadoId(e.target.value);
              setEditandoConcepto(null);
            }}
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo}) — {c.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            className="btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}
            onClick={handleExportarReporte}
          >
            <Download size={16} /> Exportar Reporte CSV
          </button>
        </div>
      </div>

      {/* Resumen de la Materia */}
      {cursoActual && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div
              className="p-3 rounded-3 h-100"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>MATERIA</div>
              <div className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>{cursoActual.nombre}</div>
              <div className="text-info" style={{ fontSize: '0.8rem' }}>Código: {cursoActual.codigo}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="p-3 rounded-3 h-100"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>INTERNOS INSCRITOS</div>
              <div className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>
                {listaInternosData.length} alumno(s)
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Con cursada activa</div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="p-3 rounded-3 h-100"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>PROMEDIO DE ASISTENCIA</div>
              {(() => {
                const totalPct = listaInternosData.reduce((acc, curr) => acc + curr.stats.porcentaje, 0);
                const avgPct = listaInternosData.length > 0 ? Math.round(totalPct / listaInternosData.length) : 0;
                return (
                  <>
                    <div className={`fw-bold text-${getColorPresentismo(avgPct)}`} style={{ fontSize: '1.1rem' }}>
                      {avgPct}% general
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {listaInternosData.filter((i) => i.alerta.tieneAlerta).length} interno(s) con alerta de faltas
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tabla detallada de reporte */}
      <div
        className="rounded-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {listaInternosData.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FileText size={48} className="mb-3 opacity-40" />
            <p>No hay internos inscritos en esta materia actualmente.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th className="text-muted fw-normal py-3 ps-4" style={{ width: '22%' }}>Interno / Ubicación</th>
                  <th className="text-muted fw-normal py-3 text-center" style={{ width: '20%' }}>% Presentismo</th>
                  <th className="text-muted fw-normal py-3 text-center" style={{ width: '15%' }}>Desglose Clases</th>
                  <th className="text-muted fw-normal py-3" style={{ width: '33%' }}>Concepto Evaluativo Docente</th>
                  <th className="text-muted fw-normal py-3 text-center" style={{ width: '10%' }}>Acción</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {listaInternosData.map(({ interno, stats, alerta, evaluacion }) => {
                  const estaEditando = editandoConcepto?.internoId === interno.id;
                  const colorBadge = getColorPresentismo(stats.porcentaje);

                  return (
                    <tr key={interno.id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {/* Identificación del Interno */}
                      <td className="py-3 ps-4 align-middle">
                        <div className="text-white fw-semibold">
                          {interno.apellidoPaterno} {interno.apellidoMaterno}, {interno.nombreCompleto}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          DNI: {interno.dni} · <span className="text-secondary font-monospace">Ficha: {interno.fichaCriminologica}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Pab. <span className="text-white">{interno.pabellon}</span> — Celda {interno.celda}
                        </div>
                        {alerta.tieneAlerta && (
                          <div className="text-danger mt-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                            ⚠ Alerta: {alerta.rachaActual} faltas consecutivas
                          </div>
                        )}
                      </td>

                      {/* % Asistencia */}
                      <td className="py-3 align-middle text-center">
                        <div className={`fw-bold fs-5 text-${colorBadge}`}>
                          {stats.porcentaje}%
                        </div>
                        <div className="progress mx-auto mt-1" style={{ height: 6, maxWidth: 120, background: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className={`progress-bar bg-${colorBadge}`}
                            style={{ width: `${stats.porcentaje}%` }}
                          />
                        </div>
                      </td>

                      {/* Desglose asistencias */}
                      <td className="py-3 align-middle text-center" style={{ fontSize: '0.78rem' }}>
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <span className="badge bg-success bg-opacity-25 text-success">P: {stats.presentes}</span>
                          <span className="badge bg-danger bg-opacity-25 text-danger">A: {stats.ausentes}</span>
                          <span className="badge bg-warning bg-opacity-25 text-warning">T: {stats.tarde}</span>
                          <span className="badge bg-info bg-opacity-25 text-info">J: {stats.justificado}</span>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                          Total: {stats.total} clases
                        </div>
                      </td>

                      {/* Concepto Docente */}
                      <td className="py-3 align-middle">
                        {estaEditando ? (
                          <div className="d-flex flex-column gap-2">
                            <textarea
                              className="form-control form-control-sm"
                              rows={3}
                              style={{ ...inputStyle, resize: 'none' }}
                              placeholder="Escriba el concepto cualitativo del alumno..."
                              value={editandoConcepto.concepto}
                              onChange={(e) =>
                                setEditandoConcepto({ ...editandoConcepto, concepto: e.target.value })
                              }
                            />
                            <div className="d-flex gap-2">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                className="form-control form-control-sm"
                                style={{ ...inputStyle, width: 80 }}
                                placeholder="Nota (1-10)"
                                value={editandoConcepto.calificacion || ''}
                                onChange={(e) =>
                                  setEditandoConcepto({ ...editandoConcepto, calificacion: e.target.value })
                                }
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ ...inputStyle, flex: 1 }}
                                placeholder="Período (ej: 1er Cuatrimestre)"
                                value={editandoConcepto.periodo}
                                onChange={(e) =>
                                  setEditandoConcepto({ ...editandoConcepto, periodo: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        ) : evaluacion ? (
                          <div>
                            <div className="text-white" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                              "{evaluacion.concepto}"
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              {evaluacion.calificacion && (
                                <span className="badge bg-primary bg-opacity-25 text-primary">
                                  Calificación: {evaluacion.calificacion}/10
                                </span>
                              )}
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {evaluacion.periodo}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.82rem', fontStyle: 'italic' }}>
                            Sin evaluación cualitativa registrada.
                          </span>
                        )}
                      </td>

                      {/* Botón de edición de concepto */}
                      <td className="py-3 align-middle text-center">
                        {estaEditando ? (
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-success p-1"
                              title="Guardar concepto"
                              onClick={() => handleGuardarConcepto(interno.id)}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-secondary p-1"
                              title="Cancelar"
                              onClick={() => setEditandoConcepto(null)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm rounded-2"
                            style={{
                              background: 'rgba(99,102,241,0.15)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99,102,241,0.3)',
                              fontSize: '0.78rem',
                            }}
                            onClick={() =>
                              setEditandoConcepto({
                                internoId: interno.id,
                                concepto: evaluacion?.concepto || '',
                                calificacion: evaluacion?.calificacion || '',
                                periodo: evaluacion?.periodo || '1er Cuatrimestre',
                              })
                            }
                          >
                            <Edit3 size={13} className="me-1" />
                            {evaluacion ? 'Editar' : 'Evaluar'}
                          </button>
                        )}
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

export default ReportesPage;
