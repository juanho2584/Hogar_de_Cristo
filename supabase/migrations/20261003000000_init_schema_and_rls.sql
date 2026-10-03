-- ==============================================================================
-- SISTEMA DE GESTIÓN ACADÉMICA Y CONTROL DE ASISTENCIA "HOGAR DE DIOS"
-- Migración Inicial: Esquema Relacional, Restricciones de Negocio y RLS
-- ==============================================================================

-- Habilitar extensión pgcrypto para generación de UUIDs seguros
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. TABLA: perfiles_usuario (vinculada con auth.users de Supabase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: internos (Registro de internos de la Unidad Penitenciaria)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  ficha_criminologica TEXT NOT NULL UNIQUE,
  pabellon SMALLINT NOT NULL CHECK (pabellon BETWEEN 1 AND 10),
  sector TEXT NOT NULL CHECK (sector IN ('A', 'B')),
  celda SMALLINT NOT NULL CHECK (celda BETWEEN 1 AND 9),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'suspendido')),
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: talleres (Cursos y materias dictadas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.talleres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  docente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tallerista_nombre TEXT,
  dias_cursada TEXT[] NOT NULL DEFAULT ARRAY['lunes', 'martes', 'jueves'],
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  hora_inicio TIME NOT NULL DEFAULT '09:00:00',
  hora_fin TIME NOT NULL DEFAULT '11:00:00',
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'finalizado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_fechas_taller CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT check_horas_taller CHECK (hora_fin > hora_inicio)
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: inscripciones
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'baja')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REGLA DE NEGOCIO CRÍTICA: Un interno NO puede tener más de una inscripción 'activo' simultáneamente.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_enrollment_per_intern 
  ON public.inscripciones (interno_id) 
  WHERE (status = 'activo');

-- ------------------------------------------------------------------------------
-- 5. TABLA: asistencia (Planilla diaria con restricción de 1 registro diario por curso)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente', 'tarde', 'justificado')),
  notas TEXT,
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_daily_attendance UNIQUE (interno_id, taller_id, fecha)
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: evaluaciones (Conceptos pedagógicos y calificaciones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  calificacion NUMERIC(3,1) CHECK (calificacion >= 1 AND calificacion <= 10),
  periodo TEXT NOT NULL,
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: audit_log (Auditoría institucional de acciones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id TEXT,
  detalle TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- FUNCIONES DE SEGURIDAD Y HELPERS RBAC
-- ==============================================================================

-- Helper para verificar si el usuario autenticado tiene rol 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.perfiles_usuario 
    WHERE id = auth.uid() AND rol = 'admin'
  ) OR (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para mantener actualizado 'updated_at'
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de timestamps
DROP TRIGGER IF EXISTS trigger_set_timestamp_perfiles ON public.perfiles_usuario;
CREATE TRIGGER trigger_set_timestamp_perfiles
BEFORE UPDATE ON public.perfiles_usuario
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_timestamp_internos ON public.internos;
CREATE TRIGGER trigger_set_timestamp_internos
BEFORE UPDATE ON public.internos
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_timestamp_talleres ON public.talleres;
CREATE TRIGGER trigger_set_timestamp_talleres
BEFORE UPDATE ON public.talleres
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_timestamp_inscripciones ON public.inscripciones;
CREATE TRIGGER trigger_set_timestamp_inscripciones
BEFORE UPDATE ON public.inscripciones
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_timestamp_asistencia ON public.asistencia;
CREATE TRIGGER trigger_set_timestamp_asistencia
BEFORE UPDATE ON public.asistencia
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Trigger para sincronizar auth.users -> public.perfiles_usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'rol', NEW.raw_user_meta_data->>'rol', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS ESTRICTAS
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para 'perfiles_usuario'
CREATE POLICY "Usuarios autenticados pueden ver perfiles" 
  ON public.perfiles_usuario FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Admins pueden gestionar perfiles" 
  ON public.perfiles_usuario FOR ALL 
  TO authenticated USING (public.is_admin());

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.perfiles_usuario FOR UPDATE 
  TO authenticated USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid() AND rol = (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()));

-- 2. Políticas para 'internos'
CREATE POLICY "Personal autenticado puede ver internos" 
  ON public.internos FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Solo administradores pueden crear o modificar internos" 
  ON public.internos FOR ALL 
  TO authenticated USING (public.is_admin());

-- 3. Políticas para 'talleres'
CREATE POLICY "Personal autenticado puede ver talleres" 
  ON public.talleres FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Solo administradores pueden crear o modificar talleres" 
  ON public.talleres FOR ALL 
  TO authenticated USING (public.is_admin());

-- 4. Políticas para 'inscripciones'
CREATE POLICY "Personal autenticado puede ver inscripciones" 
  ON public.inscripciones FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Solo administradores pueden gestionar inscripciones" 
  ON public.inscripciones FOR ALL 
  TO authenticated USING (public.is_admin());

-- 5. Políticas para 'asistencia'
CREATE POLICY "Personal autenticado puede ver registros de asistencia" 
  ON public.asistencia FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Personal autenticado puede registrar asistencia" 
  ON public.asistencia FOR INSERT 
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins y docentes pueden modificar asistencias" 
  ON public.asistencia FOR UPDATE 
  TO authenticated USING (public.is_admin() OR registrado_por = auth.uid());

CREATE POLICY "Solo admins pueden eliminar asistencias" 
  ON public.asistencia FOR DELETE 
  TO authenticated USING (public.is_admin());

-- 6. Políticas para 'evaluaciones'
CREATE POLICY "Personal autenticado puede ver evaluaciones" 
  ON public.evaluaciones FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Personal autenticado puede registrar o modificar evaluaciones" 
  ON public.evaluaciones FOR ALL 
  TO authenticated USING (true) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Políticas para 'audit_log'
CREATE POLICY "Solo administradores pueden consultar el log de auditoría" 
  ON public.audit_log FOR SELECT 
  TO authenticated USING (public.is_admin());

CREATE POLICY "Personal autenticado puede registrar eventos de auditoría" 
  ON public.audit_log FOR INSERT 
  TO authenticated WITH CHECK (true);
