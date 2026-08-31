/**
 * @fileoverview Componente ProtectedRoute — Protege rutas según autenticación y rol.
 */

import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

/**
 * @param {{ children: React.ReactNode, requireAdmin?: boolean }} props
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const usuario = useAuthStore((s) => s.usuario);

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && usuario.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
