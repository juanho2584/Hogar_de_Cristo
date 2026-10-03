/**
 * @fileoverview ErrorBoundary — Captura errores no controlados en el árbol de componentes.
 * Ofrece una interfaz de recuperación intuitiva y estética sin romper la aplicación completa.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import logger from '../../lib/logger/logger.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    logger.error('ErrorBoundary', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="d-flex align-items-center justify-content-center p-4"
          style={{
            minHeight: '100vh',
            background: 'var(--bg-main, #0b1120)',
            color: 'var(--text-main, #f8fafc)',
          }}
        >
          <div
            className="card border-0 shadow-lg text-center p-4 p-md-5"
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-surface, #151d30)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
              style={{
                width: '72px',
                height: '72px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <h3 className="fw-bold mb-2 text-white">Se produjo una excepción inesperada</h3>
            <p className="text-secondary small mb-4">
              Hemos registrado el incidente. Podés intentar recargar la página o volver al panel principal de forma segura.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div
                className="text-start p-3 rounded mb-4 overflow-auto text-danger font-monospace small"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  maxHeight: '150px',
                  fontSize: '0.78rem',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 py-2"
                onClick={this.handleReload}
                style={{ borderRadius: '10px' }}
              >
                <RefreshCw size={16} />
                Recargar página
              </button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
                onClick={this.handleReset}
                style={{
                  borderRadius: '10px',
                  background: 'var(--primary-accent, #2563eb)',
                  border: 'none',
                }}
              >
                <Home size={16} />
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
