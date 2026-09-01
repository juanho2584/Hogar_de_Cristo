/**
 * @fileoverview LoginPage — Página de inicio de sesión responsiva y accesible con selector de tema.
 */

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';
import { loginSchema } from '../utils/validators.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, estaAutenticado } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(loginSchema) });

  useEffect(() => {
    if (estaAutenticado()) navigate('/dashboard');
  }, []);

  const onSubmit = async (data) => {
    const ok = await login(data.email, data.password);
    if (ok) {
      toast.success('¡Bienvenido al sistema!');
      navigate('/dashboard');
    } else {
      toast.error('Email o contraseña incorrectos.');
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
            <div className="mb-4">
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Contraseña
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
              disabled={loading}
              className="btn w-100 fw-semibold py-2 rounded-3"
              style={{
                background: 'var(--primary-gradient)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 16px var(--primary-glow)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              Ingresar al sistema
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
    </div>
  );
};

export default LoginPage;
