/**
 * @fileoverview UsuariosPage — Gestión de usuarios del sistema (solo rol ADMIN).
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Edit2, Trash2, X, Users, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useUsuariosStore from '../store/usuariosStore.js';
import useAuthStore from '../store/authStore.js';
import { usuarioSchema } from '../utils/validators.js';

const UsuariosPage = () => {
  const { usuarios, fetchUsuarios, createUsuario, updateUsuario, deleteUsuario, loading } = useUsuariosStore();
  const { usuario: usuarioActual } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(usuarioSchema),
    defaultValues: { rol: 'user' },
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    reset({ nombre: '', email: '', rol: 'user', password: '' });
    setShowModal(true);
  };

  const abrirModalEditar = (u) => {
    setEditando(u);
    reset({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    reset();
  };

  const onSubmit = async (data) => {
    // Si estamos editando y no cambió la password, no la mandamos
    const payload = { ...data };
    if (editando && !payload.password) {
      delete payload.password;
    }

    if (!editando && !payload.password) {
      toast.error('La contraseña es requerida para nuevos usuarios.');
      return;
    }

    const result = editando
      ? await updateUsuario(editando.id, payload)
      : await createUsuario(payload);

    if (result.ok) {
      toast.success(editando ? 'Usuario actualizado con éxito.' : 'Usuario creado con éxito.');
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const confirmarEliminar = (u) => {
    if (u.id === usuarioActual?.id) {
      toast.error('No podés eliminar tu propia cuenta de usuario en uso.');
      return;
    }
    if (window.confirm(`¿Eliminar al usuario ${u.nombre}? Esta acción es irreversible.`)) {
      handleEliminar(u.id);
    }
  };

  const handleEliminar = async (id) => {
    const res = await deleteUsuario(id);
    if (res.ok) {
      toast.success('Usuario eliminado.');
    } else {
      toast.error(res.error);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
  };

  return (
    <MainLayout titulo="Gestión de Usuarios" subtitulo="Control de acceso y roles del personal educativo">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          Total de cuentas activas: <strong className="text-white">{usuarios.length}</strong>
        </div>
        <button
          className="btn btn-sm d-flex align-items-center gap-1 fw-semibold px-3 py-2"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
          onClick={abrirModalNuevo}
        >
          <Plus size={15} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div
        className="rounded-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Users size={48} className="mb-3 opacity-40" />
            <p>No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th className="text-muted fw-normal py-3 ps-4">Nombre y Apellido</th>
                  <th className="text-muted fw-normal py-3">Correo Electrónico</th>
                  <th className="text-muted fw-normal py-3">Rol del Sistema</th>
                  <th className="text-muted fw-normal py-3">Estado</th>
                  <th className="text-muted fw-normal py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {usuarios.map((u) => (
                  <tr key={u.id} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="py-3 ps-4 align-middle">
                      <div className="text-white fw-semibold">{u.nombre}</div>
                      {u.id === usuarioActual?.id && (
                        <span className="badge bg-secondary bg-opacity-50 text-light" style={{ fontSize: '0.7rem' }}>
                          (Sesión actual)
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-middle text-muted font-monospace">{u.email}</td>
                    <td className="py-3 align-middle">
                      {u.rol === 'admin' ? (
                        <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 d-inline-flex align-items-center gap-1">
                          <Shield size={12} /> Administrador
                        </span>
                      ) : (
                        <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">
                          Docente / Preceptor
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-middle">
                      <span className="badge bg-success bg-opacity-25 text-success">
                        {u.status || 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 align-middle text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-sm rounded-2"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: 'none', padding: '4px 8px' }}
                          onClick={() => abrirModalEditar(u)}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm rounded-2"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', padding: '4px 8px' }}
                          onClick={() => confirmarEliminar(u)}
                          disabled={u.id === usuarioActual?.id}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
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
              <h2 className="h5 text-white mb-0 fw-bold">
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none' }} onClick={cerrarModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Nombre Completo *</label>
                  <input className={`form-control ${errors.nombre ? 'is-invalid' : ''}`} style={inputStyle} {...register('nombre')} placeholder="Prof. Juan Pérez" />
                  {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Correo Electrónico *</label>
                  <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} style={inputStyle} {...register('email')} placeholder="docente@hogar.edu" />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>Rol en el Sistema *</label>
                  <select className={`form-select ${errors.rol ? 'is-invalid' : ''}`} style={inputStyle} {...register('rol')}>
                    <option value="user">Docente / Preceptor (Acceso restringido)</option>
                    <option value="admin">Administrador (Acceso total)</option>
                  </select>
                  {errors.rol && <div className="invalid-feedback">{errors.rol.message}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label text-muted" style={{ fontSize: '0.8rem' }}>
                    {editando ? 'Nueva Contraseña (dejar vacío para conservar actual)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    style={inputStyle}
                    {...register('password')}
                    placeholder={editando ? '••••••••' : 'Mínimo 6 caracteres'}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
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
                  {loading && <span className="spinner-border spinner-border-sm me-1" />}
                  {editando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UsuariosPage;
