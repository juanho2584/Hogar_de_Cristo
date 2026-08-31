/**
 * @fileoverview Seed data — Datos de prueba para el primer arranque.
 * Se carga automáticamente cuando localStorage está vacío.
 */

import { hashPassword } from '../services/localStorage/usuariosService.js';
import { STORAGE_KEYS, saveToStorage } from '../services/localStorage/storageUtils.js';

const generarId = () => Math.random().toString(36).substr(2, 9);

/** Genera una fecha ISO de hace N días */
const fechaHaceNDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

/** Días lectivos de los últimos 30 días (solo Lun, Mar, Jue) */
const generarFechasLectivas = () => {
  const fechas = [];
  const hoy = new Date();
  let i = 0;
  while (fechas.length < 20) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const dia = d.getDay();
    if ([1, 2, 4].includes(dia)) { // Lun=1, Mar=2, Jue=4
      fechas.push(d.toISOString().split('T')[0]);
    }
    i++;
  }
  return fechas.reverse();
};

export const cargarSeedData = async () => {
  // ─── Usuarios ───────────────────────────────────────────────────────────────
  const adminHash = await hashPassword('Hogar2025');
  const docenteHash = await hashPassword('Hogar2025');

  const usuarios = [
    {
      id: 'user-admin-001',
      email: 'admin@hogar.edu',
      nombre: 'Administrador General',
      rol: 'admin',
      status: 'activo',
      passwordHash: adminHash,
    },
    {
      id: 'user-docente-001',
      email: 'docente@hogar.edu',
      nombre: 'Prof. María González',
      rol: 'user',
      status: 'activo',
      passwordHash: docenteHash,
    },
    {
      id: 'user-docente-002',
      email: 'preceptor@hogar.edu',
      nombre: 'Prof. Carlos Rodríguez',
      rol: 'user',
      status: 'activo',
      passwordHash: docenteHash,
    },
  ];

  // ─── Cursos ──────────────────────────────────────────────────────────────────
  const cursos = [
    {
      id: 'curso-001',
      nombre: 'Matemática',
      codigo: 'MAT-01',
      descripcion: 'Aritmética, álgebra básica y resolución de problemas.',
      docenteId: 'user-docente-001',
      diasCursada: ['lunes', 'martes', 'jueves'],
      fechaInicio: fechaHaceNDias(60),
      fechaFin: fechaHaceNDias(-90),
      status: 'activo',
    },
    {
      id: 'curso-002',
      nombre: 'Lengua y Literatura',
      codigo: 'LEN-01',
      descripcion: 'Comprensión lectora, escritura y expresión oral.',
      docenteId: 'user-docente-002',
      diasCursada: ['lunes', 'martes', 'jueves'],
      fechaInicio: fechaHaceNDias(60),
      fechaFin: fechaHaceNDias(-90),
      status: 'activo',
    },
    {
      id: 'curso-003',
      nombre: 'Educación Cívica',
      codigo: 'CIV-01',
      descripcion: 'Derechos, ciudadanía y convivencia democrática.',
      docenteId: 'user-docente-001',
      diasCursada: ['lunes', 'martes', 'jueves'],
      fechaInicio: fechaHaceNDias(60),
      fechaFin: fechaHaceNDias(-90),
      status: 'activo',
    },
  ];

  // ─── Internos ────────────────────────────────────────────────────────────────
  const internos = [
    { id: 'int-001', apellidoPaterno: 'García', apellidoMaterno: 'López', nombreCompleto: 'Marcos Alejandro', dni: '30123456', fichaCriminologica: 'FC-2023-001', pabellon: 'A', celda: '12', status: 'activo', fechaIngreso: fechaHaceNDias(55) },
    { id: 'int-002', apellidoPaterno: 'Martínez', apellidoMaterno: 'Pérez', nombreCompleto: 'Juan Pablo', dni: '32456789', fichaCriminologica: 'FC-2023-002', pabellon: 'A', celda: '15', status: 'activo', fechaIngreso: fechaHaceNDias(50) },
    { id: 'int-003', apellidoPaterno: 'Rodríguez', apellidoMaterno: 'Gómez', nombreCompleto: 'Luis Fernando', dni: '28987654', fichaCriminologica: 'FC-2022-015', pabellon: 'B', celda: '03', status: 'activo', fechaIngreso: fechaHaceNDias(45) },
    { id: 'int-004', apellidoPaterno: 'Fernández', apellidoMaterno: 'Torres', nombreCompleto: 'Diego Nicolás', dni: '35678901', fichaCriminologica: 'FC-2024-003', pabellon: 'B', celda: '07', status: 'activo', fechaIngreso: fechaHaceNDias(40) },
    { id: 'int-005', apellidoPaterno: 'López', apellidoMaterno: 'Díaz', nombreCompleto: 'Sebastián Andrés', dni: '31234567', fichaCriminologica: 'FC-2023-008', pabellon: 'A', celda: '20', status: 'activo', fechaIngreso: fechaHaceNDias(35) },
    { id: 'int-006', apellidoPaterno: 'Sánchez', apellidoMaterno: 'Ruiz', nombreCompleto: 'Pablo Ezequiel', dni: '29876543', fichaCriminologica: 'FC-2022-031', pabellon: 'C', celda: '01', status: 'activo', fechaIngreso: fechaHaceNDias(30) },
    { id: 'int-007', apellidoPaterno: 'González', apellidoMaterno: 'Vargas', nombreCompleto: 'Matías Hernán', dni: '33456789', fichaCriminologica: 'FC-2023-019', pabellon: 'C', celda: '05', status: 'activo', fechaIngreso: fechaHaceNDias(28) },
    { id: 'int-008', apellidoPaterno: 'Ramírez', apellidoMaterno: 'Castro', nombreCompleto: 'Facundo Gabriel', dni: '36789012', fichaCriminologica: 'FC-2024-011', pabellon: 'A', celda: '08', status: 'activo', fechaIngreso: fechaHaceNDias(25) },
    { id: 'int-009', apellidoPaterno: 'Torres', apellidoMaterno: 'Moreno', nombreCompleto: 'Roberto Carlos', dni: '27654321', fichaCriminologica: 'FC-2022-007', pabellon: 'B', celda: '14', status: 'activo', fechaIngreso: fechaHaceNDias(20) },
    { id: 'int-010', apellidoPaterno: 'Díaz', apellidoMaterno: 'Gutiérrez', nombreCompleto: 'Cristian Omar', dni: '34567890', fichaCriminologica: 'FC-2024-022', pabellon: 'B', celda: '19', status: 'activo', fechaIngreso: fechaHaceNDias(15) },
  ];

  // ─── Inscripciones (cada interno en un curso) ────────────────────────────────
  const inscripciones = [
    { id: 'ins-001', internoId: 'int-001', cursoId: 'curso-001', fechaInscripcion: fechaHaceNDias(55), status: 'activo' },
    { id: 'ins-002', internoId: 'int-002', cursoId: 'curso-001', fechaInscripcion: fechaHaceNDias(50), status: 'activo' },
    { id: 'ins-003', internoId: 'int-003', cursoId: 'curso-002', fechaInscripcion: fechaHaceNDias(45), status: 'activo' },
    { id: 'ins-004', internoId: 'int-004', cursoId: 'curso-002', fechaInscripcion: fechaHaceNDias(40), status: 'activo' },
    { id: 'ins-005', internoId: 'int-005', cursoId: 'curso-001', fechaInscripcion: fechaHaceNDias(35), status: 'activo' },
    { id: 'ins-006', internoId: 'int-006', cursoId: 'curso-003', fechaInscripcion: fechaHaceNDias(30), status: 'activo' },
    { id: 'ins-007', internoId: 'int-007', cursoId: 'curso-003', fechaInscripcion: fechaHaceNDias(28), status: 'activo' },
    { id: 'ins-008', internoId: 'int-008', cursoId: 'curso-002', fechaInscripcion: fechaHaceNDias(25), status: 'activo' },
    { id: 'ins-009', internoId: 'int-009', cursoId: 'curso-001', fechaInscripcion: fechaHaceNDias(20), status: 'activo' },
    { id: 'ins-010', internoId: 'int-010', cursoId: 'curso-003', fechaInscripcion: fechaHaceNDias(15), status: 'activo' },
  ];

  // ─── Asistencias ─────────────────────────────────────────────────────────────
  const fechasLectivas = generarFechasLectivas();
  const asistencias = [];

  // Mapa de interno → curso
  const mapa = {
    'int-001': 'curso-001', 'int-002': 'curso-001', 'int-005': 'curso-001', 'int-009': 'curso-001',
    'int-003': 'curso-002', 'int-004': 'curso-002', 'int-008': 'curso-002',
    'int-006': 'curso-003', 'int-007': 'curso-003', 'int-010': 'curso-003',
  };

  // Patrones de asistencia (P=presente, A=ausente, T=tarde, J=justificado)
  const patrones = {
    'int-001': 'PPPPPPPPPPPPPPPPPPPP', // 100% presentismo
    'int-002': 'PPAPPPAPPPPPAPPPPPAP', // 80% presentismo
    'int-003': 'PPPPPAAAAPPPPPPAPPPP', // Alerta: 4 ausentes consecutivos
    'int-004': 'PPPPPAAAAAPPPPPPPAPP', // ⚠️ ALERTA: 5 ausentes consecutivos
    'int-005': 'TPPPPTPPPPPPPTPPPPTPP'.slice(0, 20), // Tardanzas
    'int-006': 'PPPPPPPPPPPPPPPPPPPP',
    'int-007': 'PAPPPPAPPPPPPPAPPPPP',
    'int-008': 'PPPPPPPAAAAAAPPPPPP', // ⚠️ ALERTA: 5+ ausentes consecutivos
    'int-009': 'PPPPJJJJPPPPPPPPPPPP', // Justificados
    'int-010': 'PPPPPPPPPPPPPPPPPPPP',
  };

  for (const [internoId, cursoId] of Object.entries(mapa)) {
    const patron = patrones[internoId] || 'PPPPPPPPPPPPPPPPPPPP';
    fechasLectivas.forEach((fecha, idx) => {
      const char = patron[idx % patron.length] || 'P';
      const estadoMap = { P: 'presente', A: 'ausente', T: 'tarde', J: 'justificado' };
      asistencias.push({
        id: `asis-${internoId}-${idx}`,
        internoId,
        cursoId,
        fecha,
        estado: estadoMap[char] || 'presente',
        notas: char === 'J' ? 'Justificado por trámite legal' : '',
        registradoPor: 'user-docente-001',
      });
    });
  }

  // ─── Evaluaciones ────────────────────────────────────────────────────────────
  const evaluaciones = [
    { id: 'eval-001', internoId: 'int-001', cursoId: 'curso-001', concepto: 'Excelente desempeño. Participa activamente y ayuda a sus compañeros.', calificacion: 9, periodo: '1er Cuatrimestre 2025', creadoPor: 'user-docente-001', actualizadoEn: new Date().toISOString() },
    { id: 'eval-002', internoId: 'int-002', cursoId: 'curso-001', concepto: 'Buen desempeño general. Mejoró notablemente su comprensión matemática.', calificacion: 7, periodo: '1er Cuatrimestre 2025', creadoPor: 'user-docente-001', actualizadoEn: new Date().toISOString() },
    { id: 'eval-003', internoId: 'int-004', cursoId: 'curso-002', concepto: 'Sus ausencias impactan negativamente en el aprendizaje. Se recomienda intervención.', calificacion: 4, periodo: '1er Cuatrimestre 2025', creadoPor: 'user-docente-002', actualizadoEn: new Date().toISOString() },
  ];

  // ─── Guardar todo ─────────────────────────────────────────────────────────────
  saveToStorage(STORAGE_KEYS.USUARIOS, usuarios);
  saveToStorage(STORAGE_KEYS.CURSOS, cursos);
  saveToStorage(STORAGE_KEYS.INTERNOS, internos);
  saveToStorage(STORAGE_KEYS.INSCRIPCIONES, inscripciones);
  saveToStorage(STORAGE_KEYS.ASISTENCIA, asistencias);
  saveToStorage(STORAGE_KEYS.EVALUACIONES, evaluaciones);
  saveToStorage(STORAGE_KEYS.SEED_LOADED, 'true');

  console.info('[Seed] Datos de prueba cargados exitosamente.');
};
