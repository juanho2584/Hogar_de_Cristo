/**
 * @fileoverview CursosPage — CRUD y gestión académica de cursos/materias responsivo.
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
const STATUS_BADGE_STYLE = {
  activo: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  finalizado: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  cancelado: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};
const TODOS_LOS_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const CursosPage = () => {
  const { cursos, fetchCursos, createCurso, updateCurso, deleteCurso, loading } = useCursosStore();
  const { usuarios, fetchUsuarios } = useUsuariosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { puedeEditar, puedeEliminar } = usePermisos();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
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
    reset({
      nombre: '',
      codigo: '',
      descripcion: '',
      docenteId: '',
      fechaInicio: '',
      fechaFin: '',
      diasCursada: ACADEMIC_CONFIG.diasLectivos,
      status: 'activo',
    });
    setShowModal(true);
  };

  const abrirModalEditar = (curso) => {
    setEditando(curso);
    reset({
      ...curso,
      diasCursada:
        typeof curso.diasCursada === 'string'
          ? curso.diasCursada.split(',')
          : curso.diasCursada,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    reset();
  };

  const toggleDia = (dia) => {
    const actual = watch('diasCursada') || [];
    if (actual.includes(dia)) {
      setValue('diasCursada', actual.filter((d) => d !== dia));
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

  const getDocente = (docenteId) => usuarios.find((u) => u.id === docenteId);
  const getCantidadInscriptos = (cursoId) =>
    inscripciones.filter((i) => i.cursoId === cursoId && i.status === 'activo').length;

  return (
    <MainLayout titulo="Cursos / Materias" subtitulo={`${cursos.length} cursos registrados en el programa`}>
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          Oferta académica activa: <strong style={{ color: 'var(--text-heading)' }}>{cursos.filter(c => c.status === 'activo').length}</strong>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-1 rounded-3 px-3 py-2"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
            }}
            onClick={() => {
              exportToCsv(cursos, CSV_CONFIG.cursos.filename, CSV_CONFIG.cursos.fields);
              toast.success('CSV exportado.');
            }}
          >
            <Download size={14} /> Exportar CSV
          </button>
          {puedeEditar && (
            <button
              id="btn-nuevo-curso"
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold rounded-3 px-3 py-2"
              style={{
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px var(--primary-glow)',
              }}
              onClick={abrirModalNuevo}
            >
              <Plus size={16} /> Nuevo Curso
            </button>
          )}
        </div>
      </div>

      {/* Grid de Cursos Responsivo */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--primary-accent)' }} />
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <BookOpen size={48} className="mb-3 opacity-50" />
          <p>No hay cursos registrados actualmente.</p>
        </div>
      ) : (
        <div className="row g-3">
          {cursos.map((curso) => {
            const docente = getDocente(curso.docenteId);
            const inscriptos = getCantidadInscriptos(curso.id);
            const dias =
              typeof curso.diasCursada === 'string'
                ? curso.diasCursada.split(',')
                : curso.diasCursada || [];
            const badgeStyle = STATUS_BADGE_STYLE[curso.status] || STATUS_BADGE_STYLE.activo;

            return (
              <div key={curso.id} className="col-12 col-md-6 col-xl-4">
                <div
                  className="app-card rounded-4 p-3 p-md-4 h-100 d-flex flex-column"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Header de Card */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <span className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                        {curso.codigo}
                      </span>
                      <h3 className="h6 mb-0 fw-bold text-truncate" style={{ color: 'var(--text-heading)', maxWidth: 220 }}>
                        {curso.nombre}
                      </h3>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        fontSize: '0.75rem',
                      }}
                    >
                      {STATUS_LABELS[curso.status] || curso.status}
                    </span>
                  </div>

                  {/* Descripción */}
                  {curso.descripcion && (
                    <p className="text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                      {curso.descripcion}
                    </p>
                  )}

                  {/* Info */}
                  <div className="d-flex flex-column gap-2 mb-3 flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Docente:</span>
                      <span className="fw-semibold" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {docente?.nombre || 'Sin asignar'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Inscriptos:</span>
                      <span className="fw-semibold" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {inscriptos} alumnos
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Período:</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {formatearFechaCorta(curso.fechaInicio)} → {formatearFechaCorta(curso.fechaFin)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted d-block mb-1" style={{ fontSize: '0.8rem' }}>
                        Días de cursada:
                      </span>
                      <div className="d-flex flex-wrap gap-1">
                        {dias.map((dia) => (
                          <span
                            key={dia}
                            className="badge"
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--primary-accent)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.7rem',
                            }}
                          >
                            {DIAS_NOMBRES[dia] || dia}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {(puedeEditar || puedeEliminar) && (
                    <div className="d-flex gap-2 pt-3 border-top border-secondary border-opacity-25">
                      {puedeEditar && (
                        <button
                          type="button"
                          className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 rounded-3"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary-accent)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                          }}
                          onClick={() => abrirModalEditar(curso)}
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          type="button"
                          className="btn btn-sm rounded-3 px-3"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--danger-color)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
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

      {/* Modal Crear / Editar */}
      {showModal && (
        <div
          className="app-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="app-modal-content" style={{ maxWidth: '580px' }}>
            <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h2 className="h5 mb-0 fw-bold" style={{ color: 'var(--text-heading)' }}>
                {editando ? 'Editar Curso' : 'Nuevo Curso'}
              </h2>
              <button
                type="button"
                className="btn btn-sm p-1 rounded-2"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
                onClick={cerrarModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <form id="form-curso" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Nombre del Curso *
                    </label>
                    <input
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register('nombre')}
                      placeholder="Carpintería Básica"
                    />
                    {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Código *
                    </label>
                    <input
                      className={`form-control ${errors.codigo ? 'is-invalid' : ''}`}
                      {...register('codigo')}
                      placeholder="CARP-101"
                    />
                    {errors.codigo && <div className="invalid-feedback">{errors.codigo.message}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Docente Responsable *
                    </label>
                    <select
                      className={`form-select ${errors.docenteId ? 'is-invalid' : ''}`}
                      {...register('docenteId')}
                    >
                      <option value="">-- Seleccionar Docente --</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.email})
                        </option>
                      ))}
                    </select>
                    {errors.docenteId && <div className="invalid-feedback">{errors.docenteId.message}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.fechaInicio ? 'is-invalid' : ''}`}
                      {...register('fechaInicio')}
                    />
                    {errors.fechaInicio && (
                      <div className="invalid-feedback">{errors.fechaInicio.message}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.fechaFin ? 'is-invalid' : ''}`}
                      {...register('fechaFin')}
                    />
                    {errors.fechaFin && <div className="invalid-feedback">{errors.fechaFin.message}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Días de cursada *
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {TODOS_LOS_DIAS.map((dia) => {
                        const activo = diasSeleccionados.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            className="btn btn-sm rounded-3"
                            style={{
                              background: activo ? 'var(--primary-gradient)' : 'var(--bg-input)',
                              color: activo ? '#ffffff' : 'var(--text-muted)',
                              border: activo ? 'none' : '1px solid var(--border-subtle)',
                              fontSize: '0.78rem',
                            }}
                            onClick={() => toggleDia(dia)}
                          >
                            {DIAS_NOMBRES[dia]}
                          </button>
                        );
                      })}
                    </div>
                    {errors.diasCursada && (
                      <div className="text-danger mt-1" style={{ fontSize: '0.75rem' }}>
                        {errors.diasCursada.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Estado del Curso *
                    </label>
                    <select
                      className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                      {...register('status')}
                    >
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status.message}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      {...register('descripcion')}
                      placeholder="Objetivos, temario y requisitos..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="app-modal-footer">
              <button
                type="button"
                className="btn btn-sm px-3 rounded-3"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-curso"
                className="btn btn-sm fw-semibold px-3 py-2 rounded-3"
                style={{
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                }}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-1" />}
                {editando ? 'Guardar Cambios' : 'Crear Curso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CursosPage;
