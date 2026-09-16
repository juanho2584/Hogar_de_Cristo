/**
 * @fileoverview Schemas de validación Yup para formularios y utilidades de seguridad.
 */

import * as yup from "yup";

// Expresión regular para validación fuerte de contraseñas:
// - Mínimo 8 caracteres
// - Al menos 1 letra mayúscula
// - Al menos 1 letra minúscula
// - Al menos 1 número
// - Al menos 1 carácter especial
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Evalúa la fortaleza de una contraseña y retorna un desglose para feedback visual en tiempo real.
 * @param {string} password
 * @returns {{
 *   score: number, // 0 a 4
 *   porcentaje: number, // 0 a 100
 *   label: 'Muy Débil' | 'Débil' | 'Media' | 'Fuerte' | 'Excelente',
 *   color: string,
 *   checks: {
 *     length: boolean,
 *     uppercase: boolean,
 *     lowercase: boolean,
 *     number: boolean,
 *     special: boolean
 *   }
 * }}
 */
export const evaluarFortalezaPassword = (password = "") => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const validCount = Object.values(checks).filter(Boolean).length;

  if (password.length === 0) {
    return {
      score: 0,
      porcentaje: 0,
      label: "Sin ingresar",
      color: "#64748b",
      checks,
    };
  }

  if (validCount <= 2) {
    return {
      score: 1,
      porcentaje: 25,
      label: "Débil",
      color: "#ef4444",
      checks,
    };
  }
  if (validCount === 3 || validCount === 4) {
    return {
      score: 2,
      porcentaje: 60,
      label: "Media",
      color: "#f59e0b",
      checks,
    };
  }
  if (validCount === 5 && password.length >= 10) {
    return {
      score: 4,
      porcentaje: 100,
      label: "Excelente",
      color: "#10b981",
      checks,
    };
  }
  return {
    score: 3,
    porcentaje: 85,
    label: "Fuerte",
    color: "#3b82f6",
    checks,
  };
};

export const internoSchema = yup.object({
  apellidoPaterno: yup
    .string()
    .trim()
    .required("El apellido paterno es requerido.")
    .min(2, "Mínimo 2 caracteres.")
    .matches(
      /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s'-]+$/,
      "Solo se permiten letras y espacios.",
    ),
  apellidoMaterno: yup
    .string()
    .trim()
    .required("El apellido materno es requerido.")
    .min(2, "Mínimo 2 caracteres.")
    .matches(
      /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s'-]+$/,
      "Solo se permiten letras y espacios.",
    ),
  nombreCompleto: yup
    .string()
    .trim()
    .required("El/los nombre/s son requeridos.")
    .min(2, "Mínimo 2 caracteres.")
    .matches(
      /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s'-]+$/,
      "Solo se permiten letras y espacios.",
    ),
  dni: yup
    .string()
    .trim()
    .required("El DNI es requerido.")
    .matches(
      /^\d{7,8}$/,
      "El DNI debe tener exactamente 7 u 8 dígitos numéricos.",
    ),
  fichaCriminologica: yup
    .string()
    .trim()
    .required("La ficha criminológica es requerida.")
    .matches(/^\d{1,6}$/, "Solo se permiten hasta 6 números."),
  pabellon: yup
    .number()
    .typeError("Debe ser un número")
    .min(1, "Pabellón mínimo 1")
    .max(10, "Pabellón máximo 10")
    .required("El pabellón es requerido."),
  sector: yup
    .string()
    .oneOf(["A", "B"], "Sector inválido")
    .required("El sector es requerido."),
  celda: yup
    .number()
    .typeError("Debe ser un número")
    .min(1, "Celda mínima 1")
    .max(9, "Celda máxima 9")
    .required("La celda es requerida."),
  fechaIngreso: yup.string().required("La fecha de ingreso es requerida."),
  status: yup
    .string()
    .oneOf(["activo", "inactivo", "suspendido"], "Estado no válido")
    .required("El estado es requerido."),
  notas: yup.string().optional(),
});

export const cursoSchema = yup.object({
  nombre: yup
    .string()
    .trim()
    .required("El nombre del taller es requerido.")
    .min(3, "Mínimo 3 caracteres."),
  codigo: yup
    .string()
    .trim()
    .required("El código de taller es requerido.")
    .min(2, "Mínimo 2 caracteres."),
  descripcion: yup.string().optional(),
  docenteId: yup.string().optional(),
  talleristaNombre: yup.string().trim().optional(),
  diasCursada: yup
    .array()
    .of(yup.string())
    .min(1, "Seleccioná al menos un día de cursada.")
    .required("Días de cursada requeridos."),
  fechaInicio: yup.string().required("La fecha de inicio es requerida."),
  fechaFin: yup
    .string()
    .required("La fecha de fin es requerida.")
    .test(
      "fechas-validas",
      "La fecha de fin debe ser posterior a la de inicio",
      function (value) {
        const { fechaInicio } = this.parent;
        if (!fechaInicio || !value) return true;
        return value >= fechaInicio;
      },
    ),
  horaInicio: yup.string().required("La hora de inicio es requerida."),
  horaFin: yup
    .string()
    .required("La hora de fin es requerida.")
    .test(
      "horas-validas",
      "La hora de fin debe ser posterior a la de inicio",
      function (value) {
        const { horaInicio } = this.parent;
        if (!horaInicio || !value) return true;
        return value > horaInicio;
      },
    ),
  status: yup
    .string()
    .oneOf(["activo", "finalizado", "cancelado"])
    .required("El estado es requerido."),
});

export const inscripcionSchema = yup.object({
  internoId: yup.string().required("Seleccioná un interno."),
  tallerId: yup.string().required("Seleccioná un taller."),
  fechaInscripcion: yup
    .string()
    .required("La fecha de inscripción es requerida."),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Ingresá un correo electrónico válido.")
    .required("El correo electrónico es requerido."),
  password: yup
    .string()
    .required("La contraseña es requerida.")
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const usuarioSchema = yup.object({
  nombre: yup
    .string()
    .trim()
    .required("El nombre completo es requerido.")
    .min(3, "Mínimo 3 caracteres.")
    .max(80, "Máximo 80 caracteres.")
    .matches(
      /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s.'-]+$/,
      "Nombre solo con letras y espacios.",
    ),
  email: yup
    .string()
    .trim()
    .email("Ingresá un correo electrónico válido.")
    .required("El correo electrónico es requerido."),
  rol: yup
    .string()
    .oneOf(["admin", "user"], "Rol inválido")
    .required("El rol en el sistema es requerido."),
  password: yup
    .string()
    .test(
      "password-fuerte",
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial (!@#$%^&*...).",
      function (val) {
        if (!val) return true; // Si es opcional (al editar sin cambiar)
        return STRONG_PASSWORD_REGEX.test(val);
      },
    ),
});

export const evaluacionSchema = yup.object({
  concepto: yup
    .string()
    .trim()
    .required("El concepto pedagógico es requerido.")
    .min(10, "Mínimo 10 caracteres."),
  calificacion: yup
    .number()
    .min(1, "Calificación mínima es 1")
    .max(10, "Calificación máxima es 10")
    .nullable()
    .transform((v, o) => (o === "" || o === null ? null : v)),
  periodo: yup.string().required("El período evaluativo es requerido."),
});
