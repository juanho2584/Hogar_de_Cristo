/**
 * @fileoverview InternosPage — CRUD completo de internos.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Search, Edit2, Trash2, X, UserCheck, UserX, AlertOctagon, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useInternosStore from '../store/internosStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import usePermisos from '../hooks/usePermisos.js';
import { internoSchema } from '../utils/validators.js';
import { exportToCsv, importFromCsv, CSV_CONFIG } from '../services/csv/csvService.js';
import { formatearFechaCorta, hoyISO } from '../utils/dateUtils.js';

const PABELLONES = ['A', 'B', 'C', 'D', 'E', 'Norte', 'Sur', 'Este', 'Oeste'];
const STATUS_LABELS = { activo: 'Activo', inactivo: 'Inactivo', suspendido: 'Suspendido' };
const STATUS_COLORS = { activo: 'success', inactivo: 'secondary', suspendido: 'danger' };

const InternosPage = () => {
  const { internos, fetchInternos, createInterno, updateInterno, deleteInterno, loading } = useInternosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { puedeEditar, puedeEliminar } = usePermisos();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(internoSchema),
    defaultValues: { status: 'activo', fechaIngreso: hoyISO() },
  });

  useEffect(() => {
    fetchInternos();
    fetchInscripciones();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    reset({ status: 'activo', fechaIngreso: hoyISO() });
    setShowModal(true);
  };

  const abrirModalEditar = (interno) => {
    setEditando(interno);
    reset(interno);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    reset();
  };

  const onSubmit = async (data) => {
    const result = editando
      ? await updateInterno(editando.id, data)
      : await createInterno(data);

    if (result.ok) {
      toast.success(editando ? 'Interno actualizado correctamente.' : 'Interno registrado correctamente.');
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const confirmarEliminar = (interno) => {
    if (window.confirm(`¿Eliminar a ${interno.apellidoPaterno} ${interno.nombreCompleto}? Esta acción no se puede deshacer.`)) {
      handleEliminar(interno.id);
    }
  };

  const handleEliminar = async (id) => {
    const result = await deleteInterno(id);
    if (result.ok) {
      toast.success('Interno eliminado.');
    } else {
      toast.error(result.error);
    }
  };

  const handleExportar = () => {
    exportToCsv(internos, CSV_CONFIG.internos.filename, CSV_CONFIG.internos.fields);
    toast.success('CSV exportado correctamente.');
  };

  const handleImportar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await importFromCsv(file);
      let creados = 0;
      for (const row of data) {
        const result = await createInterno(row);
        if (result.ok) creados++;
      }
      toast.success(`${creados} internos importados correctamente.`);
      e.target.value = '';
    } catch {
      toast.error('Error al importar el archivo CSV.');
    }
  };

  // Filtrado
  const internosFiltrados = internos.filter((i) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      i.apellidoPaterno?.toLowerCase().includes(q) ||
      i.apellidoMaterno?.toLowerCase().includes(q) ||
      i.nombreCompleto?.toLowerCase().includes(q) ||
      i.dni?.includes(q) ||
      i.fichaCriminologica?.toLowerCase().includes(q);
    const matchStatus = filtroStatus === 'todos' || i.status === filtroStatus;
    return matchBusqueda && matchStatus;
  });

  const getInscripcionActiva = (internoId) =>
    inscripciones.find((ins) => ins.internoId === internoId && ins.status === 'activo') || null;

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
  };

  return (
    <MainLayout titulo="Internos" subtitulo={`${internos.length} internos registrados`}>
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text" style={{ ...inputStyle, color: '#6366f1' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, DNI o ficha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={inputStyle}
          />
        </div>

        <select
          className="form-select"
          style={{ ...inputStyle, width: 'auto' }}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="suspendido">Suspendidos</option>
        </select>

        <div className="ms-auto d-flex gap-2">
          {puedeEditar && (
            <>
              <label
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
              >
                <Upload size={14} /> Importar CSV
                <input type="file" accept=".csv" className="d-none" onChange={handleImportar} />
              </label>
              <button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
                onClick={handleExportar}
              >
                <Download size={14} /> Exportar CSV
              </button>
              <button
                id="btn-nuevo-interno"
                className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
                onClick={abrirModalNuevo}
              >
                <Plus size={14} /> Nuevo Interno
              </button>
            </>
          )}
          {!puedeEditar && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
              onClick={handleExportar}
            >
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="rounded-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : internosFiltrados.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <UserX size={48} className="mb-3 opacity-50" />
            <p>No se encontraron internos.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th className="text-muted fw-normal py-3 ps-4">Apellidos y Nombre</th>
                  <th className="text-muted fw-normal py-3">DNI</th>
                  <th className="text-muted fw-normal py-3">Ficha Crim.</th>
                  <th className="text-muted fw-normal py-3">Pabellón / Celda</th>
                  <th className="text-muted fw-normal py-3">Inscripción</th>
                  <th className="text-muted fw-normal py-3">Estado</th>
                  <th className="text-muted fw-normal py-3">Ingreso</th>
                  {(puedeEditar || puedeEliminar) && (
                    <th className="text-muted fw-normal py-3 text-center">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {internosFiltrados.map((interno) => {
                  const inscActiva = getInscripcionActiva(interno.id);
                  return (
                    <tr key={interno.id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-3 ps-4">
                        <div className="text-white fw-semibold">
                          {interno.apellidoPaterno} {interno.apellidoMaterno}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{interno.nombreCompleto}</div>
                      </td>
                      <td className="py-3 text-muted">{interno.dni}</td>
                      <td className="py-3">
                        <span className="badge bg-dark" style={{ border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
                          {interno.fichaCriminologica}
                        </span>
                      </td>
                      <td className="py-3 text-muted">
                        Pab. <span className="text-white">{interno.pabellon}</span> — Celda {interno.celda}
                      </td>
                      <td className="py-3">
                        {inscActiva ? (
                          <span className="badge bg-success bg-opacity-25 text-success" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                            <UserCheck size={11} className="me-1" />Inscripto
                          </span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-25 text-secondary">Sin inscripción</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`badge bg-${STATUS_COLORS[interno.status]} bg-opacity-25 text-${STATUS_COLORS[interno.status]}`}>
                          {STATUS_LABELS[interno.status]}
                        </span>
                      </td>
                      <td className="py-3 text-muted">{formatearFechaCorta(interno.fechaIngreso)}</td>
                      {(puedeEditar || puedeEliminar) && (
                        <td className="py-3 text-center">
                          <div className="d-flex justify-content-center gap-1">
                            {puedeEditar && (
                              <button
                                className="btn btn-sm rounded-2"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: 'none', padding: '4px 8px' }}
                                onClick={() => abrirModalEditar(interno)}
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            {puedeEliminar && (
                              <button
                                className="btn btn-sm rounded-2"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', padding: '4px 8px' }}
                                onClick={() => confirmarEliminar(interno)}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contador */}
      {!loading && (
        <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
          Mostrando {internosFiltrados.length} de {internos.length} internos
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div
          className="modal d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', position: 'fixed', inset: 0, zIndex: 2000, backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div
            className="rounded-4 p-4 w-100"
            style={{
              maxWidth: 600,
              background: '#161b2e',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h2 className="h5 text-white mb-0 fw-bold">
                {editando ? 'Editar Interno' : 'Nuevo Interno'}
              </h2>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none' }}
                onClick={cerrarModal}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="row g-3">
                {/* Apellido Paterno */}
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Apellido Paterno *</label>
                  <input className={`form-control ${errors.apellidoPaterno ? 'is-invalid' : ''}`} style={inputStyle} {...register('apellidoPaterno')} />
                  {errors.apellidoPaterno && <div className="invalid-feedback">{errors.apellidoPaterno.message}</div>}
                </div>
                {/* Apellido Materno */}
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Apellido Materno *</label>
                  <input className={`form-control ${errors.apellidoMaterno ? 'is-invalid' : ''}`} style={inputStyle} {...register('apellidoMaterno')} />
                  {errors.apellidoMaterno && <div className="invalid-feedback">{errors.apellidoMaterno.message}</div>}
                </div>
                {/* Nombre completo */}
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Nombre/s Completo/s *</label>
                  <input className={`form-control ${errors.nombreCompleto ? 'is-invalid' : ''}`} style={inputStyle} {...register('nombreCompleto')} />
                  {errors.nombreCompleto && <div className="invalid-feedback">{errors.nombreCompleto.message}</div>}
                </div>
                {/* DNI */}
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>DNI *</label>
                  <input className={`form-control ${errors.dni ? 'is-invalid' : ''}`} style={inputStyle} {...register('dni')} placeholder="30123456" />
                  {errors.dni && <div className="invalid-feedback">{errors.dni.message}</div>}
                </div>
                {/* Ficha criminológica */}
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Ficha Criminológica *</label>
                  <input className={`form-control ${errors.fichaCriminologica ? 'is-invalid' : ''}`} style={inputStyle} {...register('fichaCriminologica')} placeholder="FC-2025-001" />
                  {errors.fichaCriminologica && <div className="invalid-feedback">{errors.fichaCriminologica.message}</div>}
                </div>
                {/* Pabellón */}
                <div className="col-4">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Pabellón *</label>
                  <select className={`form-select ${errors.pabellon ? 'is-invalid' : ''}`} style={inputStyle} {...register('pabellon')}>
                    <option value="">Seleccionar</option>
                    {PABELLONES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.pabellon && <div className="invalid-feedback">{errors.pabellon.message}</div>}
                </div>
                {/* Celda */}
                <div className="col-4">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Celda *</label>
                  <input className={`form-control ${errors.celda ? 'is-invalid' : ''}`} style={inputStyle} {...register('celda')} placeholder="01" />
                  {errors.celda && <div className="invalid-feedback">{errors.celda.message}</div>}
                </div>
                {/* Estado */}
                <div className="col-4">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Estado *</label>
                  <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} style={inputStyle} {...register('status')}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
                {/* Fecha ingreso */}
                <div className="col-6">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Fecha de Ingreso al Programa *</label>
                  <input type="date" className={`form-control ${errors.fechaIngreso ? 'is-invalid' : ''}`} style={inputStyle} {...register('fechaIngreso')} />
                  {errors.fechaIngreso && <div className="invalid-feedback">{errors.fechaIngreso.message}</div>}
                </div>
                {/* Notas */}
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Notas / Observaciones</label>
                  <textarea className="form-control" style={{ ...inputStyle, resize: 'none' }} rows={2} {...register('notas')} />
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-sm text-muted" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={cerrarModal}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm fw-semibold"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
                  disabled={loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  {editando ? 'Guardar Cambios' : 'Registrar Interno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InternosPage;
