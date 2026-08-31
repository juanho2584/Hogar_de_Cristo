/**
 * @fileoverview CursosPage — CRUD completo de cursos/materias.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Edit2, Trash2, X, BookOpen, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useCursosStore from '../store/cursosStore.js';
import useUsuariosStore from '../store/usuariosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import usePermisos from '../hooks/usePermisos.js';
import { cursoSchema } from '../utils/validators.js';
import { exportToCsv, CSV_CONFIG } from '../services/csv/csvService.js';
import { formatearFechaCorta } from '../utils/dateUtils.js';
import { ACADEMIC_CONFIG, DIAS_NOMBRES } from '../config/academicConfig.js';

const STATUS_LABELS = { activo: 'Activo', finalizado: 'Finalizado', cancelado: 'Cancelado' };
const STATUS_COLORS = { activo: 'success', finalizado: 'info', cancelado: 'danger' };
const TODOS_LOS_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const CursosPage = () => {
  const { cursos, fetchCursos, createCurso, updateCurso, deleteCurso, loading } = useCursosStore();
  const { usuarios, fetchUsuarios } = useUsuariosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { puedeEditar, puedeEliminar } = usePermisos();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(cursoSchema),
    defaultValues: {
      diasCursada: ACADEMIC_CONFIG.diasLectivos,
      status: 'activo',
    },
  });

  const diasSeleccionados = watch('diasCursada') || [];

  useEffect(() => {
    fetchCursos();
    fetchUsuarios();
    fetchInscripciones();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    reset({ diasCursada: ACADEMIC_CONFIG.diasLectivos, status: 'activo' });
    setShowModal(true);
  };

  const abrirModalEditar = (curso) => {
    setEditando(curso);
    reset({
      ...curso,
      diasCursada: typeof curso.diasCursada === 'string'
        ? curso.diasCursada.split(',')
        : curso.diasCursada,
    });
    setShowModal(true);
  };

  const cerrarModal = () => { setShowModal(false); setEditando(null); reset(); };

  const toggleDia = (dia) => {
    const actual = watch('diasCursada') || [];
    if (actual.includes(dia)) {
      setValue('diasCursada', actual.filter(d => d !== dia));
    } else {
      setValue('diasCursada', [...actual, dia]);
    }
  };

  const onSubmit = async (data) => {
    const result = editando ? await updateCurso(editando.id, data) : await createCurso(data);
    if (result.ok) {
      toast.success(editando ? 'Curso actualizado.' : 'Curso creado correctamente.');
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const confirmarEliminar = (curso) => {
    if (window.confirm(`¿Eliminar el curso "${curso.nombre}"? Esta acción no se puede deshacer.`)) {
      handleEliminar(curso.id);
    }
  };

  const handleEliminar = async (id) => {
    const result = await deleteCurso(id);
    if (result.ok) toast.success('Curso eliminado.');
    else toast.error(result.error);
  };

  const getDocente = (docenteId) => usuarios.find(u => u.id === docenteId);
  const getCantidadInscriptos = (cursoId) => inscripciones.filter(i => i.cursoId === cursoId && i.status === 'activo').length;

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
  };

  return (
    <MainLayout titulo="Cursos / Materias" subtitulo={`${cursos.length} cursos registrados`}>
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
            onClick={() => { exportToCsv(cursos, CSV_CONFIG.cursos.filename, CSV_CONFIG.cursos.fields); toast.success('CSV exportado.'); }}
          >
            <Download size={14} /> Exportar CSV
          </button>
          {puedeEditar && (
            <button
              id="btn-nuevo-curso"
              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
              onClick={abrirModalNuevo}
            >
              <Plus size={14} /> Nuevo Curso
            </button>
          )}
        </div>
      </div>

      {/* Cards de cursos */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <BookOpen size={48} className="mb-3 opacity-50" />
          <p>No hay cursos registrados.</p>
        </div>
      ) : (
        <div className="row g-3">
          {cursos.map((curso) => {
            const docente = getDocente(curso.docenteId);
            const inscriptos = getCantidadInscriptos(curso.id);
            const dias = typeof curso.diasCursada === 'string'
              ? curso.diasCursada.split(',')
              : (curso.diasCursada || []);

            return (
              <div key={curso.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="rounded-4 p-4 h-100 d-flex flex-column"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{curso.codigo}</span>
                      <h3 className="h6 text-white mb-0 fw-bold">{curso.nombre}</h3>
                    </div>
                    <span className={`badge bg-${STATUS_COLORS[curso.status]} bg-opacity-25 text-${STATUS_COLORS[curso.status]}`}>
                      {STATUS_LABELS[curso.status]}
                    </span>
                  </div>

                  {/* Descripción */}
                  {curso.descripcion && (
                    <p className="text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {curso.descripcion}
                    </p>
                  )}

                  {/* Info */}
                  <div className="d-flex flex-column gap-2 mb-3 flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Docente</span>
                      <span className="text-white" style={{ fontSize: '0.8rem' }}>{docente?.nombre || 'Sin asignar'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Inscriptos</span>
                      <span className="text-white" style={{ fontSize: '0.8rem' }}>{inscriptos} interno/s</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Período</span>
                      <span className="text-white" style={{ fontSize: '0.8rem' }}>
                        {formatearFechaCorta(curso.fechaInicio)} → {formatearFechaCorta(curso.fechaFin)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted d-block mb-1" style={{ fontSize: '0.8rem' }}>Días de cursada</span>
                      <div className="d-flex flex-wrap gap-1">
                        {dias.map(dia => (
                          <span key={dia} className="badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.7rem' }}>
                            {DIAS_NOMBRES[dia] || dia}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {(puedeEditar || puedeEliminar) && (
                    <div className="d-flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {puedeEditar && (
                        <button
                          className="btn btn-sm flex-grow-1"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem' }}
                          onClick={() => abrirModalEditar(curso)}
                        >
                          <Edit2 size={13} className="me-1" /> Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem' }}
                          onClick={() => confirmarEliminar(curso)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="modal d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', position: 'fixed', inset: 0, zIndex: 2000, backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div
            className="rounded-4 p-4 w-100"
            style={{
              maxWidth: 580,
              background: '#161b2e',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h2 className="h5 text-white mb-0 fw-bold">{editando ? 'Editar Curso' : 'Nuevo Curso'}</h2>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none' }} onClick={cerrarModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="row g-3">
                <div className="col-8">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Nombre del Curso *</label>
                  <input className={`form-control ${errors.nombre ? 'is-invalid' : ''}`} style={inputStyle} {...register('nombre')} placeholder="Ej: Matemática" />
                  {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                </div>
                <div className="col-4">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Código *</label>
                  <input className={`form-control ${errors.codigo ? 'is-invalid' : ''}`} style={inputStyle} {...register('codigo')} placeholder="MAT-01" />
                  {errors.codigo && <div className="invalid-feedback">{errors.codigo.message}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Descripción</label>
                  <textarea className="form-control" style={{ ...inputStyle, resize: 'none' }} rows={2} {...register('descripcion')} />
                </div>
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Docente *</label>
                  <select className={`form-select ${errors.docenteId ? 'is-invalid' : ''}`} style={inputStyle} {...register('docenteId')}>
                    <option value="">Seleccionar docente...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                    ))}
                  </select>
                  {errors.docenteId && <div className="invalid-feedback">{errors.docenteId.message}</div>}
                </div>

                {/* Días de cursada */}
                <div className="col-12">
                  <label className="form-label text-muted d-block mb-2" style={{ fontSize: '0.8rem' }}>Días de Cursada *</label>
                  <div className="d-flex flex-wrap gap-2">
                    {TODOS_LOS_DIAS.map(dia => {
                      const seleccionado = diasSeleccionados.includes(dia);
                      const esDefault = ACADEMIC_CONFIG.diasLectivos.includes(dia);
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDia(dia)}
                          className="btn btn-sm"
                          style={{
                            background: seleccionado ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                            color: seleccionado ? '#a5b4fc' : '#64748b',
                            border: seleccionado ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.78rem',
                          }}
                        >
                          {DIAS_NOMBRES[dia]}
                          {esDefault && <span className="ms-1 opacity-50" title="Día lectivo por defecto">●</span>}
                        </button>
                      );
                    })}
                  </div>
                  {errors.diasCursada && <div className="text-danger mt-1" style={{ fontSize: '0.78rem' }}>{errors.diasCursada.message}</div>}
                </div>

                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Fecha Inicio *</label>
                  <input type="date" className={`form-control ${errors.fechaInicio ? 'is-invalid' : ''}`} style={inputStyle} {...register('fechaInicio')} />
                  {errors.fechaInicio && <div className="invalid-feedback">{errors.fechaInicio.message}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Fecha Fin *</label>
                  <input type="date" className={`form-control ${errors.fechaFin ? 'is-invalid' : ''}`} style={inputStyle} {...register('fechaFin')} />
                  {errors.fechaFin && <div className="invalid-feedback">{errors.fechaFin.message}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Estado</label>
                  <select className="form-select" style={inputStyle} {...register('status')}>
                    <option value="activo">Activo</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-sm text-muted" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-sm fw-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }} disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-1" />}
                  {editando ? 'Guardar Cambios' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CursosPage;
