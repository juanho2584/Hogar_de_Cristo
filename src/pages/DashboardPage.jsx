/**
 * @fileoverview DashboardPage — Panel principal con métricas, alertas y accesos rápidos adaptado a todos los dispositivos.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Shield,
  History,
} from "lucide-react";
import MainLayout from "../components/layout/MainLayout.jsx";
import useInternosStore from "../store/internosStore.js";
import useTalleresStore from "../store/talleresStore.js";
import useInscripcionesStore from "../store/inscripcionesStore.js";
import useAsistenciaStore from "../store/asistenciaStore.js";
import useAlertaFaltas from "../hooks/useAlertaFaltas.js";
import { calcularPresentismo } from "../utils/asistenciaUtils.js";
import {
  hoyISO,
  esDiaLectivo,
  formatearFechaCorta,
} from "../utils/dateUtils.js";

const MetricCard = ({
  icon: Icon,
  titulo,
  valor,
  subtitulo,
  color = "var(--primary-accent)",
  loading,
}) => (
  <div
    className="app-card rounded-4 p-3 p-md-4 h-100 d-flex flex-column justify-content-between"
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
    }}
  >
    <div className="d-flex align-items-start justify-content-between mb-2">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center"
        style={{
          width: 42,
          height: 42,
          background: `${color}22`,
          border: `1px solid ${color}44`,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <div>
      {loading ? (
        <div className="placeholder-glow">
          <span className="placeholder col-6 bg-secondary rounded" />
        </div>
      ) : (
        <div
          className="fw-bold mb-1"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            lineHeight: 1.1,
            color: "var(--text-heading)",
          }}
        >
          {valor}
        </div>
      )}
      <div
        className="fw-semibold mb-1"
        style={{ fontSize: "0.88rem", color: "var(--text-main)" }}
      >
        {titulo}
      </div>
      {subtitulo && (
        <div
          className="text-muted text-truncate"
          style={{ fontSize: "0.75rem" }}
        >
          {subtitulo}
        </div>
      )}
    </div>
  </div>
);

const AlertaCard = ({ alerta }) => (
  <div
    className="rounded-3 p-3 mb-2 d-flex align-items-start gap-3"
    style={{
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    }}
  >
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
      style={{ width: 32, height: 32, background: "rgba(239, 68, 68, 0.2)" }}
    >
      <AlertTriangle size={16} style={{ color: "var(--danger-color)" }} />
    </div>
    <div className="flex-grow-1 min-w-0">
      <div
        className="fw-semibold mb-1 text-truncate"
        style={{ fontSize: "0.88rem", color: "var(--text-heading)" }}
      >
        {alerta.nombreInterno}
      </div>
      <div className="text-muted text-truncate" style={{ fontSize: "0.78rem" }}>
        Materia: <strong className="text-warning">{alerta.cursoNombre}</strong>
        {" · "} Pab. {alerta.pabellon} — Celda {alerta.celda}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--danger-color)",
          marginTop: 3,
        }}
      >
        ⚠ {alerta.faltasConsecutivas} faltas consecutivas desde{" "}
        {formatearFechaCorta(alerta.fechaInicioRacha)}
      </div>
    </div>
    <span
      className="badge flex-shrink-0"
      style={{ background: "var(--danger-color)", fontSize: "0.75rem" }}
    >
      {alerta.faltasConsecutivas} faltas
    </span>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { internos, fetchInternos, loading: loadingI } = useInternosStore();
  const { talleres, fetchTalleres, loading: loadingC } = useTalleresStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { asistencias, fetchAsistencias } = useAsistenciaStore();
  const { alertas, totalAlertas } = useAlertaFaltas();

  useEffect(() => {
    fetchInternos();
    fetchTalleres();
    fetchInscripciones();
    fetchAsistencias();
  }, []);

  const hoy = hoyISO();
  const diaLectivo = esDiaLectivo(hoy);

  const totalInternos = internos.filter((i) => i.status === "activo").length;
  const totalTalleres = talleres.filter((c) => c.status === "activo").length;
  const totalInscripciones = inscripciones.filter(
    (i) => i.status === "activo",
  ).length;

  const { porcentaje: presentismoGeneral } = calcularPresentismo(asistencias);
  const asistenciasHoy = asistencias.filter((a) => a.fecha === hoy);

  const loading = loadingI || loadingC;

  return (
    <MainLayout
      titulo="Dashboard"
      subtitulo="Panel de control y monitoreo en tiempo real"
    >
      {/* Alertas banner */}
      {totalAlertas > 0 && (
        <div
          className="app-card rounded-4 p-3 mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
          style={{
            background:
              "linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
            border: "1px solid rgba(239,68,68,0.35)",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <AlertTriangle
              size={22}
              style={{ color: "var(--danger-color)", flexShrink: 0 }}
            />
            <div>
              <div
                className="fw-semibold"
                style={{ color: "var(--text-heading)" }}
              >
                {totalAlertas}{" "}
                {totalAlertas === 1
                  ? "interno requiere atención"
                  : "internos requieren atención"}
              </div>
              <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                Superaron las 5 faltas consecutivas en sus materias.
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm px-3 rounded-3"
            style={{
              background: "rgba(239,68,68,0.2)",
              color: "var(--danger-color)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
            onClick={() => navigate("/reportes")}
          >
            Ver Reportes
          </button>
        </div>
      )}

      {/* Indicador día lectivo */}
      {diaLectivo && (
        <div
          className="app-card rounded-4 p-3 mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
          style={{
            background:
              "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <CalendarCheck
              size={18}
              style={{ color: "var(--success-color)" }}
            />
            <span
              style={{
                color: "var(--text-heading)",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              Hoy es día lectivo — Planillas de asistencia habilitadas
            </span>
          </div>
          <button
            className="btn btn-sm px-3 rounded-3 d-flex align-items-center justify-content-center gap-1"
            style={{
              background: "var(--primary-gradient)",
              color: "#ffffff",
              border: "none",
            }}
            onClick={() => navigate("/asistencia")}
          >
            Tomar asistencia <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de métricas responsivas */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <MetricCard
            icon={Users}
            titulo="Internos Activos"
            valor={loading ? "..." : totalInternos}
            subtitulo="En el programa"
            color="#6366f1"
            loading={loading}
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            icon={BookOpen}
            titulo="talleres activos"
            valor={loading ? "..." : totalTalleres}
            subtitulo="Materias vigentes"
            color="#8b5cf6"
            loading={loading}
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            icon={ClipboardList}
            titulo="Inscripciones"
            valor={loading ? "..." : totalInscripciones}
            subtitulo="Alumnos cursando"
            color="#06b6d4"
            loading={loading}
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            icon={TrendingUp}
            titulo="Presentismo"
            valor={loading ? "..." : `${presentismoGeneral}%`}
            subtitulo="Promedio general"
            color={
              presentismoGeneral >= 75
                ? "var(--success-color)"
                : presentismoGeneral >= 50
                  ? "var(--warning-color)"
                  : "var(--danger-color)"
            }
            loading={loading}
          />
        </div>
      </div>

      <div className="row g-3">
        {/* Panel de alertas */}
        <div className="col-12 col-lg-6">
          <div
            className="app-card rounded-4 p-3 p-md-4 h-100"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2
                className="h6 mb-0 fw-semibold d-flex align-items-center gap-2"
                style={{ color: "var(--text-heading)" }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: "var(--danger-color)" }}
                />
                Alertas de Inasistencias
              </h2>
              {totalAlertas > 0 && (
                <span
                  className="badge"
                  style={{ background: "var(--danger-color)" }}
                >
                  {totalAlertas}
                </span>
              )}
            </div>
            {alertas.length === 0 ? (
              <div className="text-center py-4">
                <Shield size={40} className="text-success mb-2" />
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  Sin alertas activas. ¡Excelente asistencia general!
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {alertas.map((alerta, idx) => (
                  <AlertaCard key={idx} alerta={alerta} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asistencia de hoy */}
        <div className="col-12 col-lg-6">
          <div
            className="app-card rounded-4 p-3 p-md-4 h-100"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2
                className="h6 mb-0 fw-semibold d-flex align-items-center gap-2"
                style={{ color: "var(--text-heading)" }}
              >
                <CalendarCheck
                  size={16}
                  style={{ color: "var(--success-color)" }}
                />
                Asistencia de Hoy
              </h2>
            </div>
            {asistenciasHoy.length === 0 ? (
              <div className="text-center py-4">
                <CalendarCheck size={40} className="text-muted mb-2" />
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  {diaLectivo
                    ? "Aún no se registraron asistencias para el día de hoy."
                    : "Hoy no está configurado como día lectivo."}
                </p>
                {diaLectivo && (
                  <button
                    className="btn btn-sm mt-3 px-3 rounded-3"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--primary-accent)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    onClick={() => navigate("/asistencia")}
                  >
                    Tomar asistencia ahora
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="row g-2 mb-3">
                  {[
                    {
                      label: "Presentes",
                      val: asistenciasHoy.filter((a) => a.estado === "presente")
                        .length,
                      color: "var(--success-color)",
                    },
                    {
                      label: "Ausentes",
                      val: asistenciasHoy.filter((a) => a.estado === "ausente")
                        .length,
                      color: "var(--danger-color)",
                    },
                    {
                      label: "Tardanzas",
                      val: asistenciasHoy.filter((a) => a.estado === "tarde")
                        .length,
                      color: "var(--warning-color)",
                    },
                    {
                      label: "Justificados",
                      val: asistenciasHoy.filter(
                        (a) => a.estado === "justificado",
                      ).length,
                      color: "var(--info-color)",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="col-6 col-sm-3 col-lg-6 col-xl-3"
                    >
                      <div
                        className="rounded-3 p-2 text-center"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          className="fw-bold"
                          style={{ color, fontSize: "1.3rem" }}
                        >
                          {val}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="text-muted text-center"
                  style={{ fontSize: "0.8rem" }}
                >
                  Total registros asentados hoy:{" "}
                  <strong>{asistenciasHoy.length}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceso rápido */}
        <div className="col-12">
          <div
            className="app-card rounded-4 p-3 p-md-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2
              className="h6 mb-3 fw-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Accesos Rápidos
            </h2>
            <div className="row g-2">
              {[
                {
                  label: "Gestionar Internos",
                  to: "/internos",
                  color: "#6366f1",
                  icon: Users,
                },
                {
                  label: "Tomar Asistencia",
                  to: "/asistencia",
                  color: "#10b981",
                  icon: CalendarCheck,
                },
                {
                  label: "Ver Reportes",
                  to: "/reportes",
                  color: "#8b5cf6",
                  icon: TrendingUp,
                },
                {
                  label: "Gestionar Talleres",
                  to: "/talleres",
                  color: "#06b6d4",
                  icon: BookOpen,
                },
                {
                  label: "Auditoría / Historial",
                  to: "/historial",
                  color: "#f59e0b",
                  icon: History,
                },
              ].map(({ label, to, color, icon: Icon }) => (
                <div key={to} className="col-6 col-sm-4 col-lg">
                  <button
                    onClick={() => navigate(to)}
                    className="btn w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center gap-2 text-truncate"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                      {label}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
