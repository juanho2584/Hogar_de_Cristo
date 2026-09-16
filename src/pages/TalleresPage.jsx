/**
 * @fileoverview TalleresPage — CRUD y gestión académica de Talleres responsivo.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Edit2, Trash2, X, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout.jsx";
import useTalleresStore from "../store/talleresStore.js";
import useUsuariosStore from "../store/usuariosStore.js";
import useInscripcionesStore from "../store/inscripcionesStore.js";
import usePermisos from "../hooks/usePermisos.js";
import { cursoSchema } from "../utils/validators.js";
import { formatearFechaCorta } from "../utils/dateUtils.js";
import { ACADEMIC_CONFIG, DIAS_NOMBRES } from "../config/academicConfig.js";

const STATUS_LABELS = {
  activo: "Activo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};
const STATUS_BADGE_STYLE = {
  activo: {
    bg: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  finalizado: {
    bg: "rgba(6, 182, 212, 0.15)",
    color: "#06b6d4",
    border: "rgba(6, 182, 212, 0.3)",
  },
  cancelado: {
    bg: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
};
const TODOS_LOS_DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const TalleresPage = () => {
  const {
    talleres,
    fetchTalleres,
    createTaller,
    updateTaller,
    deleteTaller,
    loading,
  } = useTalleresStore();
  const { usuarios, fetchUsuarios } = useUsuariosStore();
  const { inscripciones, fetchInscripciones } = useInscripcionesStore();
  const { puedeEditar, puedeEliminar } = usePermisos();

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(cursoSchema),
    defaultValues: {
      diasCursada: ACADEMIC_CONFIG.diasLectivos,
      status: "activo",
      talleristaNombre: "",
    },
  });

  const diasSeleccionados = watch("diasCursada") || [];

  useEffect(() => {
    fetchTalleres();
    fetchUsuarios();
    fetchInscripciones();
  }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    reset({
      nombre: "",
      codigo: "",
      descripcion: "",
      docenteId: "",
      talleristaNombre: "",
      fechaInicio: "",
      fechaFin: "",
      horaInicio: "",
      horaFin: "",
      diasCursada: ACADEMIC_CONFIG.diasLectivos,
      status: "activo",
    });
    setShowModal(true);
  };

  const abrirModalEditar = (curso) => {
    setEditando(curso);
    reset({
      ...curso,
      docenteId: curso.docenteId || "",
      talleristaNombre: curso.talleristaNombre || "",
      diasCursada:
        typeof curso.diasCursada === "string"
          ? curso.diasCursada.split(",")
          : curso.diasCursada,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    reset();
  };

  const toggleDia = (dia) => {
    const actual = watch("diasCursada") || [];
    if (actual.includes(dia)) {
      setValue(
        "diasCursada",
        actual.filter((d) => d !== dia),
      );
    } else {
      setValue("diasCursada", [...actual, dia]);
    }
  };

  const onSubmit = async (data) => {
    const docenteSeleccionado = usuarios.find((u) => u.id === data.docenteId);
    const payload = {
      ...data,
      talleristaNombre:
        (data.talleristaNombre || "").trim() ||
        docenteSeleccionado?.nombre ||
        "",
    };

    const result = editando
      ? await updateTaller(editando.id, payload)
      : await createTaller(payload);
    if (result.ok) {
      toast.success(
        editando ? "Taller actualizado." : "Taller creado correctamente.",
      );
      cerrarModal();
    } else {
      toast.error(result.error);
    }
  };

  const confirmarEliminar = (curso) => {
    if (
      window.confirm(
        `¿Eliminar el taller "${curso.nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      handleEliminar(curso.id);
    }
  };

  const handleEliminar = async (id) => {
    const result = await deleteTaller(id);
    if (result.ok) toast.success("Taller eliminado.");
    else toast.error(result.error);
  };

  const getDocente = (docenteId) => usuarios.find((u) => u.id === docenteId);
  const getCantidadInscriptos = (tallerId) =>
    inscripciones.filter(
      (i) => i.tallerId === tallerId && i.status === "activo",
    ).length;
  const getTalleristaNombre = (curso) =>
    curso.talleristaNombre ||
    getDocente(curso.docenteId)?.nombre ||
    "Sin asignar";

  return (
    <MainLayout
      titulo="Talleres"
      subtitulo={`${talleres.length} talleres registrados en el programa`}
    >
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="text-muted fs-sm">
          Oferta académica activa:{" "}
          <strong className="text-heading-color">
            {talleres.filter((c) => c.status === "activo").length}
          </strong>
        </div>
        <div className="d-flex gap-2">
          {puedeEditar && (
            <button
              id="btn-nuevo-curso"
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold rounded-3 px-3 py-2 btn-primary-gradient"
              onClick={abrirModalNuevo}
            >
              <Plus size={16} /> Nuevo Taller
            </button>
          )}
        </div>
      </div>

      {/* Grid de talleres Responsivo */}
      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: "var(--primary-accent)" }}
          />
        </div>
      ) : talleres.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <BookOpen size={48} className="mb-3 opacity-50" />
          <p>No hay talleres registrados actualmente.</p>
        </div>
      ) : (
        <div className="row g-3">
          {talleres.map((curso) => {
            const docente = getDocente(curso.docenteId);
            const inscriptos = getCantidadInscriptos(curso.id);
            const talleristaNombre = getTalleristaNombre(curso);
            const dias =
              typeof curso.diasCursada === "string"
                ? curso.diasCursada.split(",")
                : curso.diasCursada || [];
            const badgeStyle =
              STATUS_BADGE_STYLE[curso.status] || STATUS_BADGE_STYLE.activo;

            return (
              <div key={curso.id} className="col-12 col-md-6 col-xl-4">
                <div className="app-card rounded-4 p-3 p-md-4 h-100 d-flex flex-column border-subtle-custom">
                  {/* Header de Card */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <span className="font-monospace text-muted fs-xs">
                        {curso.codigo}
                      </span>
                      <h3 className="h6 mb-0 fw-bold text-truncate text-heading-color mw-220">
                        {curso.nombre}
                      </h3>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        fontSize: "0.75rem",
                      }}
                    >
                      {STATUS_LABELS[curso.status] || curso.status}
                    </span>
                  </div>

                  {/* Descripción */}
                  {curso.descripcion && (
                    <p
                      className="text-muted mb-3"
                      style={{ fontSize: "0.82rem", lineHeight: 1.4 }}
                    >
                      {curso.descripcion}
                    </p>
                  )}

                  {/* Info */}
                  <div className="d-flex flex-column gap-2 mb-3 flex-grow-1">
                    <div className="d-flex justify-content-between text-sm">
                      <span className="text-muted">Tallerista:</span>
                      <span className="fw-semibold text-main-color">
                        {talleristaNombre}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-sm">
                      <span className="text-muted">Inscriptos:</span>
                      <span className="fw-semibold text-main-color">
                        {inscriptos} alumnos
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-sm">
                      <span className="text-muted">Período:</span>
                      <span className="text-main-color">
                        {formatearFechaCorta(curso.fechaInicio)} →{" "}
                        {formatearFechaCorta(curso.fechaFin)}
                      </span>
                    </div>
                    {curso.horaInicio && curso.horaFin && (
                      <div className="d-flex justify-content-between text-sm">
                        <span className="text-muted">Horario:</span>
                        <span className="text-main-color">
                          {curso.horaInicio} - {curso.horaFin} hs
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted d-block mb-1 text-sm">
                        Días de cursada:
                      </span>
                      <div className="d-flex flex-wrap gap-1">
                        {dias.map((dia) => (
                          <span key={dia} className="badge badge-accent-custom">
                            {DIAS_NOMBRES[dia] || dia}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {(puedeEditar || puedeEliminar) && (
                    <div className="d-flex gap-2 pt-3 border-top border-secondary border-opacity-25">
                      {puedeEditar && (
                        <button
                          type="button"
                          className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 rounded-3 btn-accent-custom"
                          onClick={() => abrirModalEditar(curso)}
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          type="button"
                          className="btn btn-sm rounded-3 px-3 btn-danger-custom"
                          onClick={() => confirmarEliminar(curso)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div
          className="app-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="app-modal-content" style={{ maxWidth: "580px" }}>
            <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h2 className="h5 mb-0 fw-bold text-heading-color">
                {editando ? "Editar Taller" : "Nuevo Taller"}
              </h2>
              <button
                type="button"
                className="btn btn-sm p-1 rounded-2 btn-outline-custom"
                onClick={cerrarModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <form
                id="form-curso"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <label className="form-label text-muted text-sm">
                      Nombre del Taller *
                    </label>
                    <input
                      className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
                      {...register("nombre")}
                      placeholder="Carpintería Básica"
                    />
                    {errors.nombre && (
                      <div className="invalid-feedback">
                        {errors.nombre.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-4">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Código *
                    </label>
                    <input
                      className={`form-control ${errors.codigo ? "is-invalid" : ""}`}
                      {...register("codigo")}
                      placeholder="CARP-101"
                    />
                    {errors.codigo && (
                      <div className="invalid-feedback">
                        {errors.codigo.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted text-sm">
                      Tallerista Responsable
                    </label>
                    <select
                      className={`form-select ${errors.docenteId ? "is-invalid" : ""}`}
                      {...register("docenteId")}
                    >
                      <option value="">
                        -- Seleccionar Tallerista del sistema --
                      </option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.email})
                        </option>
                      ))}
                    </select>
                    {errors.docenteId && (
                      <div className="invalid-feedback">
                        {errors.docenteId.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted text-sm">
                      Nombre del tallerista a cargo (manual)
                    </label>
                    <input
                      className={`form-control ${errors.talleristaNombre ? "is-invalid" : ""}`}
                      {...register("talleristaNombre")}
                      placeholder="Ej: Prof. Ana López"
                    />
                    {errors.talleristaNombre && (
                      <div className="invalid-feedback">
                        {errors.talleristaNombre.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted text-sm">
                      Fecha Inicio *
                    </label>

                    <input
                      type="date"
                      className={`form-control ${errors.fechaInicio ? "is-invalid" : ""}`}
                      {...register("fechaInicio")}
                    />
                    {errors.fechaInicio && (
                      <div className="invalid-feedback">
                        {errors.fechaInicio.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted text-sm">
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.fechaFin ? "is-invalid" : ""}`}
                      {...register("fechaFin")}
                    />
                    {errors.fechaFin && (
                      <div className="invalid-feedback">
                        {errors.fechaFin.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted text-sm">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      className={`form-control ${errors.horaInicio ? "is-invalid" : ""}`}
                      {...register("horaInicio")}
                    />
                    {errors.horaInicio && (
                      <div className="invalid-feedback">
                        {errors.horaInicio.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted text-sm">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      className={`form-control ${errors.horaFin ? "is-invalid" : ""}`}
                      {...register("horaFin")}
                    />
                    {errors.horaFin && (
                      <div className="invalid-feedback">
                        {errors.horaFin.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted text-sm">
                      Días de cursada *
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {TODOS_LOS_DIAS.map((dia) => {
                        const activo = diasSeleccionados.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            className="btn btn-sm rounded-3"
                            style={{
                              background: activo
                                ? "var(--primary-gradient)"
                                : "var(--bg-input)",
                              color: activo ? "#ffffff" : "var(--text-muted)",
                              border: activo
                                ? "none"
                                : "1px solid var(--border-subtle)",
                              fontSize: "0.78rem",
                            }}
                            onClick={() => toggleDia(dia)}
                          >
                            {DIAS_NOMBRES[dia]}
                          </button>
                        );
                      })}
                    </div>
                    {errors.diasCursada && (
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {errors.diasCursada.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted text-sm">
                      Estado del Taller *
                    </label>
                    <select
                      className={`form-select ${errors.status ? "is-invalid" : ""}`}
                      {...register("status")}
                    >
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    {errors.status && (
                      <div className="invalid-feedback">
                        {errors.status.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      {...register("descripcion")}
                      placeholder="Objetivos, temario y requisitos..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="app-modal-footer">
              <button
                type="button"
                className="btn btn-sm px-3 rounded-3 btn-outline-custom"
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-curso"
                className="btn btn-sm fw-semibold px-3 py-2 rounded-3 btn-primary-gradient"
                disabled={loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-1" />
                )}
                {editando ? "Guardar Cambios" : "Crear Taller"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TalleresPage;
