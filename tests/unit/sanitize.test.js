import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeFormData } from '../../src/utils/sanitize.js';

describe('Sanitización de Inputs (DOMPurify - OWASP XSS)', () => {
  it('debe limpiar scripts e inyecciones HTML peligrosas de una cadena', () => {
    const maliciousInput = '<script>alert("XSS")</script>Texto legítimo';
    const clean = sanitizeText(maliciousInput);
    expect(clean).toBe('Texto legítimo');
  });

  it('debe eliminar eventos onclick y tags maliciosos', () => {
    const maliciousImg = '<img src="x" onerror="stealCookies()" />Observaciones del interno';
    const clean = sanitizeText(maliciousImg);
    expect(clean).toBe('Observaciones del interno');
  });

  it('debe sanitizar recursivamente un objeto de formulario completo', () => {
    const formData = {
      nombreCompleto: 'Juan <script>alert(1)</script>Pérez',
      notas: '<b>Sin novedad</b>',
      pabellon: 1,
      detalles: {
        observacion: '<iframe src="evil.com"></iframe>Trato cordial',
      },
    };

    const sanitized = sanitizeFormData(formData);
    expect(sanitized.nombreCompleto).toBe('Juan Pérez');
    expect(sanitized.notas).toBe('Sin novedad');
    expect(sanitized.pabellon).toBe(1);
    expect(sanitized.detalles.observacion).toBe('Trato cordial');
  });
});
