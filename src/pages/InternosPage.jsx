/**
 * @fileoverview InternosPage — CRUD completo y gestión de internos responsivo.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Download,
  Upload,
  Filter,
} from 'lucide-react';
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
const STATUS_BADGE_STYLE = {
  activo: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  inactivo: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
  suspendido: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

const InternosPage = () => {
  const { internos, fetchInternos, createInterno, updateInterno, deleteInterno, loading } = useInternosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { puedeEditar, puedeEliminar } = usePermisos();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(internoSchema),
    defaultValues: { status: 'activo', fechaIngreso: hoyISO() },
  });

  useEffect(() => {
    fetchInternos();
    fetchInscripciones();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    reset({
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombreCompleto: '',
      dni: '',
      fichaCriminologica: '',
      pabellon: 'A',
      celda: '',
      status: 'activo',
      fechaIngreso: hoyISO(),
      notas: '',
    });
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
    if (
      window.confirm(
        `¿Eliminar a ${interno.apellidoPaterno} ${interno.nombreCompleto}? Esta acción no se puede deshacer.`
      )
    ) {
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
      toast.success(`Importación finalizada: ${creados} registros cargados.`);
      fetchInternos();
    } catch {
      toast.error('Error al procesar el archivo CSV.');
    }
    e.target.value = '';
  };

  // Filtrado de internos
  const internosFiltrados = internos.filter((i) => {
    const coincideStatus = filtroStatus === 'todos' || i.status === filtroStatus;
    const q = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !q ||
      i.nombreCompleto?.toLowerCase().includes(q) ||
      i.apellidoPaterno?.toLowerCase().includes(q) ||
      i.apellidoMaterno?.toLowerCase().includes(q) ||
      i.dni?.toLowerCase().includes(q) ||
      i.fichaCriminologica?.toLowerCase().includes(q) ||
      i.pabellon?.toLowerCase().includes(q) ||
      i.celda?.toLowerCase().includes(q);
    return coincideStatus && coincideBusqueda;
  });

  return (
    <MainLayout
      titulo="Gestión de Internos"
      subtitulo="Padrón general de la población penal y seguimiento institucional"
    >
      {/* Barra de herramientas responsiva */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        {/* Buscador + Filtro Estado */}
        <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: '640px' }}>
          <div className="input-group flex-grow-1">
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
              placeholder="Buscar por DNI, Ficha, Nombre o Pabellón..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select"
              style={{ minWidth: 140 }}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {puedeEditar && (
            <label
              className="btn btn-sm d-flex align-items-center gap-1 rounded-3 px-3 py-2 cursor-pointer mb-0"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              <Upload size={14} />
              <span>Importar CSV</span>
              <input type="file" accept=".csv" className="d-none" onChange={handleImportar} />
            </label>
          )}

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
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>

          {puedeEditar && (
            <button
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
              <Plus size={16} />
              <span>Nuevo Interno</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div
        className="app-card rounded-4 overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary-accent)' }} />
          </div>
        ) : internosFiltrados.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Filter size={44} className="mb-2 opacity-50" />
            <p className="mb-0">No se encontraron internos registrados con los criterios ingresados.</p>
          </div>
        ) : (
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
                    Interno / DNI
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Ficha Crim.
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Ubicación
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Fecha Ingreso
                  </th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>
                    Estado
                  </th>
                  {puedeEditar && (
                    <th className="py-3 text-center pe-4" style={{ color: 'var(--text-muted)' }}>
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {internosFiltrados.map((interno) => {
                  const tieneInscripcion = inscripciones.some(
                    (i) => i.internoId === interno.id && i.status === 'activo'
                  );
                  const badgeStyle = STATUS_BADGE_STYLE[interno.status] || STATUS_BADGE_STYLE.activo;

                  return (
                    <tr key={interno.id} style={{ borderColor: 'var(--border-subtle)' }}>
                      {/* Nombre & DNI */}
                      <td className="py-3 ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: 32,
                              height: 32,
                              background: 'var(--primary-gradient)',
                              fontSize: '0.78rem',
                              flexShrink: 0,
                            }}
                          >
                            {interno.apellidoPaterno?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: 'var(--text-heading)' }}>
                              {interno.apellidoPaterno} {interno.apellidoMaterno}, {interno.nombreCompleto}
                            </div>
                            <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                              DNI: {interno.dni}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ficha */}
                      <td className="py-3 font-monospace" style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                        {interno.fichaCriminologica}
                      </td>

                      {/* Pabellón / Celda */}
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

                      {/* Fecha de Ingreso */}
                      <td className="py-3 text-muted" style={{ fontSize: '0.82rem' }}>
                        {formatearFechaCorta(interno.fechaIngreso)}
                      </td>

                      {/* Estado */}
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-1">
                          <span
                            className="badge"
                            style={{
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`,
                              fontSize: '0.75rem',
                            }}
                          >
                            {STATUS_LABELS[interno.status] || interno.status}
                          </span>
                          {tieneInscripcion && (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: 'var(--primary-accent)',
                                fontSize: '0.68rem',
                              }}
                              title="Inscrito actualmente en un curso"
                            >
                              <UserCheck size={11} className="me-1" />
                              Cursando
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      {puedeEditar && (
                        <td className="py-3 text-center pe-4">
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              type="button"
                              className="btn btn-sm rounded-2 p-2"
                              style={{
                                background: 'rgba(99,102,241,0.15)',
                                color: 'var(--primary-accent)',
                                border: '1px solid var(--border-subtle)',
                              }}
                              onClick={() => abrirModalEditar(interno)}
                              title="Editar interno"
                            >
                              <Edit2 size={14} />
                            </button>
                            {puedeEliminar && (
                              <button
                                type="button"
                                className="btn btn-sm rounded-2 p-2"
                                style={{
                                  background: 'rgba(239,68,68,0.15)',
                                  color: 'var(--danger-color)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                }}
                                onClick={() => confirmarEliminar(interno)}
                                title="Eliminar interno"
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

      {/* Modal Crear / Editar */}
      {showModal && (
        <div
          className="app-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="app-modal-content" style={{ maxWidth: '640px' }}>
            <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h2 className="h5 mb-0 fw-bold" style={{ color: 'var(--text-heading)' }}>
                {editando ? 'Editar Ficha de Interno' : 'Registrar Nuevo Interno'}
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
              <form id="form-interno" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Apellido Paterno *
                    </label>
                    <input
                      className={`form-control ${errors.apellidoPaterno ? 'is-invalid' : ''}`}
                      {...register('apellidoPaterno')}
                      placeholder="González"
                    />
                    {errors.apellidoPaterno && (
                      <div className="invalid-feedback">{errors.apellidoPaterno.message}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Apellido Materno *
                    </label>
                    <input
                      className={`form-control ${errors.apellidoMaterno ? 'is-invalid' : ''}`}
                      {...register('apellidoMaterno')}
                      placeholder="López"
                    />
                    {errors.apellidoMaterno && (
                      <div className="invalid-feedback">{errors.apellidoMaterno.message}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Nombre(s) Completo(s) *
                    </label>
                    <input
                      className={`form-control ${errors.nombreCompleto ? 'is-invalid' : ''}`}
                      {...register('nombreCompleto')}
                      placeholder="Carlos Alberto"
                    />
                    {errors.nombreCompleto && (
                      <div className="invalid-feedback">{errors.nombreCompleto.message}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      DNI (7 u 8 dígitos) *
                    </label>
                    <input
                      className={`form-control ${errors.dni ? 'is-invalid' : ''}`}
                      {...register('dni')}
                      placeholder="12345678"
                    />
                    {errors.dni && <div className="invalid-feedback">{errors.dni.message}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Ficha Criminológica *
                    </label>
                    <input
                      className={`form-control ${errors.fichaCriminologica ? 'is-invalid' : ''}`}
                      {...register('fichaCriminologica')}
                      placeholder="FC-2025-001"
                    />
                    {errors.fichaCriminologica && (
                      <div className="invalid-feedback">{errors.fichaCriminologica.message}</div>
                    )}
                  </div>

                  <div className="col-6 col-md-4">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Pabellón *
                    </label>
                    <select
                      className={`form-select ${errors.pabellon ? 'is-invalid' : ''}`}
                      {...register('pabellon')}
                    >
                      {PABELLONES.map((p) => (
                        <option key={p} value={p}>
                          Pabellón {p}
                        </option>
                      ))}
                    </select>
                    {errors.pabellon && <div className="invalid-feedback">{errors.pabellon.message}</div>}
                  </div>

                  <div className="col-6 col-md-4">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Celda *
                    </label>
                    <input
                      className={`form-control ${errors.celda ? 'is-invalid' : ''}`}
                      {...register('celda')}
                      placeholder="104"
                    />
                    {errors.celda && <div className="invalid-feedback">{errors.celda.message}</div>}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Estado *
                    </label>
                    <select
                      className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                      {...register('status')}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status.message}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Fecha de Ingreso *
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.fechaIngreso ? 'is-invalid' : ''}`}
                      {...register('fechaIngreso')}
                    />
                    {errors.fechaIngreso && (
                      <div className="invalid-feedback">{errors.fechaIngreso.message}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Observaciones / Notas Adicionales
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      {...register('notas')}
                      placeholder="Detalles sobre conducta, régimen o antecedentes..."
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
                form="form-interno"
                className="btn btn-sm fw-semibold px-3 py-2 rounded-3"
                style={{
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                }}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-1" />}
                {editando ? 'Guardar Cambios' : 'Registrar Interno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InternosPage;
