/**
 * @fileoverview Hook useAlertaFaltas — Detecta internos con 5 faltas consecutivas.
 * Retorna un array de alertas activas para mostrar en el Dashboard.
 */

import { useMemo } from 'react';
import { generarAlertas } from '../utils/asistenciaUtils.js';
import useAsistenciaStore from '../store/asistenciaStore.js';
import useInscripcionesStore from '../store/inscripcionesStore.js';
import useInternosStore from '../store/internosStore.js';
import useCursosStore from '../store/cursosStore.js';

/**
 * @returns {{ alertas: Array, totalAlertas: number }}
 */
const useAlertaFaltas = () => {
  const asistencias = useAsistenciaStore((s) => s.asistencias);
  const inscripciones = useInscripcionesStore((s) => s.inscripciones);
  const internos = useInternosStore((s) => s.internos);
  const cursos = useCursosStore((s) => s.cursos);

  const alertas = useMemo(() => {
    const todasLasAlertas = [];

    for (const curso of cursos) {
      // Internos inscritos en este curso
      const inscripcionesCurso = inscripciones.filter(
        (i) => i.cursoId === curso.id && i.status === 'activo'
      );
      const internosCurso = inscripcionesCurso
        .map((ins) => internos.find((i) => i.id === ins.internoId))
        .filter(Boolean);

      const alertasCurso = generarAlertas({
        internos: internosCurso,
        asistencias,
        cursoId: curso.id,
        cursoNombre: curso.nombre,
      });

      todasLasAlertas.push(...alertasCurso);
    }

    return todasLasAlertas;
  }, [asistencias, inscripciones, internos, cursos]);

  return { alertas, totalAlertas: alertas.length };
};

export default useAlertaFaltas;
