/**
 * @fileoverview Schemas de validación Yup para formularios.
 */

import * as yup from 'yup';

export const internoSchema = yup.object({
  apellidoPaterno: yup
    .string()
    .required('El apellido paterno es requerido.')
    .min(2, 'Mínimo 2 caracteres.'),
  apellidoMaterno: yup
    .string()
    .required('El apellido materno es requerido.')
    .min(2, 'Mínimo 2 caracteres.'),
  nombreCompleto: yup
    .string()
    .required('El/los nombre/s son requeridos.')
    .min(2, 'Mínimo 2 caracteres.'),
  dni: yup
    .string()
    .required('El DNI es requerido.')
    .matches(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos numéricos.'),
  fichaCriminologica: yup
    .string()
    .required('La ficha criminológica es requerida.'),
  pabellon: yup
    .string()
    .required('El pabellón es requerido.'),
  celda: yup
    .string()
    .required('La celda es requerida.'),
  fechaIngreso: yup
    .string()
    .required('La fecha de ingreso es requerida.'),
  status: yup
    .string()
    .oneOf(['activo', 'inactivo', 'suspendido'])
    .required(),
  notas: yup.string().optional(),
});

export const cursoSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido.').min(3, 'Mínimo 3 caracteres.'),
  codigo: yup.string().required('El código es requerido.'),
  descripcion: yup.string().optional(),
  docenteId: yup.string().required('Debe asignar un docente.'),
  diasCursada: yup
    .array()
    .of(yup.string())
    .min(1, 'Seleccioná al menos un día de cursada.')
    .required(),
  fechaInicio: yup.string().required('La fecha de inicio es requerida.'),
  fechaFin: yup.string().required('La fecha de fin es requerida.'),
  status: yup.string().oneOf(['activo', 'finalizado', 'cancelado']).required(),
});

export const inscripcionSchema = yup.object({
  internoId: yup.string().required('Seleccioná un interno.'),
  cursoId: yup.string().required('Seleccioná un curso.'),
  fechaInscripcion: yup.string().required('La fecha de inscripción es requerida.'),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Ingresá un email válido.')
    .required('El email es requerido.'),
  password: yup
    .string()
    .required('La contraseña es requerida.')
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const usuarioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido.').min(3, 'Mínimo 3 caracteres.'),
  email: yup.string().email('Email inválido.').required('El email es requerido.'),
  rol: yup.string().oneOf(['admin', 'user']).required('El rol es requerido.'),
  password: yup.string().min(6, 'Mínimo 6 caracteres.').optional(),
});

export const evaluacionSchema = yup.object({
  concepto: yup.string().required('El concepto es requerido.').min(10, 'Mínimo 10 caracteres.'),
  calificacion: yup
    .number()
    .min(1, 'Mínimo 1')
    .max(10, 'Máximo 10')
    .nullable()
    .transform((v, o) => (o === '' ? null : v)),
  periodo: yup.string().required('El período es requerido.'),
});
