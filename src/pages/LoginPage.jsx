/**
 * @fileoverview LoginPage — Página de inicio de sesión responsiva y accesible con selector de tema,
 * protección de rate-limiting defensivo y recuperación de contraseña.
 */

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Moon, Sun, AlertTriangle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import { loginSchema } from '../utils/validators.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, recuperarPassword, loading, error: authError, lockoutRemaining } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(loginSchema) });

  const onSubmit = async (data) => {
    const ok = await login(data.email, data.password);
    if (ok) {
      toast.success('¡Bienvenido al sistema!');
      navigate('/dashboard');
    } else {
      const currentError = useAuthStore.getState().error;
      toast.error(currentError || 'Email o contraseña incorrectos.');
    }
  };

  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      toast.error('Por favor ingresá un correo electrónico válido.');
      return;
    }

    setRecoveryLoading(true);
    const res = await recuperarPassword(recoveryEmail);
    setRecoveryLoading(false);

    if (res.success) {
      toast.success('Se enviaron las instrucciones a tu correo electrónico.');
      setShowRecoveryModal(false);
      setRecoveryEmail('');
    } else {
      toast.error(res.error || 'No se pudo enviar el correo de recuperación.');
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3 position-relative"
      style={{
        background: 'var(--bg-main)',
        color: 'var(--text-main)',
        overflow: 'hidden',
      }}
    >
      {/* Botón flotante de selección de tema en Login */}
      <div className="position-absolute top-0 end-0 p-3 p-md-4" style={{ zIndex: 10 }}>
        <div
          className="btn-group p-1 rounded-pill"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`btn btn-sm rounded-pill px-2 py-1 ${theme === 'dark' ? 'fw-bold' : ''}`}
            style={{
              background: theme === 'dark' ? 'var(--primary-gradient)' : 'transparent',
              color: theme === 'dark' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
            }}
            title="Modo Oscuro"
          >
            <Moon size={14} />
          </button>
          <button
            type="button"
            onClick={() => setTheme('high-contrast')}
            className={`btn btn-sm rounded-pill px-2 py-1 ${theme === 'high-contrast' ? 'fw-bold' : ''}`}
            style={{
              background: theme === 'high-contrast' ? '#facc15' : 'transparent',
              color: theme === 'high-contrast' ? '#000000' : 'var(--text-muted)',
              border: theme === 'high-contrast' ? '1px solid #ffffff' : 'none',
            }}
            title="Alto Contraste"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`btn btn-sm rounded-pill px-2 py-1 ${theme === 'light' ? 'fw-bold' : ''}`}
            style={{
              background: theme === 'light' ? '#ffffff' : 'transparent',
              color: theme === 'light' ? '#0f172a' : 'var(--text-muted)',
              border: 'none',
            }}
            title="Modo Claro"
          >
            <Sun size={14} />
          </button>
        </div>
      </div>

      {/* Card de Login Responsivo */}
      <div className="w-100" style={{ maxWidth: '440px' }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 68,
              height: 68,
              background: 'var(--primary-gradient)',
              boxShadow: '0 8px 32px var(--primary-glow)',
            }}
          >
            <Shield size={34} className="text-white" />
          </div>
          <h1 className="h4 fw-bold mb-1" style={{ color: 'var(--text-heading)' }}>
            Hogar de Dios
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
            SISTEMA DE GESTIÓN ACADÉMICA
          </p>
        </div>

        {/* Formulario */}
        <div
          className="p-4 rounded-4 shadow-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 className="h6 mb-3 fw-semibold" style={{ color: 'var(--text-heading)' }}>
            Iniciar Sesión
          </h2>

          {/* Banner de Rate Limiting o Error */}
          {lockoutRemaining > 0 ? (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-3">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <div>Bloqueo temporal por intentos fallidos. Reintentá en {lockoutRemaining}s.</div>
            </div>
          ) : authError ? (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
              {authError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Correo electrónico
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--primary-accent)',
                  }}
                >
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  id="login-email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="admin@hogar.edu"
                  {...register('email')}
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: '0.75rem', color: 'var(--primary-accent)' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--primary-accent)',
                  }}
                >
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              </div>
            </div>

            <button
              type="submit"
              id="btn-login"
              disabled={loading || lockoutRemaining > 0}
              className="btn w-100 fw-semibold py-2 rounded-3 mt-2"
              style={{
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 16px var(--primary-glow)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {lockoutRemaining > 0 ? `Esperar (${lockoutRemaining}s)` : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Credenciales de demo */}
          <div
            className="mt-4 p-3 rounded-3"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p
              className="mb-2"
              style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}
            >
              CREDENCIALES DE ACCESO
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <div>
                <span className="text-info fw-semibold">Admin:</span> admin@hogar.edu
              </div>
              <div>
                <span className="text-info fw-semibold">Docente:</span> docente@hogar.edu
              </div>
              <div className="mt-1">
                <span className="text-info fw-semibold">Clave:</span> Hogar2025
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {showRecoveryModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
        >
          <div
            className="card border-0 p-4 w-100 shadow-lg"
            style={{
              maxWidth: '420px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <KeyRound size={22} className="text-warning" />
              <h3 className="h6 mb-0 fw-bold text-white">Recuperar Contraseña</h3>
            </div>
            <p className="text-secondary small mb-3">
              Ingresá tu correo electrónico institucional para recibir un enlace de restablecimiento seguro.
            </p>

            <form onSubmit={handleRecuperarPassword}>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@hogar.edu"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowRecoveryModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="btn btn-sm btn-primary"
                  style={{ background: 'var(--primary-accent)', border: 'none' }}
                >
                  {recoveryLoading && <span className="spinner-border spinner-border-sm me-1" />}
                  Enviar instrucciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
