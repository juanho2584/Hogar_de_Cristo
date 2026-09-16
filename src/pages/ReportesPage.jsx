/**
 * @fileoverview ReportesPage — Generación y exportación de reportes académicos detallados por materia responsivo.
 * Incluye lista de internos cursando, % de presentismo y concepto cualitativo del docente.
 */

import { useEffect, useState } from "react";
import {
  Download,
  BookOpen,
  User,
  Edit3,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout.jsx";
import useTalleresStore from "../store/talleresStore.js";
import useInternosStore from "../store/internosStore.js";
import useInscripcionesStore from "../store/inscripcionesStore.js";
import useAsistenciaStore from "../store/asistenciaStore.js";
import useAuthStore from "../store/authStore.js";
import usePermisos from "../hooks/usePermisos.js";
import useAlertaFaltas from "../hooks/useAlertaFaltas.js";
import evaluacionesService from "../services/localStorage/evaluacionesService.js";
import {
  calcularPresentismo,
  detectarFaltasConsecutivas,
} from "../utils/asistenciaUtils.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ReportesPage = () => {
  const { talleres, fetchTalleres } = useTalleresStore();
  const { internos, fetchInternos } = useInternosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { asistencias, fetchAsistencias } = useAsistenciaStore();
  const { usuario } = useAuthStore();
  const { puedeExportarReportes } = usePermisos();
  const { alertas: alertasDashboard, totalAlertas } = useAlertaFaltas();

  const [tallerSeleccionadoId, setCursoSeleccionadoId] = useState("");
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [editandoConcepto, setEditandoConcepto] = useState(null); // { internoId, concepto, calificacion, periodo }

  useEffect(() => {
    fetchTalleres();
    fetchInternos();
    fetchInscripciones();
    fetchAsistencias();
  }, []);

  // Seleccionar por defecto el primer taller activo
  useEffect(() => {
    if (!tallerSeleccionadoId && talleres.length > 0) {
      const primerActivo =
        talleres.find((c) => c.status === "activo") || talleres[0];
      if (primerActivo) setCursoSeleccionadoId(primerActivo.id);
    }
  }, [talleres, tallerSeleccionadoId]);

  // Cargar evaluaciones del curso seleccionado
  useEffect(() => {
    if (!tallerSeleccionadoId) return;
    const loadEvals = async () => {
      try {
        const evs = await evaluacionesService.getByCurso(tallerSeleccionadoId);
        setEvaluaciones(evs);
      } catch (err) {
        console.error("Error al cargar evaluaciones:", err);
      }
    };
    loadEvals();
  }, [tallerSeleccionadoId]);

  const tallerActual = talleres.find((c) => c.id === tallerSeleccionadoId);

  // Internos inscritos en este curso
  const inscripcionesCurso = inscripciones.filter(
    (i) => i.tallerId === tallerSeleccionadoId && i.status === "activo",
  );

  const listaInternosData = inscripcionesCurso
    .map((ins) => {
      const interno = internos.find((i) => i.id === ins.internoId);
      if (!interno) return null;

      const regAsistencia = asistencias
        .filter(
          (a) =>
            a.internoId === interno.id && a.tallerId === tallerSeleccionadoId,
        )
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      const stats = calcularPresentismo(regAsistencia);
      const alerta = detectarFaltasConsecutivas(regAsistencia);
      const evaluacion =
        evaluaciones.find((e) => e.internoId === interno.id) || null;

      return {
        interno,
        stats,
        alerta,
        evaluacion,
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.interno.apellidoPaterno.localeCompare(b.interno.apellidoPaterno),
    );

  const handleGuardarConcepto = async (internoId) => {
    if (!editandoConcepto || !editandoConcepto.concepto?.trim()) {
      toast.error("El concepto evaluativo no puede estar vacío.");
      return;
    }

    try {
      const evalExistente = evaluaciones.find(
        (e) => e.internoId === internoId && e.tallerId === tallerSeleccionadoId,
      );

      const payload = {
        internoId,
        tallerId: tallerSeleccionadoId,
        concepto: editandoConcepto.concepto.trim(),
        calificacion: editandoConcepto.calificacion
          ? Number(editandoConcepto.calificacion)
          : null,
        periodo: editandoConcepto.periodo || "Ciclo 2025",
        creadoPor: usuario?.id || "sistema",
      };

      if (evalExistente) {
        const updated = await evaluacionesService.update(
          evalExistente.id,
          payload,
        );
        setEvaluaciones((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
      } else {
        const nuevo = await evaluacionesService.create(payload);
        setEvaluaciones((prev) => [...prev, nuevo]);
      }

      toast.success("Concepto docente guardado.");
      setEditandoConcepto(null);
    } catch {
      toast.error("Error al guardar la evaluación.");
    }
  };

  // Promedio de presentismo del curso
  const presentismoGeneralCurso =
    listaInternosData.length > 0
      ? Math.round(
          listaInternosData.reduce(
            (acc, curr) => acc + curr.stats.porcentaje,
            0,
          ) / listaInternosData.length,
        )
      : 0;

  const handleExportarPDFGeneral = () => {
    if (!talleres.length) {
      toast.error("No hay talleres para exportar.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const totalInternos = internos.filter(
        (i) => i.status === "activo",
      ).length;
      const totalTalleresActivos = talleres.filter(
        (c) => c.status === "activo",
      ).length;
      const totalInscripciones = inscripciones.filter(
        (i) => i.status === "activo",
      ).length;
      const { porcentaje: presentismoGeneral } =
        calcularPresentismo(asistencias);

      const resumenTalleres = talleres.map((taller) => {
        const inscripcionesTaller = inscripciones.filter(
          (inscripcion) =>
            inscripcion.tallerId === taller.id &&
            inscripcion.status === "activo",
        );
        const internosTaller = inscripcionesTaller
          .map((inscripcion) =>
            internos.find((interno) => interno.id === inscripcion.internoId),
          )
          .filter(Boolean)
          .sort((a, b) =>
            (a?.apellidoPaterno || "").localeCompare(b?.apellidoPaterno || ""),
          );
        const presentismoTaller = calcularPresentismo(
          asistencias.filter((asistencia) => asistencia.tallerId === taller.id),
        ).porcentaje;

        return {
          taller,
          internosTaller,
          presentismoTaller,
          tallerista: taller?.talleristaNombre || "Sin asignar",
        };
      });

      const safeText = (value, fallback = "-") =>
        value == null || value === "" ? fallback : String(value);

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Reporte general académico", 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Resumen del dashboard institucional", 14, 25);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, 36, pageWidth - 24, 24, 3, 3, "FD");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Internos activos: ${totalInternos}`, 18, 45);
      doc.text(`Talleres activos: ${totalTalleresActivos}`, 88, 45);
      doc.text(`Inscripciones: ${totalInscripciones}`, 170, 45);
      doc.text(`Presentismo: ${presentismoGeneral}%`, 240, 45);
      doc.text(`Alertas: ${totalAlertas}`, 300, 45);
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 18, 54);

      let cursorY = 68;
      resumenTalleres.forEach((item, index) => {
        const { taller, internosTaller, presentismoTaller, tallerista } = item;

        if (cursorY > pageHeight - 85) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.text(`${index + 1}. ${safeText(taller?.nombre)}`, 14, cursorY);

        cursorY += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(
          `Código: ${safeText(taller?.codigo)} | Estado: ${safeText(taller?.status)} | Tallerista: ${safeText(tallerista)}`,
          18,
          cursorY,
        );
        cursorY += 7;
        doc.text(
          `Inscriptos: ${internosTaller.length} | Presentismo: ${presentismoTaller}%`,
          18,
          cursorY,
        );
        cursorY += 8;

        const internosTexto = internosTaller.length
          ? internosTaller
              .map(
                (interno) =>
                  `- ${safeText(interno?.apellidoPaterno)} ${safeText(interno?.apellidoMaterno)}, ${safeText(interno?.nombreCompleto)} (DNI ${safeText(interno?.dni)})`,
              )
              .join("\n")
          : "- Sin internos inscriptos";

        const lineasInternos = doc.splitTextToSize(internosTexto, 250);
        doc.text(lineasInternos, 18, cursorY);
        cursorY += Math.max(lineasInternos.length * 5.2, 18);

        doc.setDrawColor(203, 213, 225);
        doc.line(14, cursorY + 2, pageWidth - 14, cursorY + 2);
        cursorY += 12;
      });

      if (alertasDashboard.length > 0) {
        if (cursorY > pageHeight - 70) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text("Alertas activas del dashboard", 14, cursorY);
        cursorY += 8;

        const alertasTexto = alertasDashboard
          .slice(0, 6)
          .map(
            (alerta) =>
              `- ${alerta.nombreInterno} · ${alerta.cursoNombre} · ${alerta.faltasConsecutivas} faltas consecutivas`,
          )
          .join("\n");

        const lineasAlertas = doc.splitTextToSize(alertasTexto, 250);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(lineasAlertas, 18, cursorY);
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(9);
      doc.text(
        "Sistema de Gestión Académica · Hogar de Dios",
        14,
        pageHeight - 10,
      );

      doc.save(
        `reporte_general_talleres_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      toast.success("Reporte PDF general exportado correctamente.");
    } catch (error) {
      console.error("Error al exportar PDF general:", error);
      toast.error("No se pudo generar el PDF general.");
    }
  };

  const handleExportarPDFIndividual = (data) => {
    const { interno, stats, alerta, evaluacion } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte individual", 14, 19);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Taller: ${tallerActual?.nombre || "Desconocido"} (${tallerActual?.codigo || "-"})`,
      14,
      38,
    );
    doc.text(
      `Interno: ${interno.apellidoPaterno} ${interno.apellidoMaterno}, ${interno.nombreCompleto}`,
      14,
      46,
    );
    doc.text(
      `DNI: ${interno.dni} · Ficha: ${interno.fichaCriminologica}`,
      14,
      52,
    );
    doc.text(
      `Ubicación: Pab. ${interno.pabellon}${interno.sector || ""} - Celda ${interno.celda}`,
      14,
      58,
    );

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, 66, pageWidth - 24, 52, 3, 3, "S");
    doc.setFont("helvetica", "bold");
    doc.text("Resumen de rendimiento", 18, 76);
    doc.setFont("helvetica", "normal");
    doc.text(`Presentismo: ${stats.porcentaje}%`, 18, 86);
    doc.text(
      `Asistencia: ${stats.presente} presentes · ${stats.ausente} ausentes · ${stats.tarde} tardanzas · ${stats.justificado} justificadas`,
      18,
      92,
    );
    doc.text(`Total de clases: ${stats.total}`, 18, 98);

    if (alerta.tieneAlerta) {
      doc.setTextColor(220, 38, 38);
      doc.text(
        `Alerta: ${alerta.faltasConsecutivas} faltas consecutivas`,
        18,
        110,
      );
      doc.setTextColor(15, 23, 42);
    }

    doc.roundedRect(12, 124, pageWidth - 24, 56, 3, 3, "S");
    doc.setFont("helvetica", "bold");
    doc.text("Concepto del tallerista", 18, 134);
    doc.setFont("helvetica", "normal");

    if (evaluacion) {
      const splitConcepto = doc.splitTextToSize(
        `Concepto: ${evaluacion.concepto}`,
        160,
      );
      doc.text(splitConcepto, 18, 142);
      doc.text(
        `Nota: ${evaluacion.calificacion || "-"} · Período: ${evaluacion.periodo || "-"}`,
        18,
        142 + splitConcepto.length * 5,
      );
    } else {
      doc.text("Sin concepto asentado aún.", 18, 142);
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text("Sistema de Gestión Académica · Hogar de Dios", 14, 195);

    doc.save(
      `reporte_individual_${interno.dni}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast.success(`Reporte PDF de ${interno.apellidoPaterno} exportado.`);
  };

  return (
    <MainLayout
      titulo="Reportes Académicos"
      subtitulo="Rendimiento por materia, asistencia acumulada y conceptos evaluativos"
    >
      {/* Selector de Materia y Exportar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div
          className="d-flex align-items-center gap-2 flex-grow-1"
          style={{ maxWidth: 440 }}
        >
          <select
            className="form-select"
            value={tallerSeleccionadoId}
            onChange={(e) => {
              setCursoSeleccionadoId(e.target.value);
              setEditandoConcepto(null);
            }}
          >
            <option value="">-- Seleccionar taller --</option>
            {talleres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo}) — {c.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2">
          {puedeExportarReportes && (
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-1 rounded-3 px-3 py-2 btn-primary-gradient"
                onClick={handleExportarPDFGeneral}
                disabled={talleres.length === 0}
              >
                <Download size={14} /> PDF General
              </button>
            </div>
          )}
        </div>
      </div>

      {!tallerActual ? (
        <div className="app-card rounded-4 p-5 text-center text-muted border-subtle-custom">
          <BookOpen size={48} className="mb-3 opacity-50" />
          <h2 className="h6 fw-semibold text-heading-color">
            Seleccioná un taller para generar el reporte
          </h2>
        </div>
      ) : (
        <div>
          {/* Header de Resumen del Curso */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-4">
              <div className="app-card rounded-4 p-3 h-100 border-subtle-custom">
                <div className="text-muted fs-xs">Total Inscriptos</div>
                <div
                  className="fw-bold text-heading-color"
                  style={{ fontSize: "1.6rem" }}
                >
                  {listaInternosData.length} alumnos
                </div>
                <div className="text-muted fs-xs">En cursada activa</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <div className="app-card rounded-4 p-3 h-100 border-subtle-custom">
                <div className="text-muted fs-xs">Presentismo General</div>
                <div
                  className="fw-bold"
                  style={{
                    fontSize: "1.6rem",
                    color:
                      presentismoGeneralCurso >= 75
                        ? "var(--success-color)"
                        : presentismoGeneralCurso >= 50
                          ? "var(--warning-color)"
                          : "var(--danger-color)",
                  }}
                >
                  {presentismoGeneralCurso}%
                </div>
                <div className="text-muted fs-xs">
                  Promedio de asistencia del taller
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="app-card rounded-4 p-3 h-100 border-subtle-custom">
                <div className="text-muted fs-xs">Evaluaciones Asentadas</div>
                <div
                  className="fw-bold text-primary-accent"
                  style={{ fontSize: "1.6rem", color: "var(--primary-accent)" }}
                >
                  {evaluaciones.length} / {listaInternosData.length}
                </div>
                <div className="text-muted fs-xs">
                  Conceptos de tallerista registrados
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Detallada por Interno */}
          {listaInternosData.length === 0 ? (
            <div className="app-card rounded-4 p-5 text-center text-muted border-subtle-custom">
              <User size={48} className="mb-3 opacity-50" />
              <h2 className="h6 fw-semibold text-heading-color">
                No hay internos inscriptos en este taller
              </h2>
            </div>
          ) : (
            <div className="app-card rounded-4 overflow-hidden border-subtle-custom">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0 align-middle">
                  <thead
                    style={{
                      background: "var(--bg-input)",
                      fontSize: "0.76rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <tr>
                      <th
                        className="py-3 ps-4"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Interno / DNI
                      </th>
                      <th
                        className="py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Ubicación
                      </th>
                      <th
                        className="py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Presentismo
                      </th>
                      <th
                        className="py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Desglose Asistencia
                      </th>
                      <th
                        className="py-3 pe-4 text-muted"
                        style={{ minWidth: 280 }}
                      >
                        Concepto Evaluativo
                      </th>
                      <th className="py-3 text-center pe-4 text-muted">PDF</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "0.86rem" }}>
                    {listaInternosData.map(
                      ({ interno, stats, alerta, evaluacion }) => {
                        const estaEditando =
                          editandoConcepto?.internoId === interno.id;

                        return (
                          <tr
                            key={interno.id}
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            {/* Interno */}
                            <td className="py-3 ps-4">
                              <div
                                className="fw-semibold"
                                style={{ color: "var(--text-heading)" }}
                              >
                                {interno.apellidoPaterno}{" "}
                                {interno.apellidoMaterno},{" "}
                                {interno.nombreCompleto}
                              </div>
                              <div
                                className="text-muted font-monospace"
                                style={{ fontSize: "0.72rem" }}
                              >
                                DNI: {interno.dni} · Ficha:{" "}
                                {interno.fichaCriminologica}
                              </div>
                              {alerta.tieneAlerta && (
                                <div
                                  className="badge mt-1 d-inline-flex align-items-center gap-1"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.15)",
                                    color: "var(--danger-color)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  <AlertTriangle size={11} />{" "}
                                  {alerta.faltasConsecutivas} inasistencias
                                  seguidas
                                </div>
                              )}
                            </td>

                            {/* Ubicación */}
                            <td className="py-3">
                              <span className="badge btn-outline-custom">
                                Pab. {interno.pabellon}
                                {interno.sector || ""} - C. {interno.celda}
                              </span>
                            </td>

                            {/* Presentismo */}
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="fw-bold"
                                  style={{
                                    fontSize: "1rem",
                                    color:
                                      stats.porcentaje >= 75
                                        ? "var(--success-color)"
                                        : stats.porcentaje >= 50
                                          ? "var(--warning-color)"
                                          : "var(--danger-color)",
                                  }}
                                >
                                  {stats.porcentaje}%
                                </span>
                                <div
                                  className="progress flex-grow-1"
                                  style={{
                                    width: 60,
                                    height: 6,
                                    background: "rgba(255,255,255,0.1)",
                                  }}
                                >
                                  <div
                                    className="progress-bar"
                                    style={{
                                      width: `${stats.porcentaje}%`,
                                      background:
                                        stats.porcentaje >= 75
                                          ? "var(--success-color)"
                                          : stats.porcentaje >= 50
                                            ? "var(--warning-color)"
                                            : "var(--danger-color)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Desglose */}
                            <td className="py-3">
                              <div
                                className="d-flex gap-1"
                                style={{ fontSize: "0.75rem" }}
                              >
                                <span className="text-success">
                                  {stats.presente}P
                                </span>
                                <span className="text-muted">/</span>
                                <span className="text-danger">
                                  {stats.ausente}A
                                </span>
                                <span className="text-muted">/</span>
                                <span className="text-warning">
                                  {stats.tarde}T
                                </span>
                                <span className="text-muted">/</span>
                                <span className="text-info">
                                  {stats.justificado}J
                                </span>
                              </div>
                              <div
                                className="text-muted"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {stats.total} clases totales
                              </div>
                            </td>

                            {/* Concepto Evaluativo */}
                            <td className="py-3 pe-4">
                              {estaEditando ? (
                                <div
                                  className="d-flex flex-column gap-2 p-2 rounded-3"
                                  style={{ background: "var(--bg-input)" }}
                                >
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={editandoConcepto.concepto}
                                    placeholder="Escribí el concepto (participación, conducta, avances)..."
                                    onChange={(e) =>
                                      setEditandoConcepto((prev) => ({
                                        ...prev,
                                        concepto: e.target.value,
                                      }))
                                    }
                                  />
                                  <div className="d-flex gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      className="form-control form-control-sm"
                                      style={{ width: 70 }}
                                      placeholder="Nota"
                                      value={
                                        editandoConcepto.calificacion ?? ""
                                      }
                                      onChange={(e) =>
                                        setEditandoConcepto((prev) => ({
                                          ...prev,
                                          calificacion: e.target.value,
                                        }))
                                      }
                                    />
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Período (ej: 1er Cuatr. 2025)"
                                      value={editandoConcepto.periodo}
                                      onChange={(e) =>
                                        setEditandoConcepto((prev) => ({
                                          ...prev,
                                          periodo: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success p-1 px-2"
                                      onClick={() =>
                                        handleGuardarConcepto(interno.id)
                                      }
                                      title="Guardar concepto"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary p-1 px-2"
                                      onClick={() => setEditandoConcepto(null)}
                                      title="Cancelar"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="d-flex align-items-start justify-content-between gap-2">
                                  <div className="flex-grow-1">
                                    {evaluacion ? (
                                      <div>
                                        <p
                                          className="mb-1"
                                          style={{
                                            fontSize: "0.82rem",
                                            color: "var(--text-main)",
                                          }}
                                        >
                                          "{evaluacion.concepto}"
                                        </p>
                                        <div
                                          className="d-flex align-items-center gap-2"
                                          style={{ fontSize: "0.72rem" }}
                                        >
                                          {evaluacion.calificacion && (
                                            <span
                                              className="badge"
                                              style={{
                                                background:
                                                  "rgba(16, 185, 129, 0.2)",
                                                color: "var(--success-color)",
                                              }}
                                            >
                                              Nota: {evaluacion.calificacion}/10
                                            </span>
                                          )}
                                          <span className="text-muted">
                                            ({evaluacion.periodo})
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span
                                        className="text-muted fst-italic"
                                        style={{ fontSize: "0.8rem" }}
                                      >
                                        Sin concepto docente asentado
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm p-1 px-2 rounded-2"
                                    style={{
                                      background: "var(--bg-input)",
                                      color: "var(--primary-accent)",
                                      border: "1px solid var(--border-subtle)",
                                      fontSize: "0.75rem",
                                    }}
                                    onClick={() =>
                                      setEditandoConcepto({
                                        internoId: interno.id,
                                        concepto: evaluacion?.concepto || "",
                                        calificacion:
                                          evaluacion?.calificacion ?? "",
                                        periodo:
                                          evaluacion?.periodo ||
                                          "1er Cuatrimestre 2025",
                                      })
                                    }
                                  >
                                    <Edit3 size={13} className="me-1" />
                                    {evaluacion ? "Editar" : "Evaluar"}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-center pe-4">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-custom p-1 px-2 rounded-2"
                                onClick={() =>
                                  handleExportarPDFIndividual({
                                    interno,
                                    stats,
                                    alerta,
                                    evaluacion,
                                  })
                                }
                                title="Exportar Reporte Individual"
                              >
                                <Download size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default ReportesPage;
