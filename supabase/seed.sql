-- ==============================================================================
-- SISTEMA DE GESTIÓN ACADÉMICA Y CONTROL DE ASISTENCIA "HOGAR DE DIOS"
-- Seed Completo: Usuarios Auth, Perfiles, Talleres, Internos, Inscripciones,
-- Asistencias históricas (con alerta de 5 faltas) y Evaluaciones pedagógicas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USUARIOS EN AUTH.USERS (Credenciales Demo con BCrypt y roles)
-- Contraseña para todos: Hogar2025
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- 1.1 Administrador
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@hogar.edu') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'd1000000-0000-0000-0000-000000000001',
      'authenticated', 'authenticated', 'admin@hogar.edu',
      crypt('Hogar2025', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"rol":"admin"}'::jsonb,
      '{"nombre":"Administrador General","rol":"admin"}'::jsonb,
      now(), now()
    );
  END IF;

  -- 1.2 Docente
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'docente@hogar.edu') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'd1000000-0000-0000-0000-000000000002',
      'authenticated', 'authenticated', 'docente@hogar.edu',
      crypt('Hogar2025', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"rol":"user"}'::jsonb,
      '{"nombre":"Prof. María González","rol":"user"}'::jsonb,
      now(), now()
    );
  END IF;

  -- 1.3 Preceptor
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'preceptor@hogar.edu') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'd1000000-0000-0000-0000-000000000003',
      'authenticated', 'authenticated', 'preceptor@hogar.edu',
      crypt('Hogar2025', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"rol":"user"}'::jsonb,
      '{"nombre":"Prof. Carlos Rodríguez","rol":"user"}'::jsonb,
      now(), now()
    );
  END IF;
END $$;

-- Asegurar perfiles en public.perfiles_usuario
INSERT INTO public.perfiles_usuario (id, email, nombre, rol)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'admin@hogar.edu', 'Administrador General', 'admin'),
  ('d1000000-0000-0000-0000-000000000002', 'docente@hogar.edu', 'Prof. María González', 'user'),
  ('d1000000-0000-0000-0000-000000000003', 'preceptor@hogar.edu', 'Prof. Carlos Rodríguez', 'user')
ON CONFLICT (id) DO UPDATE
SET rol = EXCLUDED.rol, nombre = EXCLUDED.nombre;

-- ------------------------------------------------------------------------------
-- 2. TALLERES / CURSOS (Días lectivos: lunes, martes, jueves)
-- ------------------------------------------------------------------------------
INSERT INTO public.talleres (id, nombre, codigo, descripcion, docente_id, tallerista_nombre, dias_cursada, fecha_inicio, fecha_fin, hora_inicio, hora_fin, status)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'Matemática y Lógica',
    'MAT-01',
    'Aritmética, geometría práctica y resolución de problemas cotidianos.',
    'd1000000-0000-0000-0000-000000000002',
    'Prof. María González',
    ARRAY['lunes', 'martes', 'jueves'],
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '120 days',
    '09:00:00',
    '11:30:00',
    'activo'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Lengua y Comunicación',
    'LEN-01',
    'Comprensión lectora, redacción y expresión oral.',
    'd1000000-0000-0000-0000-000000000003',
    'Prof. Carlos Rodríguez',
    ARRAY['lunes', 'martes', 'jueves'],
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '120 days',
    '14:00:00',
    '16:30:00',
    'activo'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Formación Ciudadana y Oficios',
    'CIV-01',
    'Derechos, ciudadanía y capacitación para la reinserción social.',
    'd1000000-0000-0000-0000-000000000002',
    'Prof. María González',
    ARRAY['lunes', 'martes', 'jueves'],
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '120 days',
    '08:30:00',
    '11:00:00',
    'activo'
  )
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

