# Sistema de Gestión Académica y Control de Asistencia
## Unidad Penitenciaria "Hogar de Dios"

Plataforma web full-stack moderna conectada a **Supabase (PostgreSQL, Auth con PKCE y Row Level Security)**, con soporte para sincronización continua vía **GitHub CI/CD**, arquitectura resiliente con fallback local, control estricto de roles (RBAC) y suite de pruebas automatizadas con **Vitest, Testing Library y Playwright**.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Reglas de Negocio Institucionales](#-reglas-de-negocio-institucionales)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Vinculación Supabase + GitHub](#-vinculación-supabase--github)
5. [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
6. [Arquitectura de Base de Datos y RLS](#-arquitectura-de-base-de-datos-y-rls)
7. [Seguridad y Hardening (OWASP Top 10)](#-seguridad-y-hardening-owasp-top-10)
8. [Testing Automatizado](#-testing-automatizado)
9. [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
10. [Credenciales de Demostración](#-credenciales-de-demostración)

---

## 🚀 Características Principales

- **Dashboard Ejecutivo en Tiempo Real:** Métricas globales (total de internos activos, talleres en curso, presentismo promedio, alertas de riesgo).
- **Gestión de Internos (CRUD):** Ficha penitenciaria completa (DNI, Ficha Criminológica, Pabellón, Sector, Celda, Estado, Fecha de Ingreso).
- **Gestión de Talleres y Cursos (CRUD):** Configuración de códigos, días de cursada, horarios y asignación docente.
- **Inscripciones con Restricción Única:** Validación en backend y frontend para evitar que un interno curse dos materias en simultáneo.
- **Planilla Diaria de Asistencia con Upsert Atómico:** Toma de asistencia rápida por curso con estados (`Presente`, `Ausente`, `Tarde`, `Justificado`).
- **Detección Automática de Ausentismo Crítico (Regla de 5 Faltas):** Alerta en Dashboard y Reportes indicando pabellón y celda.
- **Reportes Académicos y Exportación:** Conceptos cualitativos, calificaciones, exportación a CSV y PDF con membrete institucional.
- **Auditoría del Sistema (Historial de Cambios):** Trazabilidad completa de operaciones registradas.
- **Temas Visuales:** Soporte dinámico para Modo Oscuro (SaaS Dark), Modo Claro y Alto Contraste accesible.

---

## ⚖️ Reglas de Negocio Institucionales

### 1. Inscripción Única Simultánea
Un interno **NO** puede estar inscrito en más de una materia o taller con estado `activo` de forma simultánea.
- **A nivel Base de Datos (PostgreSQL):** Garantizado mediante un índice único parcial:
  ```sql
  CREATE UNIQUE INDEX unique_active_enrollment_per_intern 
    ON public.inscripciones (interno_id) 
    WHERE (status = 'activo');
  ```
- **A nivel Frontend:** Validación defensiva en servicios y deshabilitación visual en formularios.

### 2. Detección de Ausentismo Crítico (5 Faltas Consecutivas)
Si un interno acumula **5 inasistencias consecutivas** (`ausente`) al final de la cronología de cursada:
- Se emite una alerta crítica visual con tarjeta destacada en el Dashboard.
- Se identifican de inmediato sus coordenadas físicas (Pabellón y Celda) para intervención institucional.

### 3. Calendario Académico Flexibilizado
Configurado en `src/config/academicConfig.js` (días lectivos por defecto: Lunes, Martes y Jueves, adaptables por cada taller).

---

## 🛠️ Stack Tecnológico

- **Frontend Core:** React 19 + Vite 8 (JavaScript moderno, ES Modules).
- **Estilos & UI:** Bootstrap 5.3 + Variables CSS personalizadas + Glassmorphism + Lucide React Icons.
- **Backend as a Service (BaaS):** [Supabase](https://supabase.com) (PostgreSQL 15, Supabase Auth con flujo PKCE, Storage y Row Level Security).
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) modularizado con adaptadores de servicio transparentes.
- **Formularios & Validación:** `react-hook-form` + `yup` con resolver estricto.
- **Testing:**
  - **Unitario e Integración:** [Vitest](https://vitest.dev) + `@testing-library/react` + `jsdom`.
  - **End-to-End (E2E):** [Playwright](https://playwright.dev).
- **Sanitización:** [DOMPurify](https://github.com/cure53/DOMPurify).
- **Exportación:** PapaParse (CSV) y jsPDF / jsPDF-AutoTable (PDF).

---

## 🔗 Vinculación Supabase + GitHub

El repositorio está vinculado al proyecto de Supabase mediante integración continua:

### 1. Estructura de Migraciones en el Repositorio
Todas las definiciones de esquema, funciones y políticas RLS residen en la carpeta `supabase/`:
```text
supabase/
├── config.toml                              # Configuración local de Supabase CLI
├── seed.sql                                 # Datos semilla para inicialización
└── migrations/
    └── 20261003000000_init_schema_and_rls.sql # Esquema DDL inicial y RLS completo
```

### 2. Despliegue Automático por Git Push (GitHub Actions)
El workflow `.github/workflows/supabase-migrations.yml` valida la sintaxis de las migraciones en cada Pull Request y las aplica automáticamente a la base de datos de producción al hacer merge en la rama `main`.

Para habilitar el despliegue automático desde GitHub Actions, configura estos Secrets en tu repositorio de GitHub (**Settings > Secrets and variables > Actions**):
- `SUPABASE_ACCESS_TOKEN`: Token de acceso personal generado en [Supabase Dashboard > Account > Access Tokens](https://app.supabase.com/account/tokens).
- `SUPABASE_DB_PASSWORD`: Contraseña de la base de datos del proyecto Supabase.
- `SUPABASE_PROJECT_ID`: ID o referencia del proyecto Supabase (ej. `abcdefghijklmnopqrst`).

### 3. Aplicación Manual con Supabase CLI (Opcional)
Si prefieres aplicar las migraciones localmente:
```bash
# 1. Iniciar sesión en la CLI
npx supabase login

# 2. Vincular con tu proyecto
npx supabase link --project-ref TU_PROJECT_REF

# 3. Aplicar las migraciones
npx supabase db push
```

---

## 🔐 Configuración y Variables de Entorno

1. Copia el archivo de ejemplo a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Completa los valores con las credenciales públicas de tu proyecto en Supabase (**Project Settings > API**):
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica-aqui
   VITE_APP_NAME="Hogar de Dios - Gestión Académica"
   ```

> ⚠️ **REGLA DE SEGURIDAD CRÍTICA:** Nunca expongas la clave `service_role` en variables con prefijo `VITE_` ni en ningún archivo del frontend. La clave `anon` es pública y la seguridad se delega a las políticas RLS de PostgreSQL.

### Modo Híbrido (Fallback Local Automático)
Si las variables `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están configuradas o contienen valores de ejemplo, la aplicación activa automáticamente el **modo local desacoplado** utilizando `localStorage` y `seedData.js`. Esto permite probar y desarrollar la interfaz sin conexión a internet. Al agregar las credenciales reales de Supabase, la app conmuta automáticamente sin cambiar una sola línea de código en la UI.

---

## 🗄️ Arquitectura de Base de Datos y RLS

### Tablas Principales
1. `public.perfiles_usuario`: Vinculada con `auth.users(id)` mediante trigger automático `handle_new_user()`.
2. `public.internos`: Registro de internos con restricciones de DNI y ficha criminológica únicas.
3. `public.talleres`: Cursos con control de fechas y días lectivos.
4. `public.inscripciones`: Asignación interno-taller con restricción de unicidad activa.
5. `public.asistencia`: Planilla con restricción única compuesta `(interno_id, taller_id, fecha)`.
6. `public.evaluaciones`: Calificaciones y conceptos pedagógicos.
7. `public.audit_log`: Historial inmutable de auditoría.

### Matriz de Permisos (RBAC y Row Level Security)
Se implementa la función SQL `public.is_admin()` que verifica la autorización del usuario a través de su rol en base de datos:

| Entidad | Rol `admin` | Rol `user` (Docente / Preceptor) |
| :--- | :---: | :---: |
| **Internos** | Lectura y Escritura completa (RLS) | Solo Lectura (SELECT) |
| **Talleres** | Lectura y Escritura completa (RLS) | Solo Lectura (SELECT) |
| **Inscripciones** | Lectura y Escritura completa (RLS) | Solo Lectura (SELECT) |
| **Asistencia** | Lectura, Inserción y Edición | Lectura e Inserción / Edición propia |
| **Evaluaciones** | Lectura y Escritura | Lectura y Escritura |
| **Usuarios** | Gestión total de perfiles | Solo lectura de su propio perfil |
| **Auditoría** | Consulta total del log | Registro de eventos propios |

---

## 🛡️ Seguridad y Hardening (OWASP Top 10)

- **Sanitización de Inputs (XSS):** Implementada con `DOMPurify` en `src/utils/sanitize.js`. Toda entrada de usuario y carga masiva CSV se limpia antes de ser procesada.
- **Protección contra Fuerza Bruta (Rate Limiting):** El store de autenticación bloquea temporalmente los intentos tras 5 fallos consecutivos, activando un temporizador visual de cooldown.
- **Content Security Policy (CSP):** Cabeceras y metaetiquetas restrictivas configuradas en `index.html` limitando orígenes permitidos de scripts, estilos, fuentes y conexiones de red (`connect-src` a Supabase).
- **Tokens de Sesión Seguros:** Manejo de sesión por Supabase Auth con rotación automática de tokens mediante flujo PKCE (`Proof Key for Code Exchange`).
- **Resiliencia de UI (Error Boundary):** Componente `<ErrorBoundary>` en la raíz de la app para capturar excepciones inesperadas y permitir la recuperación del usuario sin pantalla blanca.

---

## 🧪 Testing Automatizado

La aplicación incluye un conjunto de pruebas unitarias, de integración y E2E:

```bash
# Ejecutar tests unitarios y de integración con Vitest
npm test

# Ejecutar tests en modo observador interactivo
npm run test:watch

# Ejecutar tests End-to-End con Playwright
npm run test:e2e
```

### Cobertura de Tests
- `tests/unit/sanitize.test.js`: Validación de limpieza de ataques XSS y scripts maliciosos.
- `tests/unit/validators.test.js`: Validación de fortaleza de contraseñas, schemas Yup y formato de DNI.
- `tests/unit/useAlertaFaltas.test.js`: Cálculo de presentismo y disparo de alertas ante 5 ausencias consecutivas.
- `tests/integration/LoginForm.test.jsx`: Renderizado, feedback visual de errores y flujo de recuperación.
- `tests/integration/ProtectedRoute.test.jsx`: Verificación de guard de autenticación y bloqueo por roles (RBAC).
- `tests/e2e/auth.spec.js`: Flujo end-to-end de inicio de sesión con navegador real.

---

## 💻 Instalación y Ejecución Local

### Requisitos previos
- Node.js versión 18 o superior.
- Git.

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/juanho2584/Hogar_de_Cristo.git
   cd Hogar_de_Cristo
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir en el navegador: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Credenciales de Demostración

En modo local o de prueba inicial, puedes acceder con las siguientes cuentas de prueba:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@hogar.edu` | `Hogar2025` | Acceso irrestricto, CRUD total, inscripciones y gestión de usuarios |
| **Docente** | `docente@hogar.edu` | `Hogar2025` | Toma de asistencia diaria, visualización de internos y carga de evaluaciones |
| **Preceptor** | `preceptor@hogar.edu` | `Hogar2025` | Toma de asistencia diaria y consulta de reportes |

---

*Desarrollado para la Unidad Penitenciaria Hogar de Dios — Arquitectura Full-Stack Segura, Escalable y Resiliente.*
