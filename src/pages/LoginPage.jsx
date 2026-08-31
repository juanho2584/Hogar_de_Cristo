/**
 * @fileoverview LoginPage — Página de inicio de sesión.
 */

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { loginSchema } from '../utils/validators.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, estaAutenticado } = useAuthStore();
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
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #1a1f36 50%, #0d1117 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card de login */}
      <div className="w-100 px-3" style={{ maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="h4 text-white fw-bold mb-1">Hogar de Dios</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            SISTEMA DE GESTIÓN ACADÉMICA
          </p>
        </div>

        {/* Formulario */}
        <div
          className="p-4 rounded-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <h2 className="h6 text-white mb-4 fw-semibold">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label text-secondary" style={{ fontSize: '0.82rem' }}>
                Correo electrónico
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6366f1' }}
                >
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  id="login-email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="usuario@hogar.edu"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                  }}
                  {...register('email')}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label text-secondary" style={{ fontSize: '0.82rem' }}>
                Contraseña
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6366f1' }}
                >
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                  }}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              id="btn-login"
              disabled={loading}
              className="btn w-100 fw-semibold py-2"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              Ingresar al sistema
            </button>
          </form>

          {/* Credenciales de demo */}
          <div
            className="mt-4 p-3 rounded-3"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <p className="text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              CREDENCIALES DE DEMO
            </p>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              <div><span className="text-info">Admin:</span> admin@hogar.edu</div>
              <div><span className="text-info">Docente:</span> docente@hogar.edu</div>
              <div className="mt-1"><span className="text-info">Contraseña:</span> Hogar2025</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
