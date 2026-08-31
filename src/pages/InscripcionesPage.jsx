/**
 * @fileoverview InscripcionesPage — Gestión de inscripciones (solo ADMIN).
 * Aplica la regla de negocio: 1 inscripción activa por interno.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Trash2, X, ClipboardList, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useInternosStore from '../store/internosStore.js';
import useCursosStore from '../store/cursosStore.js';
import { inscripcionSchema } from '../utils/validators.js';
import { hoyISO, formatearFechaCorta } from '../utils/dateUtils.js';
import { exportToCsv, CSV_CONFIG } from '../services/csv/csvService.js';
import { Download } from 'lucide-react';

const STATUS_LABELS = { activo: 'Activo', completado: 'Completado', baja: 'Baja' };
const STATUS_COLORS = { activo: 'success', completado: 'info', baja: 'danger' };

const InscripcionesPage = () => {
  const { inscripciones, fetchInscripciones, createInscripcion, updateInscripcion, deleteInscripcion, loading } = useInscripcionesStore();
  const { internos, fetchInternos } = useInternosStore();
  const { cursos, fetchCursos } = useCursosStore();

  const [showModal, setShowModal] = useState(false);
  const [filtroCurso, setFiltroCurso] = useState('todos');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(inscripcionSchema),
    defaultValues: { fechaInscripcion: hoyISO() },
  });

  const internoSeleccionadoId = watch('internoId');
  const inscripcionActiva = internoSeleccionadoId
    ? inscripciones.find(i => i.internoId === internoSeleccionadoId && i.status === 'activo')
    : null;

  useEffect(() => {
    fetchInscripciones();
    fetchInternos();
    fetchCursos();
  }, []);

  const cerrarModal = () => { setShowModal(false); reset(); };

  const onSubmit = async (data) => {
    const result = await createInscripcion(data);
    if (result.ok) {
      toast.success('Inscripción creada correctamente.');
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleDarBaja = async (id) => {
    if (!window.confirm('¿Dar de baja esta inscripción?')) return;
    const result = await updateInscripcion(id, { status: 'baja' });
    if (result.ok) toast.success('Inscripción dada de baja.');
    else toast.error(result.error);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta inscripción permanentemente?')) return;
    const result = await deleteInscripcion(id);
    if (result.ok) toast.success('Inscripción eliminada.');
    else toast.error(result.error);
  };

  const getInterno = (id) => internos.find(i => i.id === id);
  const getCurso = (id) => cursos.find(c => c.id === id);

  const internosSinInscripcionActiva = internos.filter(
    i => !inscripciones.some(ins => ins.internoId === i.id && ins.status === 'activo')
  );

  const inscripcionesFiltradas = inscripciones.filter(i =>
    filtroCurso === 'todos' || i.cursoId === filtroCurso
  );

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
  };

  return (
    <MainLayout titulo="Inscripciones" subtitulo="Gestión de asignación de internos a cursos">
      {/* Info regla de negocio */}
      <div
        className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <UserCheck size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
        <span className="text-muted" style={{ fontSize: '0.83rem' }}>
          <strong className="text-white">Regla de inscripción única:</strong> Cada interno solo puede tener una inscripción activa simultáneamente. Para inscribirlo en otro curso, primero debe darse de baja del actual.
        </span>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <select
          className="form-select"
          style={{ ...inputStyle, width: 'auto' }}
          value={filtroCurso}
          onChange={e => setFiltroCurso(e.target.value)}
        >
          <option value="todos">Todos los cursos</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
            onClick={() => { exportToCsv(inscripciones, CSV_CONFIG.inscripciones.filename, CSV_CONFIG.inscripciones.fields); toast.success('CSV exportado.'); }}
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            id="btn-nueva-inscripcion"
            className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
            onClick={() => { reset({ fechaInscripcion: hoyISO() }); setShowModal(true); }}
          >
            <Plus size={14} /> Nueva Inscripción
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div
        className="rounded-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : inscripcionesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <ClipboardList size={48} className="mb-3 opacity-50" />
            <p>No hay inscripciones registradas.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th className="text-muted fw-normal py-3 ps-4">Interno</th>
                  <th className="text-muted fw-normal py-3">Pab. / Celda</th>
                  <th className="text-muted fw-normal py-3">Curso</th>
                  <th className="text-muted fw-normal py-3">Fecha Inscripción</th>
                  <th className="text-muted fw-normal py-3">Estado</th>
                  <th className="text-muted fw-normal py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {inscripcionesFiltradas.map((ins) => {
                  const interno = getInterno(ins.internoId);
                  const curso = getCurso(ins.cursoId);
                  return (
                    <tr key={ins.id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-3 ps-4">
                        <div className="text-white fw-semibold">
                          {interno ? `${interno.apellidoPaterno} ${interno.apellidoMaterno}` : ins.internoId}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {interno?.nombreCompleto} — DNI: {interno?.dni}
                        </div>
                      </td>
                      <td className="py-3 text-muted" style={{ fontSize: '0.82rem' }}>
                        {interno ? `Pab. ${interno.pabellon} — Celda ${interno.celda}` : '—'}
                      </td>
                      <td className="py-3">
                        <div className="text-white">{curso?.nombre || ins.cursoId}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{curso?.codigo}</div>
                      </td>
                      <td className="py-3 text-muted">{formatearFechaCorta(ins.fechaInscripcion)}</td>
                      <td className="py-3">
                        <span className={`badge bg-${STATUS_COLORS[ins.status]} bg-opacity-25 text-${STATUS_COLORS[ins.status]}`}>
                          {STATUS_LABELS[ins.status]}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex justify-content-center gap-1">
                          {ins.status === 'activo' && (
                            <button
                              className="btn btn-sm rounded-2"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', fontSize: '0.75rem', padding: '3px 8px' }}
                              onClick={() => handleDarBaja(ins.id)}
                            >
                              Dar de baja
                            </button>
                          )}
                          <button
                            className="btn btn-sm rounded-2"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '4px 8px' }}
                            onClick={() => handleEliminar(ins.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* Modal nueva inscripción */}
      {showModal && (
        <div
          className="modal d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', position: 'fixed', inset: 0, zIndex: 2000, backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div
            className="rounded-4 p-4 w-100"
            style={{ maxWidth: 480, background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h2 className="h5 text-white mb-0 fw-bold">Nueva Inscripción</h2>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none' }} onClick={cerrarModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Interno *</label>
                  <select className={`form-select ${errors.internoId ? 'is-invalid' : ''}`} style={inputStyle} {...register('internoId')}>
                    <option value="">Seleccionar interno...</option>
                    {internos.map(i => {
                      const tieneActiva = inscripciones.some(ins => ins.internoId === i.id && ins.status === 'activo');
                      return (
                        <option key={i.id} value={i.id} disabled={tieneActiva}>
                          {i.apellidoPaterno} {i.apellidoMaterno}, {i.nombreCompleto}
                          {tieneActiva ? ' (ya inscripto)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {errors.internoId && <div className="invalid-feedback">{errors.internoId.message}</div>}
                  {inscripcionActiva && (
                    <div className="mt-1 text-warning" style={{ fontSize: '0.78rem' }}>
                      ⚠ Este interno ya tiene una inscripción activa.
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Curso *</label>
                  <select className={`form-select ${errors.cursoId ? 'is-invalid' : ''}`} style={inputStyle} {...register('cursoId')}>
                    <option value="">Seleccionar curso...</option>
                    {cursos.filter(c => c.status === 'activo').map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.codigo}</option>
                    ))}
                  </select>
                  {errors.cursoId && <div className="invalid-feedback">{errors.cursoId.message}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Fecha de Inscripción *</label>
                  <input type="date" className={`form-control ${errors.fechaInscripcion ? 'is-invalid' : ''}`} style={inputStyle} {...register('fechaInscripcion')} />
                  {errors.fechaInscripcion && <div className="invalid-feedback">{errors.fechaInscripcion.message}</div>}
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-sm text-muted" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-sm fw-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }} disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-1" />}
                  Crear Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InscripcionesPage;