-- ------------------------------------------------------------------------------
-- 3. INTERNOS (10 internos distribuidos con pabellones y celdas válidas)
-- ------------------------------------------------------------------------------
INSERT INTO public.internos (id, apellido_paterno, apellido_materno, nombre_completo, dni, ficha_criminologica, pabellon, sector, celda, status, fecha_ingreso, notas)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'García', 'López', 'Marcos Alejandro', '30123456', 'FC-2023-001', 1, 'A', 2, 'activo', CURRENT_DATE - INTERVAL '120 days', 'Excelente conducta, muy colaborador.'),
  ('a1000000-0000-0000-0000-000000000002', 'Martínez', 'Pérez', 'Juan Pablo', '32456789', 'FC-2023-002', 1, 'A', 3, 'activo', CURRENT_DATE - INTERVAL '100 days', 'Participación regular en talleres.'),
  ('a1000000-0000-0000-0000-000000000003', 'Rodríguez', 'Gómez', 'Luis Fernando', '28987654', 'FC-2022-015', 2, 'B', 1, 'activo', CURRENT_DATE - INTERVAL '90 days', 'Interés en cursos prácticos.'),
  ('a1000000-0000-0000-0000-000000000004', 'Fernández', 'Torres', 'Diego Nicolás', '35678901', 'FC-2024-003', 2, 'B', 4, 'activo', CURRENT_DATE - INTERVAL '80 days', 'Alerta: Casos de ausencias reiteradas.'),
  ('a1000000-0000-0000-0000-000000000005', 'López', 'Díaz', 'Sebastián Andrés', '31234567', 'FC-2023-008', 1, 'B', 5, 'activo', CURRENT_DATE - INTERVAL '70 days', 'Presentismo constante.'),
  ('a1000000-0000-0000-0000-000000000006', 'Sánchez', 'Ruiz', 'Pablo Ezequiel', '29876543', 'FC-2022-031', 3, 'A', 2, 'activo', CURRENT_DATE - INTERVAL '60 days', 'Buen rendimiento académico.'),
  ('a1000000-0000-0000-0000-000000000007', 'González', 'Vargas', 'Matías Hernán', '33456789', 'FC-2023-019', 3, 'A', 6, 'activo', CURRENT_DATE - INTERVAL '50 days', 'Participativo.'),
  ('a1000000-0000-0000-0000-000000000008', 'Ramírez', 'Castro', 'Facundo Gabriel', '36789012', 'FC-2024-011', 1, 'A', 8, 'activo', CURRENT_DATE - INTERVAL '40 days', 'Alerta: 5 faltas consecutivas en cursada.'),
  ('a1000000-0000-0000-0000-000000000009', 'Torres', 'Moreno', 'Roberto Carlos', '27654321', 'FC-2022-007', 2, 'A', 7, 'activo', CURRENT_DATE - INTERVAL '30 days', 'Justificaciones por trámites judiciales.'),
  ('a1000000-0000-0000-0000-000000000010', 'Díaz', 'Gutiérrez', 'Cristian Omar', '34567890', 'FC-2024-022', 2, 'B', 9, 'activo', CURRENT_DATE - INTERVAL '20 days', 'Ingreso reciente.')
ON CONFLICT (dni) DO UPDATE
SET pabellon = EXCLUDED.pabellon, celda = EXCLUDED.celda, status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 4. INSCRIPCIONES (Respetando regla de 1 inscripción activa por interno)
-- ------------------------------------------------------------------------------
INSERT INTO public.inscripciones (id, interno_id, taller_id, fecha_inscripcion, status)
VALUES
  -- Curso Matemática (4 alumnos)
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '55 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '50 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '45 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '40 days', 'activo'),

  -- Curso Lengua (3 alumnos)
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '45 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '40 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '35 days', 'activo'),

  -- Curso Formación Ciudadana (3 alumnos)
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '30 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '25 days', 'activo'),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '20 days', 'activo')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. ASISTENCIAS (Planillas históricas con fechas lectivas reales)
-- Incluye int-008 con 5 faltas consecutivas para probar la alerta roja en Dashboard.
-- ------------------------------------------------------------------------------
INSERT INTO public.asistencia (interno_id, taller_id, fecha, estado, notas, registrado_por)
VALUES
  -- Asistencias Curso Matemática (a1000000...001 Marcos García: 100% Presente)
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '14 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '12 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),

  -- Asistencias Curso Matemática (a1000000...002 Juan Pablo Martínez: Tardanzas y ausencias)
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '14 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '12 days', 'tarde', 'Llegó 15 min tarde', 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days', 'ausente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000002'),

  -- Asistencias Curso Lengua (a1000000...008 Facundo Ramírez: ⚠️ 5 FALTAS CONSECUTIVAS)
  ('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '14 days', 'ausente', 'Sin aviso', 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '12 days', 'ausente', 'Sin aviso', 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '7 days', 'ausente', 'Enfermería', 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '5 days', 'ausente', 'Sin aviso', 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', 'ausente', 'Sin aviso - Riesgo de baja', 'd1000000-0000-0000-0000-000000000003'),

  -- Asistencias Curso Lengua (a1000000...003 Luis Rodríguez: Presentismo regular)
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '14 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '12 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '7 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '5 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', 'presente', NULL, 'd1000000-0000-0000-0000-000000000003')
ON CONFLICT (interno_id, taller_id, fecha) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. EVALUACIONES PEDAGÓGICAS Y CALIFICACIONES
-- ------------------------------------------------------------------------------
INSERT INTO public.evaluaciones (id, interno_id, taller_id, concepto, calificacion, periodo, creado_por)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Excelente desempeño y comprensión de conceptos matemáticos. Actitud solidaria con sus compañeros.',
    9.5,
    '1er Cuatrimestre 2025',
    'd1000000-0000-0000-0000-000000000002'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Buen progreso en resolución de problemas prácticos. Debe mejorar la puntualidad al ingresar a clase.',
    7.0,
    '1er Cuatrimestre 2025',
    'd1000000-0000-0000-0000-000000000002'
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000002',
    'Dificultad para mantener continuidad pedagógica por inasistencias reiteradas. Se recomienda seguimiento interdisciplinario.',
    4.0,
    '1er Cuatrimestre 2025',
    'd1000000-0000-0000-0000-000000000003'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. EVENTOS DE AUDITORÍA INICIAL
-- ------------------------------------------------------------------------------
INSERT INTO public.audit_log (accion, entidad, detalle, usuario_id)
VALUES
  ('SISTEMA', 'Sistema', 'Inicialización completa del entorno de pruebas de Hogar de Dios.', 'd1000000-0000-0000-0000-000000000001');
