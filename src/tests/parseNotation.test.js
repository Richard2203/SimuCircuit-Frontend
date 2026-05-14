/**
 * parseNotation y formatValue son la interfaz entre la entrada del usuario
 * y el valor en SI que se envia al backend. Si parsean mal, los calculos
 * del simulador seran incorrectos.
 *
 * Pruebas
 *   - Sufijos de ingenieria estandar (k, M, m, µ, n, p) y sus variantes
 *   - Notacion cientifica (1e-6)
 *   - Casos borde: vacio, null, solo sufijo sin numero
 *   - formatValue: round-trip SI -> string legible
 */

import { describe, it, expect } from 'vitest';
import { parseNotation, formatValue } from '../components/Simulator/models/ComponentValueLabel';

// parseNotation

describe('parseNotation — sufijos de ingeniería', () => {
  it('número sin sufijo pasa directo', () => {
    expect(parseNotation('100')).toBe(100);
  });

  it('k multiplica por 1000', () => {
    expect(parseNotation('10k')).toBe(10_000);
  });

  it('K mayúscula es equivalente a k', () => {
    expect(parseNotation('10K')).toBe(10_000);
  });

  it('4.7k se convierte correctamente con decimal', () => {
    expect(parseNotation('4.7k')).toBeCloseTo(4700);
  });

  it('meg convierte a millones', () => {
    expect(parseNotation('1meg')).toBe(1_000_000);
  });

  it('u convierte a micro (×1e-6)', () => {
    expect(parseNotation('1u')).toBeCloseTo(1e-6);
  });

  it('µ (unicode) convierte a micro', () => {
    expect(parseNotation('4.7µ')).toBeCloseTo(4.7e-6);
  });

  it('n convierte a nano (×1e-9)', () => {
    expect(parseNotation('10n')).toBeCloseTo(10e-9);
  });

  it('notación científica 1e-6 se parsea correctamente', () => {
    expect(parseNotation('1e-6')).toBeCloseTo(1e-6);
  });

  it('ignora espacios en blanco alrededor', () => {
    expect(parseNotation('  10k  ')).toBe(10_000);
  });
});

describe('parseNotation — valores inválidos', () => {
  it('string vacío devuelve NaN', () => {
    expect(parseNotation('')).toBeNaN();
  });

  it('null devuelve NaN', () => {
    expect(parseNotation(null)).toBeNaN();
  });

  it('solo sufijo sin número devuelve NaN', () => {
    expect(parseNotation('k')).toBeNaN();
  });

  it('texto sin número devuelve NaN', () => {
    expect(parseNotation('abc')).toBeNaN();
  });
});

// formatValue

describe('formatValue — SI a string legible', () => {
  it('1000 Ω → 1kΩ', () => {
    expect(formatValue(1000, 'Ω')).toBe('1kΩ');
  });

  it('4700 Ω → 4.7kΩ', () => {
    expect(formatValue(4700, 'Ω')).toBe('4.7kΩ');
  });

  it('1_000_000 Ω → 1MΩ', () => {
    expect(formatValue(1_000_000, 'Ω')).toBe('1MΩ');
  });

  it('100e-6 F → 100µF', () => {
    expect(formatValue(100e-6, 'F')).toBe('100µF');
  });

  it('12 V → 12V (sin prefijo para valores >= 1)', () => {
    expect(formatValue(12, 'V')).toBe('12V');
  });

  it('0.016776 A → 16.8mA', () => {
    expect(formatValue(0.016776, 'A')).toBe('16.8mA');
  });

  it('0 V → "0V" sin prefijo pico (bug corregido)', () => {
    expect(formatValue(0, 'V')).toBe('0V');
  });

  it('0 A → "0A" sin prefijo pico', () => {
    expect(formatValue(0, 'A')).toBe('0A');
  });

  it('NaN → "—Ω"', () => {
    expect(formatValue(NaN, 'Ω')).toBe('—Ω');
  });

  it('null → "—V"', () => {
    expect(formatValue(null, 'V')).toBe('—V');
  });

  it('round-trip: parseNotation → formatValue es estable para 4.7kΩ', () => {
    const si = parseNotation('4.7k');
    expect(formatValue(si, 'Ω')).toBe('4.7kΩ');
  });
});
