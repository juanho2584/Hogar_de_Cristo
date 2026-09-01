/**
 * @fileoverview UsuariosPage — Gestión de usuarios del sistema (solo rol ADMIN) con validaciones fuertes y medidor de seguridad.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout.jsx';
import useUsuariosStore from '../store/usuariosStore.js';
import useAuthStore from '../store/authStore.js';
import { usuarioSchema, evaluarFortalezaPassword } from '../utils/validators.js';

const UsuariosPage = () => {
  const { usuarios, fetchUsuarios, createUsuario, updateUsuario, deleteUsuario, loading } = useUsuariosStore();
  const { usuario: usuarioActual } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(usuarioSchema),
    defaultValues: { rol: 'user', nombre: '', email: '', password: '' },
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const passwordStrength = evaluarFortalezaPassword(passwordInput);

  const abrirModalNuevo = () => {
    setEditando(null);
    setPasswordInput('');
    setShowPassword(false);
    reset({ nombre: '', email: '', rol: 'user', password: '' });
    setShowModal(true);
  };

  const abrirModalEditar = (u) => {
    setEditando(u);
    setPasswordInput('');
    setShowPassword(false);
    reset({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setPasswordInput('');
    reset();
  };

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (editando && !payload.password) {
      delete payload.password;
    }

    if (!editando && !payload.password) {
      toast.error('La contraseña es requerida para nuevos usuarios.');
      return;
    }

    if (payload.password && passwordStrength.score < 2) {
      toast.error('La contraseña es muy débil. Debe cumplir con los requisitos mínimos de seguridad.');
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

  return (
    <MainLayout
      titulo="Gestión de Usuarios"
      subtitulo="Control de acceso, roles del personal educativo y directivas de seguridad"
    >
      {/* Toolbar responsivo */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          Cuentas registradas: <strong style={{ color: 'var(--text-heading)' }}>{usuarios.length}</strong>
        </div>
        <button
          className="btn btn-sm d-flex align-items-center justify-content-center gap-1 fw-semibold px-3 py-2 rounded-3"
          style={{
            background: 'var(--primary-gradient)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}
          onClick={abrirModalNuevo}
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div
        className="app-card rounded-4 overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary-accent)' }} />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Users size={48} className="mb-3 opacity-40" />
            <p>No hay usuarios registrados.</p>
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
                  <th className="py-3 ps-4" style={{ color: 'var(--text-muted)' }}>Nombre y Apellido</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>Correo Electrónico</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>Rol del Sistema</th>
                  <th className="py-3" style={{ color: 'var(--text-muted)' }}>Estado</th>
                  <th className="py-3 text-center pe-4" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem' }}>
                {usuarios.map((u) => (
                  <tr key={u.id} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-3 ps-4 align-middle">
                      <div className="fw-semibold" style={{ color: 'var(--text-heading)' }}>
                        {u.nombre}
                      </div>
                      {u.id === usuarioActual?.id && (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--primary-accent)',
                            fontSize: '0.68rem',
                          }}
                        >
                          (Sesión actual)
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-middle font-monospace" style={{ color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td className="py-3 align-middle">
                      {u.rol === 'admin' ? (
                        <span
                          className="badge d-inline-flex align-items-center gap-1"
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          <Shield size={12} /> Administrador
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(6, 182, 212, 0.15)',
                            color: '#06b6d4',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                          }}
                        >
                          Docente / Preceptor
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-middle">
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        {u.status || 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 align-middle text-center pe-4">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm rounded-2 p-2"
                          style={{
                            background: 'rgba(99,102,241,0.15)',
                            color: 'var(--primary-accent)',
                            border: '1px solid var(--border-subtle)',
                          }}
                          onClick={() => abrirModalEditar(u)}
                          title="Editar usuario"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm rounded-2 p-2"
                          style={{
                            background: 'rgba(239,68,68,0.15)',
                            color: 'var(--danger-color)',
                            border: '1px solid rgba(239,68,68,0.3)',
                          }}
                          onClick={() => confirmarEliminar(u)}
                          disabled={u.id === usuarioActual?.id}
                          title={u.id === usuarioActual?.id ? 'No podés eliminar tu propia cuenta' : 'Eliminar usuario'}
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

      {/* Modal Crear / Editar con validación fuerte de seguridad */}
      {showModal && (
        <div
          className="app-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="app-modal-content">
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h2 className="h5 mb-0 fw-bold" style={{ color: 'var(--text-heading)' }}>
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
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

            {/* Modal Body */}
            <div className="app-modal-body">
              <form id="form-usuario" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Nombre Completo *
                    </label>
                    <input
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register('nombre')}
                      placeholder="Prof. Juan Carlos Pérez"
                    />
                    {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email')}
                      placeholder="docente@hogar.edu"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Rol en el Sistema *
                    </label>
                    <select
                      className={`form-select ${errors.rol ? 'is-invalid' : ''}`}
                      {...register('rol')}
                    >
                      <option value="user">Docente / Preceptor (Acceso a asistencia y reportes)</option>
                      <option value="admin">Administrador (Acceso total al sistema)</option>
                    </select>
                    {errors.rol && <div className="invalid-feedback">{errors.rol.message}</div>}
                  </div>

                  {/* Password con fortaleza en tiempo real */}
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {editando ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña Segura *'}
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        {...register('password')}
                        placeholder={editando ? '••••••••' : 'Mínimo 8 caracteres'}
                        onChange={(e) => {
                          setValue('password', e.target.value);
                          setPasswordInput(e.target.value);
                        }}
                      />
                      <button
                        type="button"
                        className="input-group-text"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                    </div>

                    {/* Medidor visual de fortaleza si hay texto */}
                    {passwordInput && (
                      <div className="mt-2 p-2 rounded-3" style={{ background: 'var(--bg-input)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Fortaleza: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: passwordStrength.color }}>
                            {passwordStrength.porcentaje}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: 4, background: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${passwordStrength.porcentaje}%`,
                              backgroundColor: passwordStrength.color,
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </div>

                        {/* Checklist de requisitos de seguridad */}
                        <div className="row g-1 mt-2" style={{ fontSize: '0.72rem' }}>
                          <div className={`col-6 d-flex align-items-center gap-1 ${passwordStrength.checks.length ? 'text-success' : 'text-muted'}`}>
                            {passwordStrength.checks.length ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            8+ caracteres
                          </div>
                          <div className={`col-6 d-flex align-items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-success' : 'text-muted'}`}>
                            {passwordStrength.checks.uppercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            Una mayúscula (A-Z)
                          </div>
                          <div className={`col-6 d-flex align-items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-success' : 'text-muted'}`}>
                            {passwordStrength.checks.lowercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            Una minúscula (a-z)
                          </div>
                          <div className={`col-6 d-flex align-items-center gap-1 ${passwordStrength.checks.number ? 'text-success' : 'text-muted'}`}>
                            {passwordStrength.checks.number ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            Un número (0-9)
                          </div>
                          <div className={`col-12 d-flex align-items-center gap-1 ${passwordStrength.checks.special ? 'text-success' : 'text-muted'}`}>
                            {passwordStrength.checks.special ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            Un carácter especial (!@#$%^&*...)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
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
                form="form-usuario"
                className="btn btn-sm fw-semibold px-3 py-2 rounded-3"
                style={{
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                }}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-1" />}
                {editando ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UsuariosPage;
