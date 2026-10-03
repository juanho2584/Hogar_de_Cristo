/**
 * @fileoverview PublicRoute — Impide que usuarios ya autenticados ingresen a rutas públicas como /login.
 */

import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

/**
 * @param {{ children: React.ReactNode }} props
 */
const PublicRoute = ({ children }) => {
  const usuario = useAuthStore((s) => s.usuario);

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
