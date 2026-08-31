# Sistema de Gestión Académica y Control de Asistencia
## Unidad Penitenciaria "Hogar de Dios"

Plataforma web full-stack moderna (frontend-first con persistencia progresiva) para la administración de cursos, registro y control de internos, toma de asistencia diaria con detección automática de alertas y generación de reportes académicos cualitativos y cuantitativos.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Reglas de Negocio Implementadas](#-reglas-de-negocio-implementadas)
3. [Roles y Permisos](#-roles-y-permisos)
4. [Stack Tecnológico](#-stack-tecnológico)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Instalación y Ejecución](#-instalación-y-ejecución)
7. [Credenciales de Demostración](#-credenciales-de-demostración)
8. [Arquitectura de Datos y Formatos CSV](#-arquitectura-de-datos-y-formatos-csv)
9. [Plan de Migración a Base de Datos Relacional (Supabase / PostgreSQL)](#-plan-de-migración-a-base-de-datos-relacional-supabase--postgresql)

---

## 🚀 Características Principales

- **Dashboard Ejecutivo Interactivo:** Métricas globales en tiempo real (total de internos activos, cursos, % de presentismo promedio general, desglose del día y accesos directos).
- **Gestión de Internos (CRUD):** Registro con datos específicos penitenciarios (Apellido Paterno, Apellido Materno, Nombre Completo, DNI, Ficha Criminológica, Pabellón y Celda).
- **Gestión de Cursos y Materias (CRUD):** Configuración de códigos, docentes a cargo, fechas y selección de días lectivos semanales.
- **Inscripciones con Validación:** Asignación de internos a cursos respetando la restricción de inscripción única activa.
- **Planilla Diaria de Asistencia:** Toma de asistencia rápida por curso con estados (`Presente`, `Ausente`, `Tarde`, `Justificado`), botón para marcar a todos presentes y filtro inteligente de días lectivos.
- **Detección Automática de Ausentismo Crítico (Regla de 5 Faltas):** Alerta visual destacada en Dashboard y Reportes para evaluar la suspensión o continuidad de internos en riesgo.
- **Módulo de Reportes y Evaluaciones Docentes:** Vista consolidada por materia con % de presentismo, desglose de inasistencias, redacción de conceptos cualitativos y notas, y exportación a CSV.
- **Importación y Exportación CSV:** Soporte nativo bidireccional mediante `papaparse`.

---

## ⚖️ Reglas de Negocio Implementadas

### 1. Inscripción Única Simultánea
Un interno **NO** puede estar inscrito en más de una materia o curso de forma simultánea. Al momento de generar una nueva inscripción o editar una existente, el sistema valida que no exista un registro con `status: 'activo'` para ese `internoId`. En los formularios, los internos ya inscritos aparecen automáticamente deshabilitados.

### 2. Alerta de Inasistencias (Regla de 5 Faltas Consecutivas)
Si un interno acumula **5 faltas consecutivas** (`estado: 'ausente'`) en el historial cronológico de un curso:
- Se dispara automáticamente una alerta en el **Dashboard** con tarjeta de advertencia en rojo indicando nombre, pabellón, celda y fecha de inicio de la racha.
- En el módulo de **Reportes** se resalta el estado de riesgo académico para decisión de las autoridades.

### 3. Calendario Académico Flexibilizado
Por defecto, los días lectivos habilitados son **Lunes, Martes y Jueves**. La arquitectura está completamente desacoplada mediante un archivo de configuración centralizado (`src/config/academicConfig.js`).
```javascript
// src/config/academicConfig.js
export const ACADEMIC_CONFIG = {
  diasLectivos: ['lunes', 'martes', 'jueves'], // Modificable globalmente
  maxFaltasConsecutivas: 5,
  nombreInstitucion: 'Hogar de Dios',
};
```
Cada curso permite además personalizar sus días de cursada específicos dentro de los días habilitados.

---

## 👥 Roles y Permisos

| Módulo / Acción | Rol `ADMIN` (Director / Coordinador) | Rol `USER` (Docente / Preceptor) |
| :--- | :---: | :---: |
| **Dashboard** | Visualización completa + Alertas | Visualización de métricas |
| **Internos (CRUD)** | Crear, Editar, Eliminar, Importar CSV | Solo Lectura |
| **Cursos (CRUD)** | Crear, Editar, Eliminar | Solo Lectura |
| **Inscripciones** | Acceso total (Alta y Baja) | Sin acceso |
| **Asistencia** | Toma diaria + Edición de fechas pasadas | Toma de asistencia diaria |
| **Reportes** | Ver conceptos + Exportar CSV | Ver conceptos y cargar evaluaciones |
| **Gestión Usuarios** | Crear, Editar y Eliminar cuentas | Sin acceso |

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 (Vite) en JavaScript Moderno (ES6+).
- **Enrutamiento:** `react-router-dom` v6 con rutas protegidas (`ProtectedRoute`).
- **Diseño & Layout:** Bootstrap 5 con tema SaaS Dark personalizado y tipografía *Plus Jakarta Sans*.
- **Estado Global:** `zustand` para manejo reactivo y desacoplado de entidades.
- **Formularios & Validación:** `react-hook-form` con schemas rigurosos en `yup`.
- **Notificaciones:** `react-hot-toast` para confirmaciones de operaciones CRUD.
- **Manejo de CSV:** `papaparse` para lectura y generación de archivos tabulares.
- **Iconografía:** `lucide-react`.

---

## 📁 Estructura del Proyecto

```
App Hogar de Dios/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx       # Guard de rutas y roles
│   │   └── layout/
│   │       ├── Header.jsx              # Barra superior con fecha y estado lectivo
│   │       ├── MainLayout.jsx          # Wrapper unificado de páginas
│   │       └── Sidebar.jsx             # Barra lateral con navegación por roles
│   ├── config/
│   │   └── academicConfig.js           # Días lectivos y umbrales configurables
│   ├── hooks/
│   │   ├── useAlertaFaltas.js          # Detección reactiva de 5 faltas consecutivas
│   │   └── usePermisos.js              # Abstracción de permisos según rol
│   ├── pages/
│   │   ├── AsistenciaPage.jsx          # Planilla de asistencia diaria por curso
│   │   ├── CursosPage.jsx              # CRUD de cursos/materias
│   │   ├── DashboardPage.jsx           # Panel de control métrico y alertas
│   │   ├── InscripcionesPage.jsx       # Asignación de internos a cursos
│   │   ├── InternosPage.jsx            # CRUD de internos penitenciarios
│   │   ├── LoginPage.jsx               # Autenticación con formulario validado
│   │   ├── ReportesPage.jsx            # Reportes académicos y conceptos docentes
│   │   └── UsuariosPage.jsx            # Gestión de usuarios del personal (Admin)
│   ├── services/
│   │   ├── base/
│   │   │   └── IDataService.js         # Contrato de interfaz genérica (swap-ready)
│   │   ├── csv/
│   │   │   └── csvService.js           # Servicio PapaParse para import/export
│   │   └── localStorage/               # Implementación Fase 1 (LocalStorage)
│   │       ├── asistenciaService.js
│   │       ├── cursosService.js
│   │       ├── evaluacionesService.js
│   │       ├── inscripcionesService.js
│   │       ├── internosService.js
│   │       ├── storageUtils.js
│   │       └── usuariosService.js
│   ├── store/                          # Stores Zustand
│   │   ├── asistenciaStore.js
│   │   ├── authStore.js
│   │   ├── cursosStore.js
│   │   ├── inscripcionesStore.js
│   │   ├── internosStore.js
│   │   └── usuariosStore.js
│   ├── utils/
│   │   ├── asistenciaUtils.js          # Cálculos de presentismo y rachas
│   │   ├── dateUtils.js                # Formateo y filtros de días lectivos
│   │   ├── seedData.js                 # Carga automática de datos de prueba
│   │   └── validators.js               # Schemas Yup para formularios
│   ├── App.jsx                         # Enrutador principal y configuración Toast
│   ├── index.css                       # Estilos base, fuentes y custom Bootstrap
│   └── main.jsx
├── package.json
└── README.md
```

---

## 💻 Instalación y Ejecución

### Requisitos previos
- Node.js versión 18 o superior.
- Gestor de paquetes `npm`.

### Pasos
1. Clonar o abrir el directorio del proyecto:
   ```bash
   cd "App Hogar de Dios"
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Credenciales de Demostración

Al iniciar la aplicación por primera vez, se inicializa automáticamente un set completo de datos de prueba con internos, cursos, asistencias históricas y usuarios:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@hogar.edu` | `Hogar2025` |
| **Docente / Preceptor** | `docente@hogar.edu` | `Hogar2025` |
| **Preceptor Auxiliar** | `preceptor@hogar.edu` | `Hogar2025` |

---

## 📊 Arquitectura de Datos y Formatos CSV

### `internos.csv`
```csv
id,apellidoPaterno,apellidoMaterno,nombreCompleto,dni,fichaCriminologica,pabellon,celda,status,fechaIngreso,notas
int-001,García,López,Marcos Alejandro,30123456,FC-2023-001,A,12,activo,2025-07-06,Sin observaciones
```

### `cursos.csv`
```csv
id,nombre,codigo,descripcion,docenteId,diasCursada,fechaInicio,fechaFin,status
curso-001,Matemática,MAT-01,Aritmética y álgebra,user-docente-001,"lunes,martes,jueves",2025-07-01,2025-12-15,activo
```

### `inscripciones.csv`
```csv
id,internoId,cursoId,fechaInscripcion,status
ins-001,int-001,curso-001,2025-07-06,activo
```

### `asistencia.csv`
```csv
id,internoId,cursoId,fecha,estado,notas,registradoPor
asis-001,int-001,curso-001,2025-08-04,presente,,user-docente-001
```

---

## 🗄️ Plan de Migración a Base de Datos Relacional (Supabase / PostgreSQL)

La aplicación fue diseñada siguiendo el patrón **Repository / Service Layer**, desacoplando totalmente la lógica visual y los Zustand stores del medio de almacenamiento.

### Pasos para migrar a Supabase (Fase 2):

1. **Creación del Proyecto:** Crear un proyecto en [Supabase](https://supabase.com) y configurar las variables de entorno:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon
   ```

2. **Ejecutar Script DDL de Base de Datos:**
   ```sql
   -- 1. Tabla Internos
   CREATE TABLE public.internos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     apellido_paterno TEXT NOT NULL,
     apellido_materno TEXT NOT NULL,
     nombre_completo TEXT NOT NULL,
     dni TEXT UNIQUE NOT NULL,
     ficha_criminologica TEXT UNIQUE NOT NULL,
     pabellon TEXT NOT NULL,
     celda TEXT NOT NULL,
     status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'suspendido')),
     fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
     notas TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- 2. Tabla Cursos
   CREATE TABLE public.cursos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     nombre TEXT NOT NULL,
     codigo TEXT UNIQUE NOT NULL,
     descripcion TEXT,
     docente_id UUID REFERENCES auth.users(id),
     dias_cursada TEXT[] NOT NULL DEFAULT ARRAY['lunes','martes','jueves'],
     fecha_inicio DATE NOT NULL,
     fecha_fin DATE NOT NULL,
     status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'finalizado', 'cancelado')),
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- 3. Tabla Inscripciones (con restricción de 1 activa por interno)
   CREATE TABLE public.inscripciones (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
     curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
     fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
     status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'baja')),
     created_at TIMESTAMPTZ DEFAULT now()
   );

   CREATE UNIQUE INDEX unique_active_enrollment_per_intern 
     ON public.inscripciones (interno_id) 
     WHERE (status = 'activo');

   -- 4. Tabla Asistencia
   CREATE TABLE public.asistencia (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
     curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
     fecha DATE NOT NULL,
     estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente', 'tarde', 'justificado')),
     notas TEXT,
     registrado_por UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ DEFAULT now(),
     CONSTRAINT unique_daily_attendance UNIQUE (interno_id, curso_id, fecha)
   );

   -- 5. Tabla Evaluaciones Docentes
   CREATE TABLE public.evaluaciones (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     interno_id UUID NOT NULL REFERENCES public.internos(id) ON DELETE CASCADE,
     curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
     concepto TEXT NOT NULL,
     calificacion NUMERIC(3,1) CHECK (calificacion >= 1 AND calificacion <= 10),
     periodo TEXT NOT NULL,
     creado_por UUID REFERENCES auth.users(id),
     actualizado_en TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **Habilitar Row Level Security (RLS):**
   ```sql
   ALTER TABLE public.internos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

   -- Política de lectura para usuarios autenticados
   CREATE POLICY "Lectura para personal autenticado" 
     ON public.internos FOR SELECT TO authenticated USING (true);

   -- Política de escritura solo para administradores
   CREATE POLICY "Escritura solo para admins" 
     ON public.internos FOR ALL TO authenticated 
     USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin');
   ```

4. **Crear la capa `src/services/supabase/`:**
   Implementar los mismos métodos (`getAll`, `getById`, `create`, `update`, `delete`) consumiendo `@supabase/supabase-js`.

5. **Intercambiar Imports en los Stores:**
   Cambiar:
   ```javascript
   // Antes:
   import internosService from '../services/localStorage/internosService.js';
   // Ahora:
   import internosService from '../services/supabase/internosService.js';
   ```
   **¡Los componentes de la UI y los formularios no requieren ninguna modificación!**
