/**
 * @fileoverview App.jsx — Enrutador principal de la aplicación con ErrorBoundary,
 * guards de autenticación (PublicRoute, ProtectedRoute con RBAC), carga de seed data y soporte de temas.
 */

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InternosPage from "./pages/InternosPage.jsx";
import TalleresPage from "./pages/TalleresPage.jsx";
import InscripcionesPage from "./pages/InscripcionesPage.jsx";
import AsistenciaPage from "./pages/AsistenciaPage.jsx";
import ReportesPage from "./pages/ReportesPage.jsx";
import UsuariosPage from "./pages/UsuariosPage.jsx";
import HistorialPage from "./pages/HistorialPage.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicRoute from "./components/auth/PublicRoute.jsx";
import ErrorBoundary from "./components/feedback/ErrorBoundary.jsx";

import { cargarSeedData } from "./utils/seedData.js";
import { STORAGE_KEYS } from "./services/localStorage/storageUtils.js";
import useThemeStore from "./store/themeStore.js";
import useAuthStore from "./store/authStore.js";
import { isSupabaseConfigured } from "./lib/baas/supabaseClient.js";

function App() {
  const [initLoaded, setInitLoaded] = useState(false);
  const { theme } = useThemeStore();
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  useEffect(() => {
    // 1. Inicializar listener de Supabase Auth si está configurado
    initAuthListener();

    // 2. Cargar seed data para modo local si no se ha cargado previamente
    const initApp = async () => {
      if (!isSupabaseConfigured()) {
        const seedLoaded = localStorage.getItem(STORAGE_KEYS.SEED_LOADED);
        if (!seedLoaded) {
          await cargarSeedData();
        }
      }
      setInitLoaded(true);
    };

    initApp();
  }, [initAuthListener]);

  if (!initLoaded) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          background: "var(--bg-main, #0b1120)",
          color: "var(--primary-accent, #3b82f6)",
        }}
      >
        <div className="text-center">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Iniciando aplicación...</span>
          </div>
          <div className="text-secondary small fw-medium">
            Cargando entorno seguro...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Sistema global de notificaciones Toast adaptado al tema */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background:
                theme === "high-contrast"
                  ? "#000000"
                  : theme === "light"
                    ? "#ffffff"
                    : "#151d30",
              color:
                theme === "high-contrast"
                  ? "#ffffff"
                  : theme === "light"
                    ? "#0f172a"
                    : "#f8fafc",
              border:
                theme === "high-contrast"
                  ? "2px solid #facc15"
                  : "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
              fontSize: "0.88rem",
              borderRadius: "12px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#ffffff",
              },
            },
          }}
        />

        <Routes>
          {/* Ruta pública con guard de usuario ya autenticado */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Rutas protegidas (Docente y Admin) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/internos"
            element={
              <ProtectedRoute>
                <InternosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/talleres"
            element={
              <ProtectedRoute>
                <TalleresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/asistencia"
            element={
              <ProtectedRoute>
                <AsistenciaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <ReportesPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas exclusivas para ADMIN */}
          <Route
            path="/inscripciones"
            element={
              <ProtectedRoute requireAdmin>
                <InscripcionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute requireAdmin>
                <HistorialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requireAdmin>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
