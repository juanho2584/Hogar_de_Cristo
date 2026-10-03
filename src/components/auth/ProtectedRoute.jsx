/**
 * @fileoverview ProtectedRoute — Guard de rutas con control de autenticación y autorización RBAC.
 */

import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

/**
 * @param {{
 *   children: React.ReactNode,
 *   requireAdmin?: boolean,
 *   allowedRoles?: Array<'admin' | 'user'>
 * }} props
 */
const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const location = useLocation();

  if (!usuario) {
    // Redirige al login preservando la ruta previa
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validación de permisos por rol
  if (requireAdmin && usuario.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
