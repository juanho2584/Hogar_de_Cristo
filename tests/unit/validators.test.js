import { describe, it, expect } from 'vitest';
import {
  evaluarFortalezaPassword,
  STRONG_PASSWORD_REGEX,
  loginSchema,
  internoSchema,
} from '../../src/utils/validators.js';

describe('Validadores y Criterios de Seguridad', () => {
  describe('evaluarFortalezaPassword', () => {
    it('debe catalogar como Muy Débil o Débil contraseñas cortas o simples', () => {
      const res = evaluarFortalezaPassword('123456');
      expect(res.label).toBe('Débil');
      expect(res.checks.length).toBe(false);
    });

    it('debe catalogar como Fuerte o Excelente contraseñas que cumplen todos los requisitos', () => {
      const res = evaluarFortalezaPassword('Hogar2025!Seguro');
      expect(res.score).toBe(4);
      expect(res.label).toBe('Excelente');
      expect(res.checks.length).toBe(true);
      expect(res.checks.uppercase).toBe(true);
      expect(res.checks.lowercase).toBe(true);
      expect(res.checks.number).toBe(true);
      expect(res.checks.special).toBe(true);
    });
  });

  describe('Regex de Contraseña Fuerte', () => {
    it('debe validar contraseñas con mayúscula, minúscula, número y símbolo', () => {
      expect(STRONG_PASSWORD_REGEX.test('Admin#2025')).toBe(true);
      expect(STRONG_PASSWORD_REGEX.test('password')).toBe(false);
      expect(STRONG_PASSWORD_REGEX.test('Password123')).toBe(false); // falta símbolo
    });
  });

  describe('Yup Schemas', () => {
    it('loginSchema debe rechazar emails inválidos', async () => {
      await expect(
        loginSchema.validate({ email: 'correo-invalido', password: '123' })
      ).rejects.toThrow();
    });

    it('internoSchema debe validar DNI de 7 u 8 dígitos', async () => {
      const valido = {
        apellidoPaterno: 'González',
        apellidoMaterno: 'Pérez',
        nombreCompleto: 'Juan',
        dni: '30123456',
        fichaCriminologica: '1234',
        pabellon: 1,
        sector: 'A',
        celda: 2,
        fechaIngreso: '2025-01-01',
        status: 'activo',
      };
      await expect(internoSchema.validate(valido)).resolves.toBeTruthy();

      const dniInvalido = { ...valido, dni: '123' };
      await expect(internoSchema.validate(dniInvalido)).rejects.toThrow();
    });
  });
});
