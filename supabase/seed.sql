-- ==============================================================================
-- HOGAR DE DIOS - Seed Data para Desarrollo / Testing en Supabase
-- ==============================================================================

-- 1. Insertar Talleres Iniciales
INSERT INTO public.talleres (id, nombre, codigo, descripcion, tallerista_nombre, dias_cursada, fecha_inicio, fecha_fin, hora_inicio, hora_fin, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Carpintería Básica', 'CARP-01', 'Introducción a herramientas manuales y ensamble de muebles.', 'Prof. Juan Carlos Pérez', ARRAY['lunes', 'martes'], '2025-03-01', '2025-12-15', '09:00:00', '11:30:00', 'activo'),
  ('c1000000-0000-0000-0000-000000000002', 'Electricidad Domiciliaria', 'ELEC-01', 'Circuitos básicos, normas de seguridad e instalaciones.', 'Ing. Roberto Gómez', ARRAY['martes', 'jueves'], '2025-03-01', '2025-12-15', '14:00:00', '16:30:00', 'activo'),
  ('c1000000-0000-0000-0000-000000000003', 'Panadería y Pastelería', 'PAN-01', 'Elaboración de panes, masas y buenas prácticas de manipulación.', 'Sra. Marta Silva', ARRAY['lunes', 'jueves'], '2025-03-01', '2025-12-15', '08:30:00', '11:00:00', 'activo')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar Internos Iniciales
INSERT INTO public.internos (id, apellido_paterno, apellido_materno, nombre_completo, dni, ficha_criminologica, pabellon, sector, celda, status, fecha_ingreso, notas)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'García', 'López', 'Marcos Alejandro', '30123456', 'FC-2023-001', 1, 'A', 2, 'activo', '2023-05-10', 'Buena conducta, interesado en oficios manuales.'),
  ('a1000000-0000-0000-0000-000000000002', 'Rodríguez', 'Benítez', 'Carlos Alberto', '32987654', 'FC-2022-045', 2, 'B', 4, 'activo', '2022-11-20', 'Participa activamente en el taller.'),
  ('a1000000-0000-0000-0000-000000000003', 'Fernández', 'Suárez', 'Lucas Daniel', '35441122', 'FC-2024-012', 1, 'A', 5, 'activo', '2024-01-15', 'Asistencia regular.'),
  ('a1000000-0000-0000-0000-000000000004', 'Martínez', 'Castro', 'Jorge David', '28556677', 'FC-2021-089', 3, 'A', 1, 'activo', '2021-08-04', 'Caso de seguimiento por inasistencias pasadas.')
ON CONFLICT (dni) DO NOTHING;

-- 3. Inscripciones Iniciales (Respetando regla de una sola activa por interno)
INSERT INTO public.inscripciones (id, interno_id, taller_id, fecha_inscripcion, status)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2025-03-02', 'activo'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', '2025-03-02', 'activo'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', '2025-03-02', 'activo')
ON CONFLICT DO NOTHING;
