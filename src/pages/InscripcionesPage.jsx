/**
 * @fileoverview InscripcionesPage — Gestión de inscripciones (solo ADMIN) responsivo.
 * Aplica la regla de negocio: 1 inscripción activa por interno.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Trash2, X, ClipboardList, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout.jsx";
import useInscripcionesStore from "../store/inscripcionesStore.js";
import useInternosStore from "../store/internosStore.js";
import useTalleresStore from "../store/talleresStore.js";
import { inscripcionSchema } from "../utils/validators.js";
import { hoyISO, formatearFechaCorta } from "../utils/dateUtils.js";

const STATUS_LABELS = {
  activo: "Activo",
  completado: "Completado",
  baja: "Baja",
};
const STATUS_BADGE_STYLE = {
  activo: {
    bg: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  completado: {
    bg: "rgba(6, 182, 212, 0.15)",
    color: "#06b6d4",
    border: "rgba(6, 182, 212, 0.3)",
  },
  baja: {
    bg: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
};

const InscripcionesPage = () => {
  const {
    inscripciones,
    fetchInscripciones,
    createInscripcion,
    updateInscripcion,
    deleteInscripcion,
    loading,
  } = useInscripcionesStore();
  const { internos, fetchInternos } = useInternosStore();
  const { talleres, fetchTalleres } = useTalleresStore();

  const [showModal, setShowModal] = useState(false);
  const [filtroCurso, setFiltroCurso] = useState("todos");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(inscripcionSchema),
    defaultValues: { fechaInscripcion: hoyISO() },
  });

  const internoSeleccionadoId = watch("internoId");
  const inscripcionActiva = internoSeleccionadoId
    ? inscripciones.find(
        (i) => i.internoId === internoSeleccionadoId && i.status === "activo",
      )
    : null;

  useEffect(() => {
    fetchInscripciones();
    fetchInternos();
    fetchTalleres();
  }, []);

  const cerrarModal = () => {
    setShowModal(false);
    reset({ fechaInscripcion: hoyISO() });
  };

  const onSubmit = async (data) => {
    const result = await createInscripcion(data);
    if (result.ok) {
      toast.success("Inscripción creada correctamente.");
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleDarBaja = async (id) => {
    if (!window.confirm("¿Dar de baja esta inscripción?")) return;
    const result = await updateInscripcion(id, { status: "baja" });
    if (result.ok) toast.success("Inscripción dada de baja.");
    else toast.error(result.error);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta inscripción permanentemente?")) return;
    const result = await deleteInscripcion(id);
    if (result.ok) toast.success("Inscripción eliminada.");
    else toast.error(result.error);
  };

  const getInterno = (id) => internos.find((i) => i.id === id);
  const getTaller = (id) => talleres.find((c) => c.id === id);

  const internosSinInscripcionActiva = internos.filter(
    (i) =>
      !inscripciones.some(
        (ins) => ins.internoId === i.id && ins.status === "activo",
      ),
  );

  const inscripcionesFiltradas = inscripciones.filter((i) => {
    if (filtroCurso !== "todos" && i.tallerId !== filtroCurso) return false;
    return true;
  });

  return (
    <MainLayout
      titulo="Inscripciones a Talleres"
      subtitulo="Asignación académica de internos y control de cupos (1 taller activo por interno)"
    >
      {/* Toolbar */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div
          className="d-flex align-items-center gap-2 flex-grow-1"
          style={{ maxWidth: 360 }}
        >
          <select
            className="form-select"
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
          >
            <option value="todos">Todos los talleres</option>
            {talleres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo})
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2">
          <button
            id="btn-nueva-inscripcion"
            type="button"
            className="btn btn-sm d-flex align-items-center gap-1 fw-semibold rounded-3 px-3 py-2"
            style={{
              background: "var(--primary-gradient)",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 4px 12px var(--primary-glow)",
            }}
            onClick={() => {
              reset({ fechaInscripcion: hoyISO() });
              setShowModal(true);
            }}
          >
            <Plus size={16} /> Nueva Inscripción
          </button>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div
        className="app-card rounded-4 overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{ color: "var(--primary-accent)" }}
            />
          </div>
        ) : inscripcionesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <ClipboardList size={48} className="mb-3 opacity-50" />
            <p>No hay inscripciones registradas con este filtro.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead
                style={{
                  background: "var(--bg-input)",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <tr>
                  <th
                    className="py-3 ps-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Interno
                  </th>
                  <th className="py-3" style={{ color: "var(--text-muted)" }}>
                    Curso Asignado
                  </th>
                  <th className="py-3" style={{ color: "var(--text-muted)" }}>
                    Fecha Inscripción
                  </th>
                  <th className="py-3" style={{ color: "var(--text-muted)" }}>
                    Estado
                  </th>
                  <th
                    className="py-3 text-center pe-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "0.88rem" }}>
                {inscripcionesFiltradas.map((ins) => {
                  const interno = getInterno(ins.internoId);
                  const taller = getTaller(ins.tallerId);
                  const badgeStyle =
                    STATUS_BADGE_STYLE[ins.status] || STATUS_BADGE_STYLE.activo;

                  return (
                    <tr
                      key={ins.id}
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {/* Interno */}
                      <td className="py-3 ps-4">
                        <div
                          className="fw-semibold"
                          style={{ color: "var(--text-heading)" }}
                        >
                          {interno
                            ? `${interno.apellidoPaterno} ${interno.nombreCompleto}`
                            : "Interno desconocido"}
                        </div>
                        {interno && (
                          <div
                            className="text-muted font-monospace"
                            style={{ fontSize: "0.75rem" }}
                          >
                            DNI: {interno.dni} · Pab. {interno.pabellon} - C.{" "}
                            {interno.celda}
                          </div>
                        )}
                      </td>

                      {/* Taller */}
                      <td className="py-3">
                        <span
                          className="fw-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {taller?.nombre || "Taller no encontrado"}
                        </span>
                        {taller && (
                          <div
                            className="text-muted font-monospace"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {taller.codigo}
                          </div>
                        )}
                      </td>

                      {/* Fecha */}
                      <td
                        className="py-3 text-muted"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {formatearFechaCorta(ins.fechaInscripcion)}
                      </td>

                      {/* Estado */}
                      <td className="py-3">
                        <span
                          className="badge"
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                            fontSize: "0.75rem",
                          }}
                        >
                          {STATUS_LABELS[ins.status] || ins.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 text-center pe-4">
                        <div className="d-flex justify-content-center gap-1">
                          {ins.status === "activo" && (
                            <button
                              type="button"
                              className="btn btn-sm rounded-2 px-2 py-1"
                              style={{
                                background: "rgba(239,68,68,0.12)",
                                color: "var(--danger-color)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                fontSize: "0.78rem",
                              }}
                              onClick={() => handleDarBaja(ins.id)}
                            >
                              Dar de baja
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm rounded-2 p-2"
                            style={{
                              background: "var(--bg-input)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border-subtle)",
                            }}
                            onClick={() => handleEliminar(ins.id)}
                            title="Eliminar registro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Inscripción */}
      {showModal && (
        <div
          className="app-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="app-modal-content" style={{ maxWidth: "520px" }}>
            <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h2
                className="h5 mb-0 fw-bold"
                style={{ color: "var(--text-heading)" }}
              >
                Nueva Inscripción
              </h2>
              <button
                type="button"
                className="btn btn-sm p-1 rounded-2"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
                onClick={cerrarModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <form
                id="form-inscripcion"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="row g-3">
                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Interno *
                    </label>
                    <select
                      className={`form-select ${errors.internoId ? "is-invalid" : ""}`}
                      {...register("internoId")}
                    >
                      <option value="">-- Seleccionar Interno --</option>
                      {internosSinInscripcionActiva.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.apellidoPaterno} {i.nombreCompleto} (DNI: {i.dni},
                          Pab. {i.pabellon})
                        </option>
                      ))}
                    </select>
                    {errors.internoId && (
                      <div className="invalid-feedback">
                        {errors.internoId.message}
                      </div>
                    )}
                    {internosSinInscripcionActiva.length === 0 && (
                      <div
                        className="text-warning mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Todos los internos ya cuentan con una inscripción
                        activa.
                      </div>
                    )}
                  </div>

                  {inscripcionActiva && (
                    <div className="col-12">
                      <div
                        className="rounded-3 p-3 d-flex align-items-center gap-2"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "var(--danger-color)",
                        }}
                      >
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span style={{ fontSize: "0.8rem" }}>
                          Este interno ya cuenta con una inscripción activa.
                          Debe darse de baja primero.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Taller *
                    </label>
                    <select
                      className={`form-select ${errors.tallerId ? "is-invalid" : ""}`}
                      {...register("tallerId")}
                    >
                      <option value="">-- Seleccionar taller --</option>
                      {talleres
                        .filter((c) => c.status === "activo")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.codigo})
                          </option>
                        ))}
                    </select>
                    {errors.tallerId && (
                      <div className="invalid-feedback">
                        {errors.tallerId.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Fecha de Inscripción *
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.fechaInscripcion ? "is-invalid" : ""}`}
                      {...register("fechaInscripcion")}
                    />
                    {errors.fechaInscripcion && (
                      <div className="invalid-feedback">
                        {errors.fechaInscripcion.message}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="app-modal-footer">
              <button
                type="button"
                className="btn btn-sm px-3 rounded-3"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-inscripcion"
                className="btn btn-sm fw-semibold px-3 py-2 rounded-3"
                style={{
                  background: "var(--primary-gradient)",
                  color: "#ffffff",
                  border: "none",
                }}
                disabled={loading || !!inscripcionActiva}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-1" />
                )}
                Confirmar Inscripción
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InscripcionesPage;
