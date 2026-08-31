/**
 * Configuración global del calendario académico.
 * Para habilitar más días lectivos, simplemente agregar al array `diasLectivos`.
 * 
 * Valores válidos: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
 */
export const ACADEMIC_CONFIG = {
  /** Días lectivos habilitados para tomar asistencia */
  diasLectivos: ['lunes', 'martes', 'jueves'],

  /** Cantidad de faltas consecutivas para generar alerta de suspensión */
  maxFaltasConsecutivas: 5,

  /** Nombre de la institución */
  nombreInstitucion: 'Hogar de Dios',

  /** Año académico actual */
  anioAcademico: new Date().getFullYear(),
};

/** Mapa de nombres de días para mostrar en UI */
export const DIAS_NOMBRES = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

/** Índices de días de la semana (0=Dom, 1=Lun, ... 6=Sáb) */
export const DIAS_INDEX = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};
