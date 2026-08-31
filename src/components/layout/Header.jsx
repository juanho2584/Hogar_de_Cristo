/**
 * @fileoverview Header — Barra superior con título de página y fecha.
 */

import { hoyISO, formatearFechaLarga, esDiaLectivo } from '../../utils/dateUtils.js';
import { CalendarCheck, AlertTriangle } from 'lucide-react';

/**
 * @param {{ titulo: string, subtitulo?: string }} props
 */
const Header = ({ titulo, subtitulo }) => {
  const hoy = hoyISO();
  const diaLectivo = esDiaLectivo(hoy);

  return (
    <div
      className="d-flex align-items-center justify-content-between px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Título */}
      <div>
        <h1 className="h5 mb-0 text-white fw-bold">{titulo}</h1>
        {subtitulo && (
          <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Fecha + indicador día lectivo */}
      <div className="d-flex align-items-center gap-3">
        <div className="text-end">
          <div className="text-white" style={{ fontSize: '0.85rem' }}>
            {formatearFechaLarga(hoy)}
          </div>
          <div className="d-flex align-items-center justify-content-end gap-1 mt-1">
            {diaLectivo ? (
              <>
                <CalendarCheck size={14} className="text-success" />
                <span className="text-success" style={{ fontSize: '0.75rem' }}>
                  Día lectivo — Asistencia habilitada
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="text-warning" />
                <span className="text-warning" style={{ fontSize: '0.75rem' }}>
                  Día no lectivo
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
