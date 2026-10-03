import { describe, it, expect } from 'vitest';
import {
  calcularPresentismo,
  detectarFaltasConsecutivas,
  generarAlertas,
} from '../../src/utils/asistenciaUtils.js';

describe('Reglas de Asistencia y Ausentismo Crítico (Regla de 5 Faltas)', () => {
  it('calcularPresentismo calcula correctamente los porcentajes con presentes y tardanzas', () => {
    const registros = [
      { estado: 'presente' },
      { estado: 'presente' },
      { estado: 'tarde' },
      { estado: 'ausente' },
    ];
    const res = calcularPresentismo(registros);
    expect(res.total).toBe(4);
    expect(res.presentes).toBe(2);
    expect(res.tarde).toBe(1);
    expect(res.ausentes).toBe(1);
    // (2 + 1) / 4 = 75%
    expect(res.porcentaje).toBe(75);
  });

  it('detectarFaltasConsecutivas detecta alerta cuando hay 5 ausencias consecutivas al final', () => {
    const registros = [
      { fecha: '2025-08-01', estado: 'presente' },
      { fecha: '2025-08-04', estado: 'ausente' },
      { fecha: '2025-08-05', estado: 'ausente' },
      { fecha: '2025-08-07', estado: 'ausente' },
      { fecha: '2025-08-08', estado: 'ausente' },
      { fecha: '2025-08-11', estado: 'ausente' },
    ];
    const res = detectarFaltasConsecutivas(registros, 5);
    expect(res.tieneAlerta).toBe(true);
    expect(res.rachaActual).toBe(5);
    expect(res.rachaInicio).toBe('2025-08-04');
  });

  it('detectarFaltasConsecutivas NO dispara alerta si la racha fue interrumpida por un presente', () => {
    const registros = [
      { fecha: '2025-08-01', estado: 'ausente' },
      { fecha: '2025-08-04', estado: 'ausente' },
      { fecha: '2025-08-05', estado: 'ausente' },
      { fecha: '2025-08-07', estado: 'ausente' },
      { fecha: '2025-08-08', estado: 'presente' }, // Corta la racha
      { fecha: '2025-08-11', estado: 'ausente' },
    ];
    const res = detectarFaltasConsecutivas(registros, 5);
    expect(res.tieneAlerta).toBe(false);
    expect(res.rachaActual).toBe(1);
  });

  it('generarAlertas extrae información detallada con pabellón y celda del interno en riesgo', () => {
    const internos = [
      {
        id: 'int-001',
        apellidoPaterno: 'García',
        apellidoMaterno: 'López',
        nombreCompleto: 'Marcos',
        pabellon: 1,
        celda: 3,
      },
    ];
    const asistencias = [
      { internoId: 'int-001', tallerId: 'tal-01', fecha: '2025-08-01', estado: 'ausente' },
      { internoId: 'int-001', tallerId: 'tal-01', fecha: '2025-08-02', estado: 'ausente' },
      { internoId: 'int-001', tallerId: 'tal-01', fecha: '2025-08-03', estado: 'ausente' },
      { internoId: 'int-001', tallerId: 'tal-01', fecha: '2025-08-04', estado: 'ausente' },
      { internoId: 'int-001', tallerId: 'tal-01', fecha: '2025-08-05', estado: 'ausente' },
    ];

    const alertas = generarAlertas({
      internos,
      asistencias,
      tallerId: 'tal-01',
      cursoNombre: 'Carpintería',
    });

    expect(alertas.length).toBe(1);
    expect(alertas[0].nombreInterno).toContain('García López, Marcos');
    expect(alertas[0].pabellon).toBe(1);
    expect(alertas[0].celda).toBe(3);
    expect(alertas[0].faltasConsecutivas).toBe(5);
  });
});
