/**
 * @fileoverview Hook usePermisos — Guardas de acceso por rol.
 */

import useAuthStore from "../store/authStore.js";

/**
 * @returns {{
 *   esAdmin: boolean,
 *   puedeEditar: boolean,
 *   puedeEliminar: boolean,
 *   puedeVerReportes: boolean,
 *   puedeGestionarUsuarios: boolean,
 *   puedeGestionarInscripciones: boolean,
 *   puedeTomarAsistencia: boolean,
 * }}
 */
const usePermisos = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  return {
    esAdmin,
    puedeEditar: esAdmin, // Solo ADMIN edita talleres, internos
    puedeEliminar: esAdmin, // Solo ADMIN elimina registros
    puedeVerReportes: true, // Todos pueden ver reportes
    puedeExportarReportes: esAdmin, // Solo ADMIN exporta
    puedeGestionarUsuarios: esAdmin, // Solo ADMIN gestiona usuarios
    puedeGestionarInscripciones: esAdmin, // Solo ADMIN gestiona inscripciones
    puedeTomarAsistencia: true, // Todos pueden tomar asistencia
    puedeEditarAsistenciaPasada: esAdmin, // Solo ADMIN edita asistencia pasada
  };
};

export default usePermisos;
