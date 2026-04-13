/**
 * PRUEBAS UNITARIAS — parseNotation & formatValue
 *
 * ¿Que se prueba?
 *   - Que el parser convierte correctamente notacion de ingenieria a SI
 *   - Que el formateador convierte SI a strings legibles
 *   - Casos borde: valores invalidos, cero, negativos
 
 */

import { describe, it, expect } from 'vitest';
import { parseNotation, formatValue } from '../components/Simulator/models/ComponentValueLabel';

// ─── parseNotation ────────────────────────────────────────────────────────────

describe('parseNotation — sufijos de ingenieria', () => {
  it('parsea numero simple sin sufijo', () => {
    expect(parseNotation('100')).toBe(100);
  });

  it('parsea kilo (k) → ×1000', () => {
    expect(parseNotation('10k')).toBe(10_000);
  });

  it('parsea kilo con decimal (4.7k)', () => {
    expect(parseNotation('4.7k')).toBeCloseTo(4700);
  });

  it('parsea mega (meg o M)', () => {
    expect(parseNotation('1meg')).toBe(1_000_000);
  });

  it('parsea micro con u (1u)', () => {
    expect(parseNotation('1u')).toBeCloseTo(1e-6);
  });

  it('parsea micro con µ (4.7µ)', () => {
    expect(parseNotation('4.7µ')).toBeCloseTo(4.7e-6);
  });

  it('parsea nano (10n)', () => {
    expect(parseNotation('10n')).toBeCloseTo(10e-9);
  });

  it('parsea notacion cientifica (1e-6)', () => {
    expect(parseNotation('1e-6')).toBeCloseTo(1e-6);
  });

  it('parsea notacion cientifica (2.2e3)', () => {
    expect(parseNotation('2.2e3')).toBeCloseTo(2200);
  });

  it('ignora espacios en blanco alrededor', () => {
    expect(parseNotation('  10k  ')).toBe(10_000);
  });

  it('es case-insensitive (10K = 10k)', () => {
    expect(parseNotation('10K')).toBe(10_000);
  });
});

describe('parseNotation — valores invalidos', () => {
  it('retorna NaN para string vacio', () => {
    expect(parseNotation('')).toBeNaN();
  });

  it('retorna NaN para null', () => {
    expect(parseNotation(null)).toBeNaN();
  });

  it('retorna NaN para undefined', () => {
    expect(parseNotation(undefined)).toBeNaN();
  });

  it('retorna NaN para texto sin numero (abc)', () => {
    expect(parseNotation('abc')).toBeNaN();
  });

  it('retorna NaN para sufijo sin numero (k)', () => {
    expect(parseNotation('k')).toBeNaN();
  });
});

// ─── formatValue ─────────────────────────────────────────────────────────────

describe('formatValue — conversion SI a string legible', () => {
  it('formatea 1000 Ω como 1kΩ', () => {
    expect(formatValue(1000, 'Ω')).toBe('1kΩ');
  });

  it('formatea 10000 Ω como 10kΩ', () => {
    expect(formatValue(10_000, 'Ω')).toBe('10kΩ');
  });

  it('formatea 1000000 Ω como 1MΩ', () => {
    expect(formatValue(1_000_000, 'Ω')).toBe('1MΩ');
  });

  it('formatea 4700 Ω como 4.7kΩ', () => {
    expect(formatValue(4700, 'Ω')).toBe('4.7kΩ');
  });

  it('formatea 0.0001 F como 100µF', () => {
    expect(formatValue(100e-6, 'F')).toBe('100µF');
  });

  it('formatea 12 V como 12V', () => {
    expect(formatValue(12, 'V')).toBe('12V');
  });

  it('retorna —Ω para NaN', () => {
    expect(formatValue(NaN, 'Ω')).toBe('—Ω');
  });

  it('retorna —V para null', () => {
    expect(formatValue(null, 'V')).toBe('—V');
  });
});
