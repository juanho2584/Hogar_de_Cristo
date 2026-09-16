/**
 * @fileoverview Hook useAlertaFaltas — Detecta internos con 5 faltas consecutivas.
 * Retorna un array de alertas activas para mostrar en el Dashboard.
 */

import { useMemo } from "react";
import { generarAlertas } from "../utils/asistenciaUtils.js";
import useAsistenciaStore from "../store/asistenciaStore.js";
import useInscripcionesStore from "../store/inscripcionesStore.js";
import useInternosStore from "../store/internosStore.js";
import useTalleresStore from "../store/talleresStore.js";

/**
 * @returns {{ alertas: Array, totalAlertas: number }}
 */
const useAlertaFaltas = () => {
  const asistencias = useAsistenciaStore((s) => s.asistencias);
  const inscripciones = useInscripcionesStore((s) => s.inscripciones);
  const internos = useInternosStore((s) => s.internos);
  const talleres = useTalleresStore((s) => s.talleres);

  const alertas = useMemo(() => {
    const todasLasAlertas = [];

    for (const taller of talleres) {
      const inscripcionesTaller = inscripciones.filter(
        (i) => i.tallerId === taller.id && i.status === "activo",
      );
      const internosTaller = inscripcionesTaller
        .map((ins) => internos.find((i) => i.id === ins.internoId))
        .filter(Boolean);

      const alertasTaller = generarAlertas({
        internos: internosTaller,
        asistencias,
        tallerId: taller.id,
        cursoNombre: taller.nombre,
      });

      todasLasAlertas.push(...alertasTaller);
    }

    return todasLasAlertas;
  }, [asistencias, inscripciones, internos, talleres]);

  return { alertas, totalAlertas: alertas.length };
};

export default useAlertaFaltas;
