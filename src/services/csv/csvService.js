/**
 * @fileoverview Servicio CSV — Importación y exportación de datos.
 * Usa papaparse para parseo y generación de CSVs.
 */

import Papa from "papaparse";

/**
 * Descarga un string como archivo en el navegador.
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} [mimeType]
 */
export const downloadFile = (
  content,
  filename,
  mimeType = "text/csv;charset=utf-8;",
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta un array de objetos a CSV y lo descarga.
 * @param {Array<Object>} data
 * @param {string} filename
 * @param {string[]} [fields] - Columnas específicas (en orden)
 */
export const exportToCsv = (data, filename, fields) => {
  const csv = Papa.unparse(data, {
    columns: fields,
    header: true,
    quotes: true,
  });
  downloadFile(csv, filename);
};

/**
 * Lee un archivo CSV y retorna un array de objetos.
 * @param {File} file
 * @returns {Promise<{data: Array, errors: Array}>}
 */
export const importFromCsv = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Mantener strings para IDs y fechas
      complete: (results) =>
        resolve({ data: results.data, errors: results.errors }),
      error: (err) => reject(err),
    });
  });
};

/** Configuraciones de exportación por entidad */
export const CSV_CONFIG = {
  internos: {
    filename: "internos.csv",
    fields: [
      "id",
      "apellidoPaterno",
      "apellidoMaterno",
      "nombreCompleto",
      "dni",
      "fichaCriminologica",
      "pabellon",
      "celda",
      "status",
      "fechaIngreso",
      "notas",
    ],
  },
  talleres: {
    filename: "talleres.csv",
    fields: [
      "id",
      "nombre",
      "codigo",
      "descripcion",
      "docenteId",
      "diasCursada",
      "fechaInicio",
      "fechaFin",
      "status",
    ],
  },
  inscripciones: {
    filename: "inscripciones.csv",
    fields: ["id", "internoId", "tallerId", "fechaInscripcion", "status"],
  },
  asistencia: {
    filename: "asistencia.csv",
    fields: [
      "id",
      "internoId",
      "tallerId",
      "fecha",
      "estado",
      "notas",
      "registradoPor",
    ],
  },
};
