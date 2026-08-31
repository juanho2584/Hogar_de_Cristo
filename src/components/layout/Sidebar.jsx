/**
 * @fileoverview Sidebar — Navegación lateral principal.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useAlertaFaltas from '../../hooks/useAlertaFaltas.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/internos', label: 'Internos', icon: Users },
  { to: '/cursos', label: 'Cursos', icon: BookOpen },
  { to: '/inscripciones', label: 'Inscripciones', icon: ClipboardList, adminOnly: true },
  { to: '/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuarios', icon: Settings, adminOnly: true },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { usuario, logout, esAdmin } = useAuthStore();
  const { totalAlertas } = useAlertaFaltas();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente.');
    navigate('/login');
  };

  return (
    <nav
      className="d-flex flex-column"
      style={{
        width: '260px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1f36 0%, #0f1729 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo / Header */}
      <div className="p-4 border-bottom border-secondary">
        <div className="d-flex align-items-center gap-2 mb-1">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white fw-bold" style={{ fontSize: '0.95rem' }}>
              Hogar de Dios
            </div>
            <div className="text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              GESTIÓN ACADÉMICA
            </div>
          </div>
        </div>
      </div>

      {/* Menú de navegación */}
      <div className="flex-grow-1 py-3 px-2">
        <div className="text-muted mb-2 px-2" style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Menú principal
        </div>
        {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && !esAdmin()) return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded text-decoration-none transition-all ${
                  isActive
                    ? 'text-white fw-semibold'
                    : 'text-secondary'
                }`
              }
              style={({ isActive }) => ({
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(139,92,246,0.1))'
                  : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
              {/* Badge de alertas en Dashboard */}
              {to === '/dashboard' && totalAlertas > 0 && (
                <span className="badge ms-auto" style={{ background: '#ef4444', fontSize: '0.7rem' }}>
                  {totalAlertas}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer con usuario */}
      <div className="p-3 border-top border-secondary">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '0.85rem', flexShrink: 0 }}
          >
            {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-white" style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nombre}
            </div>
            <div style={{ fontSize: '0.7rem' }}>
              <span className={`badge ${usuario?.rol === 'admin' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                {usuario?.rol === 'admin' ? 'Administrador' : 'Docente'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <LogOut size={15} />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
