/**
 * @fileoverview Sidebar — Navegación lateral principal responsiva con modo offcanvas móvil.
 */

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Settings,
  History,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import useAuthStore from "../../store/authStore.js";
import useAlertaFaltas from "../../hooks/useAlertaFaltas.js";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/internos", label: "Internos", icon: Users },
  { to: "/talleres", label: "Talleres", icon: BookOpen },
  {
    to: "/inscripciones",
    label: "Inscripciones",
    icon: ClipboardList,
    adminOnly: true,
  },
  { to: "/asistencia", label: "Asistencia", icon: CalendarCheck },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  {
    to: "/historial",
    label: "Historial / Auditoría",
    icon: History,
    adminOnly: true,
  },
  { to: "/usuarios", label: "Usuarios", icon: Settings, adminOnly: true },
];

/**
 * @param {{ isOpen?: boolean, onClose?: () => void }} props
 */
const Sidebar = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const { usuario, logout, esAdmin } = useAuthStore();
  const { totalAlertas } = useAlertaFaltas();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente.");
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop overlay para móviles */}
      {isOpen && (
        <div
          className="d-lg-none"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 1040,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      <nav
        className={`d-flex flex-column ${isOpen ? "sidebar-open" : ""}`}
        style={{
          width: "260px",
          height: "100vh",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1050,
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Header / Logo */}
        <div className="p-3 p-md-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 38,
                height: 38,
                background: "var(--primary-gradient)",
                boxShadow: "0 4px 12px var(--primary-glow)",
                flexShrink: 0,
              }}
            >
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <div
                className="text-white fw-bold"
                style={{ fontSize: "0.92rem", lineHeight: 1.2 }}
              >
                Hogar de Dios
              </div>
              <div
                className="text-muted"
                style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}
              >
                GESTIÓN ACADÉMICA
              </div>
            </div>
          </div>

          {/* Botón cerrar visible solo en móviles */}
          <button
            type="button"
            className="btn btn-sm d-lg-none p-1"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-muted)",
              border: "none",
              borderRadius: 6,
            }}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menú de navegación */}
        <div className="flex-grow-1 py-3 px-2 overflow-y-auto">
          <div
            className="text-muted mb-2 px-2"
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Menú principal
          </div>
          {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
            if (adminOnly && !esAdmin()) return null;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-3 text-decoration-none transition-all ${
                    isActive ? "text-white fw-semibold" : "text-secondary"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive
                    ? "rgba(99, 102, 241, 0.18)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--primary-accent)"
                    : "3px solid transparent",
                  color: isActive ? "var(--text-heading)" : "var(--text-muted)",
                  fontSize: "0.88rem",
                  transition: "all 0.2s ease",
                })}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span className="text-truncate">{label}</span>
                {/* Badge de alertas en Dashboard */}
                {to === "/dashboard" && totalAlertas > 0 && (
                  <span
                    className="badge ms-auto"
                    style={{
                      background: "var(--danger-color)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {totalAlertas}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer con usuario */}
        <div className="p-3 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: 36,
                height: 36,
                background: "var(--primary-gradient)",
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              {usuario?.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden min-w-0 flex-grow-1">
              <div
                className="text-truncate"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                }}
              >
                {usuario?.nombre}
              </div>
              <div style={{ fontSize: "0.7rem" }}>
                <span
                  className={`badge ${
                    usuario?.rol === "admin"
                      ? "bg-warning text-dark"
                      : "bg-info text-dark"
                  }`}
                  style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                >
                  {usuario?.rol === "admin" ? "Administrador" : "Docente"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-3"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--danger-color)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: "0.82rem",
              fontWeight: 500,
            }}
          >
            <LogOut size={15} />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Estilos responsivos de drawer para pantallas móviles */}
      <style>{`
        @media (max-width: 991.98px) {
          nav {
            transform: translateX(-100%);
          }
          nav.sidebar-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
