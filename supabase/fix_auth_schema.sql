-- ==============================================================================
-- CORRECCIÓN DEFINITIVA DE AUTH Y PERMISOS DE ESQUEMA EN SUPABASE
-- ==============================================================================

-- 1. Permisos para que el servicio interno de autenticación (supabase_auth_admin)
--    pueda interactuar con el schema public sin bloqueos de permisos.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.perfiles_usuario TO supabase_auth_admin;

-- 2. Corregir función handle_new_user() con search_path explícito (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 3. CRÍTICO: El trigger debe ser ÚNICAMENTE 'AFTER INSERT' (NUNCA AFTER UPDATE).
--    Si se dispara en UPDATE, bloquea los inicios de sesión cuando Supabase actualiza last_sign_in_at.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Limpiar usuarios e identidades previas para recrearlos en perfecto estado
DELETE FROM auth.identities WHERE provider = 'email' AND provider_id IN ('admin@hogar.edu', 'docente@hogar.edu', 'preceptor@hogar.edu');
DELETE FROM auth.users WHERE email IN ('admin@hogar.edu', 'docente@hogar.edu', 'preceptor@hogar.edu');

-- 5. Reinsertar los usuarios de prueba con todos los campos estándar de GoTrue
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  is_super_admin,
  is_sso_user
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'd1000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@hogar.edu',
  crypt('Hogar2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"rol":"admin"}'::jsonb,
  '{"nombre":"Administrador General","rol":"admin"}'::jsonb,
  now(),
  now(),
  '', '', '', '', false, false
),
(
  '00000000-0000-0000-0000-000000000000',
  'd1000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'docente@hogar.edu',
  crypt('Hogar2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"rol":"user"}'::jsonb,
  '{"nombre":"Prof. María González","rol":"user"}'::jsonb,
  now(),
  now(),
  '', '', '', '', false, false
),
(
  '00000000-0000-0000-0000-000000000000',
  'd1000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'preceptor@hogar.edu',
  crypt('Hogar2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"rol":"user"}'::jsonb,
  '{"nombre":"Prof. Carlos Rodríguez","rol":"user"}'::jsonb,
  now(),
  now(),
  '', '', '', '', false, false
);

-- 6. Insertar las identidades correspondientes en auth.identities (requerido por Supabase Auth)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'd1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'd1000000-0000-0000-0000-000000000001', 'email', 'admin@hogar.edu'),
  'email',
  'admin@hogar.edu',
  now(),
  now(),
  now()
),
(
  'd1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', 'd1000000-0000-0000-0000-000000000002', 'email', 'docente@hogar.edu'),
  'email',
  'docente@hogar.edu',
  now(),
  now(),
  now()
),
(
  'd1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', 'd1000000-0000-0000-0000-000000000003', 'email', 'preceptor@hogar.edu'),
  'email',
  'preceptor@hogar.edu',
  now(),
  now(),
  now()
);

-- 7. Asegurar filas en perfiles_usuario
INSERT INTO public.perfiles_usuario (id, email, nombre, rol)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'admin@hogar.edu', 'Administrador General', 'admin'),
  ('d1000000-0000-0000-0000-000000000002', 'docente@hogar.edu', 'Prof. María González', 'user'),
  ('d1000000-0000-0000-0000-000000000003', 'preceptor@hogar.edu', 'Prof. Carlos Rodríguez', 'user')
ON CONFLICT (id) DO UPDATE
SET rol = EXCLUDED.rol, nombre = EXCLUDED.nombre;
