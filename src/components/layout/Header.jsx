/**
 * @fileoverview Header — Barra superior responsiva con selector de Modo Oscuro / Alto Contraste y toggle de menú móvil.
 */

import { hoyISO, formatearFechaLarga, esDiaLectivo } from '../../utils/dateUtils.js';
import { CalendarCheck, AlertTriangle, Menu, Moon, Sun, Eye } from 'lucide-react';
import useThemeStore from '../../store/themeStore.js';

/**
 * @param {{
 *   titulo: string,
 *   subtitulo?: string,
 *   onToggleSidebar?: () => void
 * }} props
 */
const Header = ({ titulo, subtitulo, onToggleSidebar }) => {
  const hoy = hoyISO();
  const diaLectivo = esDiaLectivo(hoy);
  const { theme, setTheme, toggleHighContrast } = useThemeStore();

  return (
    <header
      className="d-flex align-items-center justify-content-between px-3 px-md-4 py-2 py-md-3 sticky-top"
      style={{
        background: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'var(--backdrop-blur)',
        zIndex: 1020,
      }}
    >
      {/* Botón hamburguesa (móvil) + Título */}
      <div className="d-flex align-items-center gap-2 gap-md-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-sm d-lg-none p-2 d-flex align-items-center justify-content-center"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            borderRadius: 8,
          }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1
            className="h5 mb-0 fw-bold text-truncate"
            style={{ color: 'var(--text-heading)', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}
          >
            {titulo}
          </h1>
          {subtitulo && (
            <p
              className="mb-0 text-muted text-truncate d-none d-sm-block"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Selector de Temas + Indicador de fecha */}
      <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
        {/* Switch / Selector de Temas */}
        <div
          className="btn-group p-1 rounded-pill"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
          }}
          role="group"
          aria-label="Selector de Tema"
        >
          {/* Botón Modo Oscuro */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`btn btn-sm rounded-pill px-2 px-sm-3 py-1 d-flex align-items-center gap-1 ${
              theme === 'dark' ? 'fw-bold' : ''
            }`}
            style={{
              background: theme === 'dark' ? 'var(--primary-gradient)' : 'transparent',
              color: theme === 'dark' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              fontSize: '0.78rem',
              transition: 'all 0.2s ease',
            }}
            title="Modo Oscuro"
          >
            <Moon size={14} />
            <span className="d-none d-md-inline">Oscuro</span>
          </button>

          {/* Botón Modo Alto Contraste */}
          <button
            type="button"
            onClick={() => setTheme('high-contrast')}
            className={`btn btn-sm rounded-pill px-2 px-sm-3 py-1 d-flex align-items-center gap-1 ${
              theme === 'high-contrast' ? 'fw-bold' : ''
            }`}
            style={{
              background: theme === 'high-contrast' ? '#facc15' : 'transparent',
              color: theme === 'high-contrast' ? '#000000' : 'var(--text-muted)',
              border: theme === 'high-contrast' ? '1px solid #ffffff' : 'none',
              fontSize: '0.78rem',
              transition: 'all 0.2s ease',
            }}
            title="Modo Alto Contraste (Accesibilidad)"
          >
            <Eye size={14} />
            <span className="d-none d-md-inline">Alto Contraste</span>
          </button>

          {/* Botón Modo Claro */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`btn btn-sm rounded-pill px-2 px-sm-3 py-1 d-flex align-items-center gap-1 ${
              theme === 'light' ? 'fw-bold' : ''
            }`}
            style={{
              background: theme === 'light' ? '#ffffff' : 'transparent',
              color: theme === 'light' ? '#0f172a' : 'var(--text-muted)',
              boxShadow: theme === 'light' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              border: 'none',
              fontSize: '0.78rem',
              transition: 'all 0.2s ease',
            }}
            title="Modo Claro"
          >
            <Sun size={14} />
            <span className="d-none d-md-inline">Claro</span>
          </button>
        </div>

        {/* Fecha + Día lectivo */}
        <div className="text-end d-none d-sm-block">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
            {formatearFechaLarga(hoy)}
          </div>
          <div className="d-flex align-items-center justify-content-end gap-1 mt-0">
            {diaLectivo ? (
              <>
                <CalendarCheck size={13} style={{ color: 'var(--success-color)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--success-color)' }}>
                  Lectivo
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} style={{ color: 'var(--warning-color)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--warning-color)' }}>
                  No lectivo
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
